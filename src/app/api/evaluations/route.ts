import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { canAccessPlatform } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

function normalizeDecimal(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return trimmed;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

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

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("q") || "").trim();
  const criteriaId = (searchParams.get("criteriaId") || "").trim();
  const startDate = normalizeDateInput(searchParams.get("from"));
  const endDate = normalizeDateInput(searchParams.get("to"));
  const pageSize = normalizePageSize(searchParams.get("pageSize"));

  const where: Prisma.PersonnelEvaluationWhereInput = {};

  if (search) {
    where.OR = [
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { criteria: { name: { contains: search, mode: "insensitive" } } },
      { recordedBy: { fullName: { contains: search, mode: "insensitive" } } },
      { recordedBy: { username: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  if (criteriaId) {
    where.criteriaId = criteriaId;
  }

  if (startDate || endDate) {
    where.evaluationDate = {};

    if (startDate) {
      where.evaluationDate.gte = new Date(`${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      where.evaluationDate.lte = new Date(`${endDate}T00:00:00.000Z`);
    }
  }

  const [totalItems, users, criteria] = await Promise.all([
    prisma.personnelEvaluation.count({ where }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: [
            "agent",
            "convoyeur",
            "leader_envoi",
            "leader_piste",
            "leader_retrait",
          ],
        },
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        role: true,
      },
    }),
    prisma.criterion.findMany({
      where: { isActive: true },
      orderBy: [{ impact: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        impact: true,
        defaultWeight: true,
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
      evaluationDate: true,
      weightOverride: true,
      notes: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      },
      criteria: {
        select: {
          id: true,
          name: true,
          impact: true,
          defaultWeight: true,
          isActive: true,
        },
      },
      recordedBy: {
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
    criteria: criteria.map((criterion) => ({
      ...criterion,
      defaultWeight: criterion.defaultWeight.toString(),
    })),
    evaluations: evaluations.map((evaluation) => ({
      id: evaluation.id,
      evaluationDate: evaluation.evaluationDate.toISOString(),
      weightOverride: evaluation.weightOverride?.toString() ?? null,
      notes: evaluation.notes,
      createdAt: evaluation.createdAt.toISOString(),
      user: evaluation.user,
      criteria: {
        ...evaluation.criteria,
        defaultWeight: evaluation.criteria.defaultWeight.toString(),
      },
      recordedBy: evaluation.recordedBy,
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

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      userId: string;
      criteriaId: string;
      evaluationDate: string;
      weightOverride: string;
      notes: string;
    }>;

    const userId = body.userId?.trim();
    const criteriaId = body.criteriaId?.trim();
    const evaluationDate = body.evaluationDate?.trim();
    const weightOverride = body.weightOverride?.trim() ?? "";
    const notes = body.notes?.trim() || null;

    if (!userId || !criteriaId || !evaluationDate) {
      return NextResponse.json(
        {
          error:
            "Le personnel, le critère et la date d'évaluation sont obligatoires.",
        },
        { status: 400 },
      );
    }

    const parsedDate = normalizeDate(evaluationDate);

    if (!parsedDate) {
      return NextResponse.json(
        { error: "Date d'évaluation invalide." },
        { status: 400 },
      );
    }

    const normalizedWeight = weightOverride
      ? normalizeDecimal(weightOverride)
      : null;

    if (weightOverride && !normalizedWeight) {
      return NextResponse.json(
        { error: "Le poids personnalisé doit être un nombre valide." },
        { status: 400 },
      );
    }

    const [user, criterion] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      }),
      prisma.criterion.findUnique({
        where: { id: criteriaId },
        select: {
          id: true,
          isActive: true,
        },
      }),
    ]);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Le personnel sélectionné est introuvable ou inactif." },
        { status: 400 },
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Les administrateurs ne peuvent pas être évalués." },
        { status: 400 },
      );
    }

    if (!criterion || !criterion.isActive) {
      return NextResponse.json(
        { error: "Le critère sélectionné est introuvable ou inactif." },
        { status: 400 },
      );
    }

    const evaluation = await prisma.personnelEvaluation.create({
      data: {
        userId,
        criteriaId,
        evaluationDate: parsedDate,
        weightOverride: normalizedWeight,
        notes,
        recordedById: session.userId,
      },
      select: {
        id: true,
        evaluationDate: true,
        weightOverride: true,
        notes: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
        criteria: {
          select: {
            id: true,
            name: true,
            impact: true,
            defaultWeight: true,
            isActive: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        evaluation: {
          id: evaluation.id,
          evaluationDate: evaluation.evaluationDate.toISOString(),
          weightOverride: evaluation.weightOverride?.toString() ?? null,
          notes: evaluation.notes,
          createdAt: evaluation.createdAt.toISOString(),
          user: evaluation.user,
          criteria: {
            ...evaluation.criteria,
            defaultWeight: evaluation.criteria.defaultWeight.toString(),
          },
          recordedBy: evaluation.recordedBy,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'évaluation." },
      { status: 500 },
    );
  }
}
