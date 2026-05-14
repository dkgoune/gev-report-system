import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { EvaluationsList } from "@/components/evaluation-management/evaluations-list";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
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
    workScheduleId?: string;
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

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  const query = await searchParams;
  const search = (query.q || "").trim();
  const criteriaId = (query.criteriaId || "").trim();
  const workScheduleId = (query.workScheduleId || "").trim();
  const startDate = normalizeDateInput(query.from);
  const endDate = normalizeDateInput(query.to);
  const pageSize = normalizePageSize(query.pageSize);

  const workDateFilter: Prisma.DateTimeFilter = {
    ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
    ...(endDate ? { lte: new Date(`${endDate}T00:00:00.000Z`) } : {}),
  };

  const where: Prisma.PersonnelEvaluationWhereInput = {
    workSchedule: {
      agencyId: session.activeAgencyId,
      ...(startDate || endDate ? { workDate: workDateFilter } : {}),
    },
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

  if (workScheduleId) {
    where.workScheduleId = workScheduleId;
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
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const page = Math.min(normalizePage(query.page), totalPages);

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

  return (
    <EvaluationsList
      criteriaOptions={criteriaOptions}
      evaluations={evaluations.map(evaluation => ({
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
      }))}
      filters={{
        criteriaId,
        endDate,
        page,
        pageSize,
        search,
        startDate,
        workScheduleId,
      }}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}
