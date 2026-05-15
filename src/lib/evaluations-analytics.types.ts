import type { AnalyticsRange } from "@/lib/analytics-range";

type NormalizedImpact = "POSITIVE" | "NEGATIVE";

export type EvaluationsAnalyticsLeaderboardEntry = {
  averageScore: number;
  evaluationCount: number;
  fullName: string;
  groupName: string;
  totalScore: number;
  userId: string;
};

export type EvaluationsAnalyticsSnapshot = {
  criteriaStats: Array<{
    criteriaId: string;
    evaluationCount: number;
    impact: NormalizedImpact;
    name: string;
    scoreContribution: number;
  }>;
  evaluatorActivity: Array<{
    distinctWorkers: number;
    evaluationCount: number;
    fullName: string;
    totalScore: number;
    userId: string;
  }>;
  groupStats: Array<{
    averageScore: number;
    evaluatedWorkers: number;
    evaluationCount: number;
    groupId: string | null;
    groupName: string;
    service: string | null;
    totalScore: number;
  }>;
  leaderboards: {
    bottomWorkers: EvaluationsAnalyticsLeaderboardEntry[];
    topWorkers: EvaluationsAnalyticsLeaderboardEntry[];
  };
  range: Pick<AnalyticsRange, "from" | "preset" | "to"> & {
    description: string;
  };
  summary: {
    activeGroups: number;
    activeWorkers: number;
    averageScorePerWorker: number;
    negativeCount: number;
    netScore: number;
    positiveCount: number;
    totalEvaluations: number;
  };
  trend: Array<{
    date: string;
    evaluations: number;
    netScore: number;
  }>;
  workerStats: EvaluationsAnalyticsLeaderboardEntry[];
};
