import { NextResponse } from "next/server";
import { canScheduleWork } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import {
  buildScheduleIncidentRequirements,
  formatScheduleDateKey,
  isPastScheduleDate,
  isWeekWithinPlanningWindow,
  listWeekDates,
  parseWeekStart,
} from "@/lib/work-schedules";

type WeeklyAssignmentInput = {
  userId: string;
  postId: string;
  isLeader?: boolean;
  isSubleader?: boolean;
};

type WeeklyPayload = {
  serviceId?: string;
  weekStart?: string;
  status?: "draft" | "published";
  assignmentsByDate?: Record<string, WeeklyAssignmentInput[]>;
};

function getStatusTimestamps(status: "draft" | "published") {
  if (status === "published") {
    return {
      publishedAt: new Date(),
      archivedAt: null,
    };
  }

  return {
    publishedAt: null,
    archivedAt: null,
  };
}

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session || !canScheduleWork(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const serviceId = (searchParams.get("serviceId") || "").trim();
  const weekStart = parseWeekStart(searchParams.get("weekStart") || undefined);

  if (!serviceId || !weekStart) {
    return NextResponse.json(
      { error: "Le service et la semaine sont obligatoires." },
      { status: 400 }
    );
  }

  const weekDates = listWeekDates(weekStart);
  const weekEnd = weekDates[weekDates.length - 1];

  const schedules = await prisma.workSchedule.findMany({
    where: {
      agencyId: session.activeAgencyId,
      serviceId,
      workDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    orderBy: [{ workDate: "asc" }],
    select: {
      id: true,
      workDate: true,
      status: true,
      assignments: {
        orderBy: [
          { isLeader: "desc" },
          { isSubleader: "desc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          userId: true,
          postId: true,
          isLeader: true,
          isSubleader: true,
          attendanceStatus: true,
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      },
    },
  });

  const scheduleByDay = new Map(
    schedules.map(schedule => [
      formatScheduleDateKey(schedule.workDate),
      schedule,
    ])
  );

  return NextResponse.json({
    weekStart: formatScheduleDateKey(weekStart),
    weekEnd: formatScheduleDateKey(weekEnd),
    days: weekDates.map(day => {
      const date = formatScheduleDateKey(day);
      const schedule = scheduleByDay.get(date);

      return {
        date,
        schedule: schedule
          ? {
              id: schedule.id,
              status: schedule.status,
              assignments: schedule.assignments,
            }
          : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canScheduleWork(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as WeeklyPayload;
    const serviceId = body.serviceId?.trim();
    const status = body.status === "published" ? "published" : "draft";
    const weekStart = parseWeekStart(body.weekStart);

    if (!serviceId || !weekStart) {
      return NextResponse.json(
        { error: "Le service et la semaine sont obligatoires." },
        { status: 400 }
      );
    }

    if (!isWeekWithinPlanningWindow(weekStart)) {
      return NextResponse.json(
        {
          error:
            "La semaine doit etre comprise entre la semaine courante et 3 mois a venir.",
        },
        { status: 400 }
      );
    }

    const service = await prisma.serviceDefinition.findFirst({
      where: {
        id: serviceId,
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable pour l'agence active." },
        { status: 400 }
      );
    }

    const weekDates = listWeekDates(weekStart);
    const weekDateKeys = new Set(weekDates.map(formatScheduleDateKey));
    const assignmentsByDate = body.assignmentsByDate ?? {};

    const invalidDateKey = Object.keys(assignmentsByDate).find(
      date => !weekDateKeys.has(date)
    );

    if (invalidDateKey) {
      return NextResponse.json(
        { error: "Le payload contient une date hors semaine selectionnee." },
        { status: 400 }
      );
    }

    for (const day of Object.keys(assignmentsByDate)) {
      const seenUsers = new Set<string>();

      for (const assignment of assignmentsByDate[day] || []) {
        if (!assignment.userId || !assignment.postId) {
          return NextResponse.json(
            {
              error: "Chaque affectation doit avoir un personnel et un poste.",
            },
            { status: 400 }
          );
        }

        if (seenUsers.has(assignment.userId)) {
          return NextResponse.json(
            {
              error:
                "Un personnel ne peut etre affecte qu'une seule fois sur la meme journee.",
            },
            { status: 400 }
          );
        }

        seenUsers.add(assignment.userId);
      }
    }

    const userIds = Array.from(
      new Set(
        Object.values(assignmentsByDate)
          .flat()
          .map(item => item.userId)
          .filter(Boolean)
      )
    );

    const postIds = Array.from(
      new Set(
        Object.values(assignmentsByDate)
          .flat()
          .map(item => item.postId)
          .filter(Boolean)
      )
    );

    const [validMemberships, validPosts] = await Promise.all([
      prisma.userAgencyMembership.findMany({
        where: {
          agencyId: session.activeAgencyId,
          isActive: true,
          userId: { in: userIds },
        },
        select: {
          userId: true,
        },
      }),
      prisma.workPost.findMany({
        where: {
          agencyId: session.activeAgencyId,
          isActive: true,
          id: { in: postIds },
        },
        select: {
          id: true,
        },
      }),
    ]);

    const validUserSet = new Set(validMemberships.map(item => item.userId));
    const validPostSet = new Set(validPosts.map(item => item.id));

    const invalidUserId = userIds.find(userId => !validUserSet.has(userId));
    if (invalidUserId) {
      return NextResponse.json(
        {
          error: "Un personnel selectionne n'appartient pas a l'agence active.",
        },
        { status: 400 }
      );
    }

    const invalidPostId = postIds.find(postId => !validPostSet.has(postId));
    if (invalidPostId) {
      return NextResponse.json(
        { error: "Un poste selectionne est invalide pour l'agence active." },
        { status: 400 }
      );
    }

    const weekEnd = weekDates[weekDates.length - 1];

    const existingSchedules = await prisma.workSchedule.findMany({
      where: {
        agencyId: session.activeAgencyId,
        serviceId,
        workDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: {
        id: true,
        workDate: true,
        status: true,
      },
    });

    const existingByDate = new Map(
      existingSchedules.map(schedule => [
        formatScheduleDateKey(schedule.workDate),
        schedule,
      ])
    );

    const createdDays: string[] = [];
    const updatedDays: string[] = [];
    const skippedDays: Array<{ date: string; reason: string }> = [];

    await prisma.$transaction(async transaction => {
      for (const day of weekDates) {
        const dateKey = formatScheduleDateKey(day);

        if (isPastScheduleDate(day)) {
          skippedDays.push({
            date: dateKey,
            reason: "Date passee, jour ignore.",
          });
          continue;
        }

        const existing = existingByDate.get(dateKey);
        const dayAssignments = assignmentsByDate[dateKey] || [];

        if (existing) {
          if (existing.status === "archived") {
            skippedDays.push({
              date: dateKey,
              reason: "Planning archive, jour non modifie.",
            });
            continue;
          }

          await transaction.workSchedule.update({
            where: { id: existing.id },
            data: {
              status,
              ...getStatusTimestamps(status),
            },
          });

          await transaction.workScheduleAssignment.deleteMany({
            where: {
              workScheduleId: existing.id,
            },
          });

          if (dayAssignments.length) {
            await transaction.workScheduleAssignment.createMany({
              data: dayAssignments.map(assignment => ({
                workScheduleId: existing.id,
                userId: assignment.userId,
                postId: assignment.postId,
                isLeader: Boolean(assignment.isLeader),
                isSubleader: Boolean(assignment.isSubleader),
                attendanceStatus: "scheduled",
              })),
            });
          }

          updatedDays.push(dateKey);
          continue;
        }

        const created = await transaction.workSchedule.create({
          data: {
            agencyId: session.activeAgencyId,
            serviceId,
            workDate: day,
            status,
            createdById: session.userId,
            ...getStatusTimestamps(status),
          },
          select: {
            id: true,
          },
        });

        const incidentRequirements = await buildScheduleIncidentRequirements(
          transaction,
          session.activeAgencyId,
          serviceId,
          created.id
        );

        if (incidentRequirements.length) {
          await transaction.workScheduleIncidentRequirement.createMany({
            data: incidentRequirements,
          });
        }

        if (dayAssignments.length) {
          await transaction.workScheduleAssignment.createMany({
            data: dayAssignments.map(assignment => ({
              workScheduleId: created.id,
              userId: assignment.userId,
              postId: assignment.postId,
              isLeader: Boolean(assignment.isLeader),
              isSubleader: Boolean(assignment.isSubleader),
              attendanceStatus: "scheduled",
            })),
          });
        }

        createdDays.push(dateKey);
      }
    });

    return NextResponse.json({
      ok: true,
      result: {
        weekStart: formatScheduleDateKey(weekStart),
        createdDays,
        updatedDays,
        skippedDays,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de traiter le planning hebdomadaire." },
      { status: 500 }
    );
  }
}
