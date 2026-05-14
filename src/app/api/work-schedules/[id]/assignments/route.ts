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
      status: true,
      workDate: true,
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
    },
  });

  if (!schedule) {
    return NextResponse.json(
      { error: "Planning introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json(schedule);
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canScheduleWork(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      assignments: Array<{
        userId: string;
        postId: string;
        isLeader?: boolean;
        isSubleader?: boolean;
        attendanceStatus?: "scheduled" | "present" | "absent" | "excused";
      }>;
    }>;

    const assignments = body.assignments ?? [];

    const seenAssignments = new Set<string>();
    const duplicateAssignment = assignments.find(item => {
      const key = `${item.userId}:${item.postId}`;
      if (seenAssignments.has(key)) {
        return true;
      }
      seenAssignments.add(key);
      return false;
    });

    if (duplicateAssignment) {
      return NextResponse.json(
        { error: "Chaque personnel ne peut apparaitre qu'une seule fois." },
        { status: 400 }
      );
    }

    const schedule = await prisma.workSchedule.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
        status: true,
        workDate: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Planning introuvable." },
        { status: 404 }
      );
    }

    if (schedule.status === "archived") {
      return NextResponse.json(
        { error: "Ce planning est archive." },
        { status: 400 }
      );
    }

    if (isPastScheduleDate(schedule.workDate)) {
      return NextResponse.json(
        {
          error:
            "Ce planning ne peut plus etre modifie car sa date est passee.",
        },
        { status: 400 }
      );
    }

    const userIds = assignments.map(item => item.userId).filter(Boolean);
    const postIds = assignments.map(item => item.postId).filter(Boolean);

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

    const invalid = assignments.find(
      item => !validUserSet.has(item.userId) || !validPostSet.has(item.postId)
    );

    if (invalid) {
      return NextResponse.json(
        {
          error:
            "Chaque affectation doit contenir un utilisateur et un poste actifs de l'agence.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.workScheduleAssignment.deleteMany({
        where: { workScheduleId: id },
      }),
      ...(assignments.length
        ? [
            prisma.workScheduleAssignment.createMany({
              data: assignments.map(item => ({
                workScheduleId: id,
                userId: item.userId,
                postId: item.postId,
                isLeader: Boolean(item.isLeader),
                isSubleader: Boolean(item.isSubleader),
                attendanceStatus: item.attendanceStatus ?? "scheduled",
              })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de mettre a jour les affectations." },
      { status: 500 }
    );
  }
}
