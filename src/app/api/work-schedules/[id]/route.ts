import { NextResponse } from "next/server";
import { canScheduleWork } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { isPastScheduleDate } from "@/lib/work-schedules";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canScheduleWork(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  const schedule = await prisma.workSchedule.findFirst({
    where: {
      id,
      agencyId: session.activeAgencyId,
    },
    select: {
      id: true,
      workDate: true,
      status: true,
      publishedAt: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      service: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignments: {
        orderBy: [{ isLeader: "desc" }, { isSubleader: "desc" }],
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
          post: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      incidentRequirements: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          displayOrder: true,
          isActive: true,
          configSnapshotJson: true,
        },
      },
    },
  });

  if (!schedule) {
    return NextResponse.json(
      { error: "Planning introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    schedule: {
      ...schedule,
      workDate: schedule.workDate.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      publishedAt: schedule.publishedAt?.toISOString() ?? null,
      archivedAt: schedule.archivedAt?.toISOString() ?? null,
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canScheduleWork(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      status: "draft" | "published" | "archived";
    }>;

    if (
      body.status !== "draft" &&
      body.status !== "published" &&
      body.status !== "archived"
    ) {
      return NextResponse.json(
        { error: "Statut de planning invalide." },
        { status: 400 }
      );
    }

    const existing = await prisma.workSchedule.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        workDate: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Planning introuvable." },
        { status: 404 }
      );
    }

    if (isPastScheduleDate(existing.workDate)) {
      return NextResponse.json(
        {
          error:
            "Ce planning ne peut plus etre modifie car sa date est passee.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const updateData =
      body.status === "draft"
        ? { status: body.status, publishedAt: null, archivedAt: null }
        : body.status === "published"
          ? {
              status: body.status,
              publishedAt: existing.publishedAt ?? now,
              archivedAt: null,
            }
          : {
              status: body.status,
              archivedAt: now,
            };

    await prisma.workSchedule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de mettre a jour le planning." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canScheduleWork(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.workSchedule.findFirst({
    where: {
      id,
      agencyId: session.activeAgencyId,
    },
    select: {
      id: true,
      workDate: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Planning introuvable." },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const scheduleDate = existing.workDate.toISOString().slice(0, 10);

  if (scheduleDate <= today) {
    return NextResponse.json(
      {
        error: "Seuls les plannings futurs peuvent etre supprimes.",
      },
      { status: 400 }
    );
  }

  await prisma.workSchedule.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ ok: true });
}
