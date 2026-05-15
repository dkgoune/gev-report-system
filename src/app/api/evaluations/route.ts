import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { buildScopedUserWhere, listScopedUsers } from "@/lib/user-scope";
import { hasPermission } from "@/lib/permissions";

function normalizePage(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function normalizePageSize(value: string | null) {
  const parsed = Number(value);
  if (parsed === 20 || parsed === 50) {
    return parsed;
  }
  return 10;
}

function normalizeDateInput(value: string | null) {
  if (!value) {
    return "";
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "evaluation_read")) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("q") || "").trim();
  const criteriaId = (searchParams.get("criteriaId") || "").trim();
  const workScheduleId = (searchParams.get("workScheduleId") || "").trim();
  const startDate = normalizeDateInput(searchParams.get("from"));
  const endDate = normalizeDateInput(searchParams.get("to"));
  const pageSize = normalizePageSize(searchParams.get("pageSize"));

  const where: Prisma.PersonnelEvaluationWhereInput = {
    workSchedule: {
      agencyId: session.activeAgencyId,
    },
  };
  const workScheduleWhere: Prisma.WorkScheduleWhereInput = {
    agencyId: session.activeAgencyId,
  };

  if (search) {
    where.OR = [
      {
        evaluatedUser: { fullName: { contains: search, mode: "insensitive" } },
      },
      { criterion: { name: { contains: search, mode: "insensitive" } } },
      {
        evaluatingLeader: {
          fullName: { contains: search, mode: "insensitive" },
        },
      },
      { comment: { contains: search, mode: "insensitive" } },
      {
        workSchedule: {
          service: { name: { contains: search, mode: "insensitive" } },
        },
      },
    ];
  }

  if (criteriaId) {
    where.criterionId = criteriaId;
  }

  if (workScheduleId) {
    where.workScheduleId = workScheduleId;
  }

  if (startDate || endDate) {
    workScheduleWhere.workDate = {};

    if (startDate) {
      workScheduleWhere.workDate = {
        ...(workScheduleWhere.workDate as Prisma.DateTimeFilter<"WorkSchedule">),
        gte: new Date(`${startDate}T00:00:00.000Z`),
      };
    }

    if (endDate) {
      workScheduleWhere.workDate = {
        ...(workScheduleWhere.workDate as Prisma.DateTimeFilter<"WorkSchedule">),
        lte: new Date(`${endDate}T00:00:00.000Z`),
      };
    }

    where.workSchedule = workScheduleWhere;
  }

  const [totalItems, users, criteria, schedules] = await Promise.all([
    prisma.personnelEvaluation.count({ where }),
    listScopedUsers(session),
    prisma.criterion.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      orderBy: [{ impact: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        impact: true,
        maxDaily: true,
      },
    }),
    prisma.workSchedule.findMany({
      where: {
        agencyId: session.activeAgencyId,
        status: "published",
      },
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        workDate: true,
        service: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const page = Math.min(normalizePage(searchParams.get("page")), totalPages);

  const evaluations = await prisma.personnelEvaluation.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      score: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      evaluatedUser: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
        },
      },
      criterion: {
        select: {
          id: true,
          name: true,
          impact: true,
          isActive: true,
        },
      },
      evaluatingLeader: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      workSchedule: {
        select: {
          id: true,
          workDate: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    users,
    criteria,
    schedules: schedules.map(schedule => ({
      ...schedule,
      workDate: schedule.workDate.toISOString(),
    })),
    evaluations: evaluations.map(evaluation => ({
      id: evaluation.id,
      score: evaluation.score,
      comment: evaluation.comment,
      createdAt: evaluation.createdAt.toISOString(),
      updatedAt: evaluation.updatedAt.toISOString(),
      evaluatedUser: evaluation.evaluatedUser,
      criterion: evaluation.criterion,
      evaluatingLeader: evaluation.evaluatingLeader,
      workSchedule: {
        ...evaluation.workSchedule,
        workDate: evaluation.workSchedule.workDate.toISOString(),
      },
    })),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
    filters: {
      criteriaId,
      workScheduleId,
      endDate,
      search,
      startDate,
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "evaluation_create")) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      evaluatedUserId: string;
      criterionId: string;
      workScheduleId: string;
      score: number | string;
      comment: string;
    }>;

    const evaluatedUserId = body.evaluatedUserId?.trim();
    const criterionId = body.criterionId?.trim();
    const workScheduleId = body.workScheduleId?.trim();
    const comment = body.comment?.trim() || null;
    const score = Number(body.score);

    if (!evaluatedUserId || !criterionId || !workScheduleId) {
      return NextResponse.json(
        {
          error: "Le personnel, le critere et le planning sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(score) || score < 0) {
      return NextResponse.json(
        { error: "Le score doit etre un entier positif." },
        { status: 400 }
      );
    }

    const [evaluatedUser, criterion, workSchedule] = await Promise.all([
      prisma.user.findFirst({
        where: {
          ...buildScopedUserWhere(session),
          id: evaluatedUserId,
        },
        select: {
          id: true,
          isActive: true,
        },
      }),
      prisma.criterion.findFirst({
        where: {
          id: criterionId,
          agencyId: session.activeAgencyId,
        },
        select: {
          id: true,
          isActive: true,
          maxDaily: true,
        },
      }),
      prisma.workSchedule.findFirst({
        where: {
          id: workScheduleId,
          agencyId: session.activeAgencyId,
        },
        select: {
          id: true,
          workDate: true,
          status: true,
          assignments: {
            where: {
              userId: evaluatedUserId,
            },
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    if (!evaluatedUser || !evaluatedUser.isActive) {
      return NextResponse.json(
        { error: "Le personnel selectionne est introuvable ou inactif." },
        { status: 400 }
      );
    }

    if (!criterion || !criterion.isActive) {
      return NextResponse.json(
        { error: "Le critere selectionne est introuvable ou inactif." },
        { status: 400 }
      );
    }

    if (!workSchedule) {
      return NextResponse.json(
        { error: "Le planning selectionne est introuvable." },
        { status: 400 }
      );
    }

    if (workSchedule.status === "archived") {
      return NextResponse.json(
        {
          error:
            "Ce planning est archive et ne peut plus recevoir d'evaluation.",
        },
        { status: 400 }
      );
    }

    if (!workSchedule.assignments.length) {
      return NextResponse.json(
        {
          error:
            "Le personnel selectionne n'est pas assigne a ce planning pour cette agence.",
        },
        { status: 400 }
      );
    }

    if (criterion.maxDaily !== null) {
      const sameDayCount = await prisma.personnelEvaluation.count({
        where: {
          evaluatedUserId,
          criterionId,
          workSchedule: {
            agencyId: session.activeAgencyId,
            workDate: workSchedule.workDate,
          },
        },
      });

      if (sameDayCount >= criterion.maxDaily) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          message:
            "La limite quotidienne de ce critere est deja atteinte pour ce personnel.",
        });
      }
    }

    const evaluation = await prisma.personnelEvaluation.create({
      data: {
        workScheduleId,
        evaluatedUserId,
        evaluatingLeaderId: session.userId,
        criterionId,
        score,
        comment,
      },
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        skipped: false,
        message: "Evaluation enregistree.",
        evaluation: {
          ...evaluation,
          createdAt: evaluation.createdAt.toISOString(),
          updatedAt: evaluation.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'evaluation." },
      { status: 500 }
    );
  }
}
