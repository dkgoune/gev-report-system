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
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("q") || "").trim();
  const criteriaId = (searchParams.get("criteriaId") || "").trim();
  const startDate = normalizeDateInput(searchParams.get("from"));
  const endDate = normalizeDateInput(searchParams.get("to"));
  const pageSize = normalizePageSize(searchParams.get("pageSize"));

  const evaluationDateFilter: Prisma.DateTimeFilter = {
    ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
    ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
  };

  const where: Prisma.PersonnelEvaluationWhereInput = {
    criterion: {
      agencyId: session.activeAgencyId,
    },
    ...(startDate || endDate ? { evaluationDate: evaluationDateFilter } : {}),
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
    ];
  }

  if (criteriaId) {
    where.criterionId = criteriaId;
  }

  const [totalItems, users, criteria] = await Promise.all([
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
        requiresPersonnel: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const page = Math.min(normalizePage(searchParams.get("page")), totalPages);

  const evaluations = await prisma.personnelEvaluation.findMany({
    where,
    orderBy: [{ evaluationDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      evaluationDate: true,
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
    },
  });

  return NextResponse.json({
    users,
    criteria,
    evaluations: evaluations.map(evaluation => ({
      id: evaluation.id,
      comment: evaluation.comment,
      createdAt: evaluation.createdAt.toISOString(),
      updatedAt: evaluation.updatedAt.toISOString(),
      evaluationDate: evaluation.evaluationDate.toISOString(),
      evaluatedUser: evaluation.evaluatedUser,
      criterion: evaluation.criterion,
      evaluatingLeader: evaluation.evaluatingLeader,
    })),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
    filters: {
      criteriaId,
      endDate,
      search,
      startDate,
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "evaluation_create")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      evaluatedUserId: string;
      criterionId: string;
      comment: string;
      date?: string;
    }>;

    const evaluatedUserId = body.evaluatedUserId?.trim() || null;
    const criterionId = body.criterionId?.trim();
    const comment = body.comment?.trim() || null;
    const dateInput = body.date?.trim();

    if (!criterionId || !comment) {
      return NextResponse.json(
        {
          error: "Le critère et l'observation/note sont obligatoires.",
        },
        { status: 400 }
      );
    }

    const criterion = await prisma.criterion.findFirst({
      where: {
        id: criterionId,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
        isActive: true,
        maxDaily: true,
        weight: true,
        requiresPersonnel: true,
      },
    });

    if (!criterion || !criterion.isActive) {
      return NextResponse.json(
        { error: "Le critère sélectionné est introuvable ou inactif." },
        { status: 400 }
      );
    }

    if (criterion.requiresPersonnel && !evaluatedUserId) {
      return NextResponse.json(
        { error: "Ce critère nécessite de spécifier un personnel." },
        { status: 400 }
      );
    }

    if (evaluatedUserId) {
      const evaluatedUser = await prisma.user.findFirst({
        where: {
          ...buildScopedUserWhere(session),
          id: evaluatedUserId,
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!evaluatedUser || !evaluatedUser.isActive) {
        return NextResponse.json(
          { error: "Le personnel sélectionné est introuvable ou inactif." },
          { status: 400 }
        );
      }
    }

    let targetDate = new Date();
    if (dateInput) {
      const parsedDate = new Date(dateInput);
      if (!Number.isNaN(parsedDate.getTime())) {
        targetDate = parsedDate;
      }
    }

    if (evaluatedUserId && criterion.maxDaily !== null) {
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const day = String(targetDate.getDate()).padStart(2, "0");
      const dayString = `${year}-${month}-${day}`;
      const todayStart = new Date(`${dayString}T00:00:00.000Z`);
      const todayEnd = new Date(`${dayString}T23:59:59.999Z`);

      const sameDayCount = await prisma.personnelEvaluation.count({
        where: {
          evaluatedUserId,
          criterionId,
          evaluationDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      if (sameDayCount >= criterion.maxDaily) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          message:
            "La limite quotidienne de ce critère est déjà atteinte pour ce personnel.",
        });
      }
    }

    const evaluation = await prisma.personnelEvaluation.create({
      data: {
        evaluatedUserId,
        evaluatingLeaderId: session.userId,
        criterionId,
        score: Math.round(Number(criterion.weight)),
        comment,
        evaluationDate: targetDate,
      },
      select: {
        id: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        evaluationDate: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        skipped: false,
        message: "Évaluation enregistrée.",
        evaluation: {
          ...evaluation,
          createdAt: evaluation.createdAt.toISOString(),
          updatedAt: evaluation.updatedAt.toISOString(),
          evaluationDate: evaluation.evaluationDate.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'évaluation." },
      { status: 500 }
    );
  }
}
