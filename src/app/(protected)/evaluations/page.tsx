import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { EvaluationsList } from "@/components/evaluation-management/evaluations-list";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

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

  if (!hasPermission(session, "evaluation_read")) {
    redirect("/");
  }

  const query = await searchParams;
  const search = (query.q || "").trim();
  const criteriaId = (query.criteriaId || "").trim();
  const startDate = normalizeDateInput(query.from);
  const endDate = normalizeDateInput(query.to);
  const pageSize = normalizePageSize(query.pageSize);

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
      {
        evaluatingLeader: {
          username: { contains: search, mode: "insensitive" },
        },
      },
      { comment: { contains: search, mode: "insensitive" } },
    ];
  }

  if (criteriaId) {
    where.criterionId = criteriaId;
  }

  const [totalItems, criteriaOptions] = await Promise.all([
    prisma.personnelEvaluation.count({ where }),
    prisma.criterion.findMany({
      where: {
        isActive: true,
        agencyId: session.activeAgencyId,
      },
      orderBy: [{ impact: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        impact: true,
        requiresPersonnel: true,
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
      comment: true,
      createdAt: true,
      updatedAt: true,
      evaluationDate: true,
      isCancelled: true,
      cancelledAt: true,
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

  const canCancel = hasPermission(session, "evaluation_cancel");

  return (
    <EvaluationsList
      criteriaOptions={criteriaOptions}
      canCancel={canCancel}
      evaluations={evaluations.map(evaluation => ({
        id: evaluation.id,
        comment: evaluation.comment,
        createdAt: evaluation.createdAt.toISOString(),
        updatedAt: evaluation.updatedAt.toISOString(),
        evaluationDate: evaluation.evaluationDate.toISOString(),
        isCancelled: evaluation.isCancelled,
        cancelledAt: evaluation.cancelledAt?.toISOString() ?? null,
        evaluatedUser: evaluation.evaluatedUser,
        criterion: evaluation.criterion,
        evaluatingLeader: evaluation.evaluatingLeader,
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
