import { formatRangeLabel, type AnalyticsRange } from "@/lib/analytics-range";
import type {
  EvaluationsAnalyticsLeaderboardEntry,
  EvaluationsAnalyticsSnapshot,
} from "@/lib/evaluations-analytics.types";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type NormalizedImpact = "POSITIVE" | "NEGATIVE";

type AnalyticsEvaluationRecord = {
  criterionId: string;
  criterionImpact: NormalizedImpact;
  criterionName: string;
  date: string;
  evaluator: {
    fullName: string;
    userId: string;
  };
  score: number;
  serviceName: string;
  signedScore: number;
  worker: {
    fullName: string;
    groupName: string;
    userId: string;
  };
};

function normalizeImpact(value: string, score: number): NormalizedImpact {
  const normalized = value.trim().toUpperCase();

  if (normalized === "NEGATIVE" || normalized === "LOW") {
    return "NEGATIVE";
  }

  if (normalized === "POSITIVE" || normalized === "HIGH") {
    return "POSITIVE";
  }

  return score < 0 ? "NEGATIVE" : "POSITIVE";
}

function toSignedScore(score: number, impact: NormalizedImpact): number {
  if (score < 0) {
    return score;
  }

  return impact === "NEGATIVE" ? -score : score;
}

function safeAverage(total: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return total / count;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getEvaluationsAnalyticsSnapshot(
  session: SessionPayload,
  range: AnalyticsRange
): Promise<EvaluationsAnalyticsSnapshot> {
  const evaluations = await prisma.personnelEvaluation.findMany({
    where: {
      workSchedule: {
        agencyId: session.activeAgencyId,
        workDate: {
          gte: range.fromDate,
          lte: range.toDate,
        },
      },
    },
    select: {
      id: true,
      score: true,
      criterionId: true,
      evaluatedUserId: true,
      evaluatingLeaderId: true,
      criterion: {
        select: {
          name: true,
          impact: true,
        },
      },
      evaluatedUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
      evaluatingLeader: {
        select: {
          id: true,
          fullName: true,
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
          assignments: {
            select: {
              userId: true,
              post: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      workSchedule: {
        workDate: "asc",
      },
    },
  });

  const records: AnalyticsEvaluationRecord[] = evaluations.map(evaluation => {
    const impact = normalizeImpact(
      evaluation.criterion.impact,
      evaluation.score
    );
    const signedScore = toSignedScore(evaluation.score, impact);
    const assignments = evaluation.workSchedule.assignments;

    const workerAssignment = assignments.find(
      assignment => assignment.userId === evaluation.evaluatedUserId
    );

    const serviceName = evaluation.workSchedule.service.name;
    const fallbackGroupName = serviceName || "Sans groupe";

    return {
      criterionId: evaluation.criterionId,
      criterionImpact: impact,
      criterionName: evaluation.criterion.name,
      date: toDateOnly(evaluation.workSchedule.workDate),
      score: evaluation.score,
      signedScore,
      serviceName,
      worker: {
        userId: evaluation.evaluatedUser.id,
        fullName: evaluation.evaluatedUser.fullName,

        groupName: workerAssignment?.post.name || fallbackGroupName,
      },
      evaluator: {
        userId: evaluation.evaluatingLeader.id,
        fullName: evaluation.evaluatingLeader.fullName,
      },
    };
  });

  const trendMap = new Map<string, { evaluations: number; netScore: number }>();
  const workerMap = new Map<
    string,
    {
      evaluationCount: number;
      fullName: string;
      groupName: string;
      totalScore: number;
      userId: string;
    }
  >();
  const groupMap = new Map<
    string,
    {
      evaluatedWorkers: Set<string>;
      evaluationCount: number;
      groupName: string;
      service: string | null;
      totalScore: number;
    }
  >();
  const criteriaMap = new Map<
    string,
    {
      criteriaId: string;
      evaluationCount: number;
      impact: NormalizedImpact;
      name: string;
      scoreContribution: number;
    }
  >();
  const evaluatorMap = new Map<
    string,
    {
      distinctWorkers: Set<string>;
      evaluationCount: number;
      fullName: string;
      totalScore: number;
      userId: string;
    }
  >();

  let positiveCount = 0;
  let negativeCount = 0;
  let netScore = 0;

  for (const record of records) {
    const trend = trendMap.get(record.date) ?? { evaluations: 0, netScore: 0 };
    trend.evaluations += 1;
    trend.netScore += record.signedScore;
    trendMap.set(record.date, trend);

    const worker = workerMap.get(record.worker.userId) ?? {
      userId: record.worker.userId,
      fullName: record.worker.fullName,
      groupName: record.worker.groupName,
      evaluationCount: 0,
      totalScore: 0,
    };
    worker.evaluationCount += 1;
    worker.totalScore += record.signedScore;
    workerMap.set(record.worker.userId, worker);

    const groupKey = record.worker.groupName;
    const group = groupMap.get(groupKey) ?? {
      groupName: record.worker.groupName,
      service: record.serviceName || null,
      evaluationCount: 0,
      totalScore: 0,
      evaluatedWorkers: new Set<string>(),
    };
    group.evaluationCount += 1;
    group.totalScore += record.signedScore;
    group.evaluatedWorkers.add(record.worker.userId);
    groupMap.set(groupKey, group);

    const criteria = criteriaMap.get(record.criterionId) ?? {
      criteriaId: record.criterionId,
      name: record.criterionName,
      impact: record.criterionImpact,
      evaluationCount: 0,
      scoreContribution: 0,
    };
    criteria.evaluationCount += 1;
    criteria.scoreContribution += record.signedScore;
    criteriaMap.set(record.criterionId, criteria);

    const evaluator = evaluatorMap.get(record.evaluator.userId) ?? {
      userId: record.evaluator.userId,
      fullName: record.evaluator.fullName,
      evaluationCount: 0,
      totalScore: 0,
      distinctWorkers: new Set<string>(),
    };
    evaluator.evaluationCount += 1;
    evaluator.totalScore += record.signedScore;
    evaluator.distinctWorkers.add(record.worker.userId);
    evaluatorMap.set(record.evaluator.userId, evaluator);

    netScore += record.signedScore;

    if (record.signedScore >= 0) {
      positiveCount += 1;
    } else {
      negativeCount += 1;
    }
  }

  const trend = Array.from(trendMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({
      date,
      evaluations: value.evaluations,
      netScore: value.netScore,
    }));

  const workerStats: EvaluationsAnalyticsLeaderboardEntry[] = Array.from(
    workerMap.values()
  )
    .map(worker => ({
      userId: worker.userId,
      fullName: worker.fullName,
      groupName: worker.groupName,
      evaluationCount: worker.evaluationCount,
      totalScore: worker.totalScore,
      averageScore: safeAverage(worker.totalScore, worker.evaluationCount),
    }))
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      return right.evaluationCount - left.evaluationCount;
    });

  const groupStats = Array.from(groupMap.values())
    .map(group => ({
      groupId: null,
      groupName: group.groupName,
      service: group.service,
      evaluationCount: group.evaluationCount,
      evaluatedWorkers: group.evaluatedWorkers.size,
      totalScore: group.totalScore,
      averageScore: safeAverage(group.totalScore, group.evaluationCount),
    }))
    .sort((left, right) => right.evaluationCount - left.evaluationCount);

  const criteriaStats = Array.from(criteriaMap.values()).sort(
    (left, right) => right.evaluationCount - left.evaluationCount
  );

  const evaluatorActivity = Array.from(evaluatorMap.values())
    .map(item => ({
      userId: item.userId,
      fullName: item.fullName,
      evaluationCount: item.evaluationCount,
      distinctWorkers: item.distinctWorkers.size,
      totalScore: item.totalScore,
    }))
    .sort((left, right) => right.evaluationCount - left.evaluationCount);

  return {
    range: {
      preset: range.preset,
      from: range.from,
      to: range.to,
      description: formatRangeLabel(range),
    },
    summary: {
      totalEvaluations: records.length,
      netScore,
      activeWorkers: workerMap.size,
      activeGroups: groupMap.size,
      positiveCount,
      negativeCount,
      averageScorePerWorker: safeAverage(netScore, workerMap.size),
    },
    trend,
    workerStats,
    leaderboards: {
      topWorkers: workerStats.slice(0, 5),
      bottomWorkers: [...workerStats].reverse().slice(0, 5),
    },
    groupStats,
    criteriaStats,
    evaluatorActivity,
  };
}
