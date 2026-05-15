import { NextResponse } from "next/server";
import {
  buildScheduleIncidentRequirements,
  isPastScheduleDate,
  normalizeScheduleDate,
} from "@/lib/work-schedules";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(
      session,
      "work_schedule_create",
      "work_schedule_read",
      "work_schedule_update",
      "work_schedule_publish",
      "work_schedule_delete",
      "work_schedule_print"
    )
  ) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = normalizeScheduleDate(searchParams.get("from") || undefined);
  const to = normalizeScheduleDate(searchParams.get("to") || undefined);
  const serviceId = (searchParams.get("serviceId") || "").trim();

  const schedules = await prisma.workSchedule.findMany({
    where: {
      agencyId: session.activeAgencyId,
      ...(serviceId ? { serviceId } : {}),
      ...(from || to
        ? {
            workDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      workDate: true,
      status: true,
      createdAt: true,
      service: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignments: {
        select: {
          id: true,
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
          post: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    schedules: schedules.map(schedule => ({
      ...schedule,
      workDate: schedule.workDate.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(session, "work_schedule_create", "work_schedule_update")
  ) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      serviceId: string;
      workDate: string;
      status: "draft" | "published" | "archived";
    }>;

    const serviceId = body.serviceId?.trim();
    const workDate = normalizeScheduleDate(body.workDate);

    if (!serviceId || !workDate) {
      return NextResponse.json(
        { error: "Le service et la date de travail sont obligatoires." },
        { status: 400 }
      );
    }

    if (isPastScheduleDate(workDate)) {
      return NextResponse.json(
        { error: "La date de travail ne peut pas etre dans le passe." },
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

    const scheduleId = await prisma.$transaction(async transaction => {
      const schedule = await transaction.workSchedule.create({
        data: {
          agencyId: session.activeAgencyId,
          serviceId,
          workDate,
          status: body.status ?? "draft",
          createdById: session.userId,
        },
        select: {
          id: true,
        },
      });

      const incidentRequirements = await buildScheduleIncidentRequirements(
        transaction,
        session.activeAgencyId,
        serviceId,
        schedule.id
      );

      if (incidentRequirements.length) {
        await transaction.workScheduleIncidentRequirement.createMany({
          data: incidentRequirements,
        });
      }

      return schedule.id;
    });

    const schedule = await prisma.workSchedule.findFirst({
      where: { id: scheduleId, agencyId: session.activeAgencyId },
      select: {
        id: true,
        workDate: true,
        status: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Impossible de creer le planning." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        schedule: {
          ...schedule,
          workDate: schedule.workDate.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Un planning existe deja pour cette date et ce service." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de creer le planning." },
      { status: 500 }
    );
  }
}
