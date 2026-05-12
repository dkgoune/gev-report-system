import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { EvaluationsList } from "@/components/evaluation-management/evaluations-list";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type EvaluationsPageProps = {
  searchParams: Promise<{
    criteriaId?: string;
    from?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    to?: string;
  }>;
};

function normalizePage(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function normalizePageSize(value: string | undefined) {
  const parsed = Number(value);

  if (parsed === 20 || parsed === 50) {
    return parsed;
  }

  return 10;
}

function normalizeDateInput(value: string | undefined) {
  if (!value) {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export default async function EvaluationsPage({
  searchParams,
}: EvaluationsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAdminWorkspace(session.role)) {
    redirect("/");
  }

  const query = await searchParams;
  const search = (query.q || "").trim();
  const criteriaId = (query.criteriaId || "").trim();
  const startDate = normalizeDateInput(query.from);
  const endDate = normalizeDateInput(query.to);
  const pageSize = normalizePageSize(query.pageSize);

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

  const [totalItems, criteriaOptions] = await Promise.all([
    prisma.personnelEvaluation.count({ where }),
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
  const page = Math.min(normalizePage(query.page), totalPages);

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

  return (
    <EvaluationsList
      criteriaOptions={criteriaOptions.map(criterion => ({
        ...criterion,
        defaultWeight: criterion.defaultWeight.toString(),
      }))}
      evaluations={evaluations.map(evaluation => ({
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
      }))}
      filters={{
        criteriaId,
        endDate,
        page,
        pageSize,
        search,
        startDate,
      }}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}
