import { NextResponse } from "next/server";
import { canScheduleWork } from "@/lib/authz";
import {
  buildScheduleIncidentRequirements,
  normalizeScheduleDate,
} from "@/lib/work-schedules";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canScheduleWork(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      workDate: string;
    }>;

    const workDate = normalizeScheduleDate(body.workDate);

    if (!workDate) {
      return NextResponse.json(
        { error: "Une nouvelle date de travail est obligatoire." },
        { status: 400 }
      );
    }

    const sourceSchedule = await prisma.workSchedule.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
        serviceId: true,
        assignments: {
          select: {
            userId: true,
            postId: true,
            isLeader: true,
            isSubleader: true,
          },
        },
      },
    });

    if (!sourceSchedule) {
      return NextResponse.json(
        { error: "Planning introuvable." },
        { status: 404 }
      );
    }

    const duplicated = await prisma.$transaction(async transaction => {
      const schedule = await transaction.workSchedule.create({
        data: {
          agencyId: session.activeAgencyId,
          serviceId: sourceSchedule.serviceId,
          workDate,
          status: "draft",
          createdById: session.userId,
        },
        select: {
          id: true,
          workDate: true,
          status: true,
        },
      });

      const incidentRequirements = await buildScheduleIncidentRequirements(
        transaction,
        session.activeAgencyId,
        sourceSchedule.serviceId,
        schedule.id
      );

      if (incidentRequirements.length) {
        await transaction.workScheduleIncidentRequirement.createMany({
          data: incidentRequirements,
        });
      }

      if (sourceSchedule.assignments.length) {
        await transaction.workScheduleAssignment.createMany({
          data: sourceSchedule.assignments.map(assignment => ({
            workScheduleId: schedule.id,
            userId: assignment.userId,
            postId: assignment.postId,
            isLeader: assignment.isLeader,
            isSubleader: assignment.isSubleader,
            attendanceStatus: "scheduled",
          })),
        });
      }

      return schedule;
    });

    return NextResponse.json(
      {
        ok: true,
        schedule: {
          ...duplicated,
          workDate: duplicated.workDate.toISOString(),
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
      { error: "Impossible de dupliquer le planning." },
      { status: 500 }
    );
  }
}
