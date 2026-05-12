import type { Role, Service } from "@/generated/prisma/enums";
import { type AnalyticsRange, formatRangeLabel } from "@/lib/analytics-range";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type EvaluationTrendPoint = {
  date: string;
  evaluations: number;
  netScore: number;
};

type EvaluationWorkerStat = {
  averageScore: number;
  evaluationCount: number;
  fullName: string;
  groupId: string | null;
  groupName: string;
  role: Role;
  totalScore: number;
  userId: string;
};

type EvaluationGroupStat = {
  averageScore: number;
  evaluationCount: number;
  evaluatedWorkers: number;
  groupId: string | null;
  groupName: string;
  service: Service | null;
  totalScore: number;
};

type EvaluationCriterionStat = {
  criteriaId: string;
  evaluationCount: number;
  impact: "POSITIVE" | "NEGATIVE";
  name: string;
  scoreContribution: number;
};

type EvaluatorActivityStat = {
  distinctWorkers: number;
  evaluationCount: number;
  fullName: string;
  role: Role;
  totalScore: number;
  userId: string;
};

export type EvaluationsAnalyticsSnapshot = {
  criteriaStats: EvaluationCriterionStat[];
  evaluatorActivity: EvaluatorActivityStat[];
  groupStats: EvaluationGroupStat[];
  leaderboards: {
    bottomWorkers: EvaluationWorkerStat[];
    topWorkers: EvaluationWorkerStat[];
  };
  range: {
    description: string;
    from: string;
    preset: string;
    to: string;
  };
  summary: {
    activeGroups: number;
    activeWorkers: number;
    averageScorePerWorker: number;
    negativeCount: number;
    negativeScore: number;
    netScore: number;
    positiveCount: number;
    positiveScore: number;
    totalEvaluations: number;
  };
  trend: EvaluationTrendPoint[];
  workerStats: EvaluationWorkerStat[];
};

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function enumerateDays(range: AnalyticsRange) {
  const days: string[] = [];
  const cursor = new Date(range.fromDate);

  while (cursor <= range.toDate) {
    days.push(toDateOnly(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function addToMap(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function resolveSignedScore(weight: number, impact: "POSITIVE" | "NEGATIVE") {
  return impact === "POSITIVE" ? weight : -weight;
}

export async function getEvaluationsAnalyticsSnapshot(
  _session: SessionPayload,
  range: AnalyticsRange
): Promise<EvaluationsAnalyticsSnapshot> {
  const rows = await prisma.personnelEvaluation.findMany({
    where: {
      evaluationDate: {
        gte: range.fromDate,
        lte: range.toDate,
      },
    },
    orderBy: [{ evaluationDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      evaluationDate: true,
      weightOverride: true,
      user: {
        select: {
          id: true,
          fullName: true,
          role: true,
          groupId: true,
          group: {
            select: {
              id: true,
              name: true,
              service: true,
            },
          },
        },
      },
      criteria: {
        select: {
          id: true,
          name: true,
          impact: true,
          defaultWeight: true,
        },
      },
      recordedBy: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  const trendCounts = new Map<string, number>();
  const trendScores = new Map<string, number>();
  const workerMap = new Map<string, EvaluationWorkerStat>();
  const groupMap = new Map<
    string,
    EvaluationGroupStat & { workerIds: Set<string> }
  >();
  const criteriaMap = new Map<string, EvaluationCriterionStat>();
  const evaluatorMap = new Map<
    string,
    EvaluatorActivityStat & { workerIds: Set<string> }
  >();

  let positiveCount = 0;
  let negativeCount = 0;
  let positiveScore = 0;
  let negativeScore = 0;

  for (const row of rows) {
    const weight = Number(
      (row.weightOverride ?? row.criteria.defaultWeight).toString()
    );
    const signedScore = resolveSignedScore(weight, row.criteria.impact);
    const dayKey = toDateOnly(row.evaluationDate);
    const workerGroupName = row.user.group?.name ?? "Sans groupe";
    const workerGroupService = row.user.group?.service ?? null;
    const workerGroupId = row.user.group?.id ?? row.user.groupId ?? null;
    const groupKey = workerGroupId ?? "__ungrouped__";

    addToMap(trendCounts, dayKey, 1);
    addToMap(trendScores, dayKey, signedScore);

    if (row.criteria.impact === "POSITIVE") {
      positiveCount += 1;
      positiveScore += weight;
    } else {
      negativeCount += 1;
      negativeScore += weight;
    }

    const workerEntry = workerMap.get(row.user.id);
    workerMap.set(row.user.id, {
      userId: row.user.id,
      fullName: row.user.fullName,
      role: row.user.role,
      groupId: workerGroupId,
      groupName: workerGroupName,
      evaluationCount: (workerEntry?.evaluationCount ?? 0) + 1,
      totalScore: (workerEntry?.totalScore ?? 0) + signedScore,
      averageScore: 0,
    });

    const groupEntry = groupMap.get(groupKey);
    if (!groupEntry) {
      groupMap.set(groupKey, {
        groupId: workerGroupId,
        groupName: workerGroupName,
        service: workerGroupService,
        evaluationCount: 1,
        evaluatedWorkers: 0,
        totalScore: signedScore,
        averageScore: 0,
        workerIds: new Set([row.user.id]),
      });
    } else {
      groupEntry.evaluationCount += 1;
      groupEntry.totalScore += signedScore;
      groupEntry.workerIds.add(row.user.id);
    }

    const criteriaEntry = criteriaMap.get(row.criteria.id);
    criteriaMap.set(row.criteria.id, {
      criteriaId: row.criteria.id,
      name: row.criteria.name,
      impact: row.criteria.impact,
      evaluationCount: (criteriaEntry?.evaluationCount ?? 0) + 1,
      scoreContribution: (criteriaEntry?.scoreContribution ?? 0) + signedScore,
    });

    const evaluatorEntry = evaluatorMap.get(row.recordedBy.id);
    if (!evaluatorEntry) {
      evaluatorMap.set(row.recordedBy.id, {
        userId: row.recordedBy.id,
        fullName: row.recordedBy.fullName,
        role: row.recordedBy.role,
        evaluationCount: 1,
        distinctWorkers: 0,
        totalScore: signedScore,
        workerIds: new Set([row.user.id]),
      });
    } else {
      evaluatorEntry.evaluationCount += 1;
      evaluatorEntry.totalScore += signedScore;
      evaluatorEntry.workerIds.add(row.user.id);
    }
  }

  const workerStats = [...workerMap.values()]
    .map(worker => ({
      ...worker,
      averageScore:
        worker.evaluationCount > 0
          ? worker.totalScore / worker.evaluationCount
          : 0,
    }))
    .sort((left, right) => right.totalScore - left.totalScore);

  const groupStats = [...groupMap.values()]
    .map(group => ({
      groupId: group.groupId,
      groupName: group.groupName,
      service: group.service,
      evaluationCount: group.evaluationCount,
      evaluatedWorkers: group.workerIds.size,
      totalScore: group.totalScore,
      averageScore:
        group.workerIds.size > 0 ? group.totalScore / group.workerIds.size : 0,
    }))
    .sort((left, right) => right.evaluationCount - left.evaluationCount);

  const criteriaStats = [...criteriaMap.values()].sort(
    (left, right) => right.evaluationCount - left.evaluationCount
  );

  const evaluatorActivity = [...evaluatorMap.values()]
    .map(evaluator => ({
      userId: evaluator.userId,
      fullName: evaluator.fullName,
      role: evaluator.role,
      evaluationCount: evaluator.evaluationCount,
      distinctWorkers: evaluator.workerIds.size,
      totalScore: evaluator.totalScore,
    }))
    .sort((left, right) => right.evaluationCount - left.evaluationCount);

  const netScore = workerStats.reduce(
    (sum, worker) => sum + worker.totalScore,
    0
  );
  const trend = enumerateDays(range).map(date => ({
    date,
    evaluations: trendCounts.get(date) ?? 0,
    netScore: trendScores.get(date) ?? 0,
  }));

  return {
    range: {
      preset: range.preset,
      from: range.from,
      to: range.to,
      description: formatRangeLabel(range),
    },
    summary: {
      totalEvaluations: rows.length,
      positiveCount,
      negativeCount,
      positiveScore,
      negativeScore,
      netScore,
      activeWorkers: workerStats.length,
      activeGroups: groupStats.length,
      averageScorePerWorker:
        workerStats.length > 0 ? netScore / workerStats.length : 0,
    },
    trend,
    workerStats,
    groupStats,
    criteriaStats,
    evaluatorActivity,
    leaderboards: {
      topWorkers: workerStats.slice(0, 5),
      bottomWorkers: [...workerStats]
        .sort((left, right) => left.totalScore - right.totalScore)
        .slice(0, 5),
    },
  };
}
