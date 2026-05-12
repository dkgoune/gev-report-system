import type { Role, Service } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { REPORT_TYPES } from "@/lib/report-types";
import { type AnalyticsRange, formatRangeLabel } from "@/lib/analytics-range";
import { getServiceForRole, serviceLabel } from "@/lib/services";
import type { SessionPayload } from "@/lib/session";

type ReportDelegate = {
  count: (args?: unknown) => Promise<number>;
  groupBy: (args: unknown) => Promise<
    Array<{
      _count: { _all: number };
      reportDate: Date;
    }>
  >;
};

type ReportTypeBreakdown = {
  slug: string;
  title: string;
  total: number;
  unread: number;
};

type TrendPoint = {
  date: string;
  incidents: number;
  reports: number;
  signatures: number;
};

type ServiceBreakdownItem = {
  incidentCount: number;
  label: string;
  reportCount: number;
  service: Service;
};

type TopSigner = {
  count: number;
  fullName: string;
  role: Role;
  userId: string;
};

type CriterionUsage = {
  count: number;
  impact: "POSITIVE" | "NEGATIVE";
  name: string;
};

type EvaluationScoreRow = {
  count: number;
  fullName: string;
  role: Role;
  score: number;
  userId: string;
};

export type AnalyticsSnapshot = {
  criteriaUsage: CriterionUsage[];
  evaluationSummary: {
    negativeCount: number;
    negativeWeight: number;
    netScore: number;
    positiveCount: number;
    positiveWeight: number;
    total: number;
  };
  incidentTypeBreakdown: ReportTypeBreakdown[];
  leaderboard: {
    bottom: EvaluationScoreRow[];
    top: EvaluationScoreRow[];
  };
  range: {
    description: string;
    from: string;
    preset: string;
    to: string;
  };
  reportTypeBreakdown: ReportTypeBreakdown[];
  serviceBreakdown: ServiceBreakdownItem[];
  summary: {
    incidents: number;
    negativeEvaluations: number;
    netEvaluationScore: number;
    positiveEvaluations: number;
    reports: number;
    signatures: number;
    unreadReports: number;
  };
  topSigners: TopSigner[];
  trend: TrendPoint[];
};

const INCIDENT_REPORT_TYPES = REPORT_TYPES.filter(
  reportType => reportType.slug !== "general"
);

const ALL_SERVICES: Service[] = ["envoi", "piste", "retrait"];

function getReportDelegate(model: string) {
  return (prisma as unknown as Record<string, ReportDelegate>)[model];
}

function getScopedServices(session: SessionPayload) {
  if (session.role === "admin") {
    return ALL_SERVICES;
  }

  const service = getServiceForRole(session.role, session.groupService);
  return service ? [service] : [];
}

function buildReportWhere(
  reportType: (typeof REPORT_TYPES)[number],
  range: AnalyticsRange,
  service?: Service,
  unreadOnly?: boolean
) {
  const where: Record<string, unknown> = {
    reportDate: {
      gte: range.fromDate,
      lte: range.toDate,
    },
  };

  if (unreadOnly) {
    where.isRead = false;
  }

  if (!service) {
    return where;
  }

  if (reportType.serviceField) {
    where.service = service;
    return where;
  }

  where.reportedBy = {
    group: {
      service,
    },
  };

  return where;
}

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

export async function getAnalyticsSnapshot(
  session: SessionPayload,
  range: AnalyticsRange
): Promise<AnalyticsSnapshot> {
  const scopedServices = getScopedServices(session);
  const reportScopeService =
    session.role === "admin"
      ? undefined
      : (getServiceForRole(session.role, session.groupService) ?? undefined);
  const reportTypeCounts = await Promise.all(
    REPORT_TYPES.map(async reportType => {
      const delegate = getReportDelegate(reportType.model);
      const [total, unread, grouped] = await Promise.all([
        delegate.count({
          where: buildReportWhere(reportType, range, reportScopeService),
        }),
        delegate.count({
          where: buildReportWhere(reportType, range, reportScopeService, true),
        }),
        delegate.groupBy({
          by: ["reportDate"],
          where: buildReportWhere(reportType, range, reportScopeService),
          _count: { _all: true },
          orderBy: { reportDate: "asc" },
        }),
      ]);

      return {
        slug: reportType.slug,
        title: reportType.title,
        total,
        unread,
        grouped,
      };
    })
  );

  const signatureRows = await prisma.signatureLog.findMany({
    where: {
      createdAt: {
        gte: range.fromDate,
        lte: range.toDate,
      },
    },
    select: {
      createdAt: true,
      userId: true,
    },
  });

  const evaluationRows = await prisma.personnelEvaluation.findMany({
    where: {
      evaluationDate: {
        gte: range.fromDate,
        lte: range.toDate,
      },
    },
    select: {
      weightOverride: true,
      user: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
      criteria: {
        select: {
          name: true,
          impact: true,
          defaultWeight: true,
        },
      },
    },
  });

  const trendReports = new Map<string, number>();
  const trendIncidents = new Map<string, number>();

  for (const reportType of reportTypeCounts) {
    for (const point of reportType.grouped) {
      const key = toDateOnly(point.reportDate);
      addToMap(trendReports, key, point._count._all);

      if (reportType.slug !== "general") {
        addToMap(trendIncidents, key, point._count._all);
      }
    }
  }

  const trendSignatures = new Map<string, number>();
  const topSignerCounts = new Map<string, number>();

  for (const row of signatureRows) {
    const key = toDateOnly(row.createdAt);
    addToMap(trendSignatures, key, 1);
    addToMap(topSignerCounts, row.userId, 1);
  }

  const signerIds = [...topSignerCounts.keys()];
  const signers = signerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: signerIds } },
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      })
    : [];
  const signerMap = new Map(signers.map(user => [user.id, user]));

  const topSigners = [...topSignerCounts.entries()]
    .map(([userId, count]) => {
      const signer = signerMap.get(userId);

      if (!signer) {
        return null;
      }

      return {
        userId,
        count,
        fullName: signer.fullName,
        role: signer.role,
      } satisfies TopSigner;
    })
    .filter((item): item is TopSigner => item !== null)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const criteriaUsageMap = new Map<string, CriterionUsage>();
  const scoreMap = new Map<string, EvaluationScoreRow>();

  let positiveCount = 0;
  let negativeCount = 0;
  let positiveWeight = 0;
  let negativeWeight = 0;

  for (const row of evaluationRows) {
    const weight = Number(
      (row.weightOverride ?? row.criteria.defaultWeight).toString()
    );

    if (row.criteria.impact === "POSITIVE") {
      positiveCount += 1;
      positiveWeight += weight;
    } else {
      negativeCount += 1;
      negativeWeight += weight;
    }

    const criteriaKey = `${row.criteria.impact}:${row.criteria.name}`;
    const currentUsage = criteriaUsageMap.get(criteriaKey);
    criteriaUsageMap.set(criteriaKey, {
      name: row.criteria.name,
      impact: row.criteria.impact,
      count: (currentUsage?.count ?? 0) + 1,
    });

    const currentScore = scoreMap.get(row.user.id);
    scoreMap.set(row.user.id, {
      userId: row.user.id,
      fullName: row.user.fullName,
      role: row.user.role,
      count: (currentScore?.count ?? 0) + 1,
      score: (currentScore?.score ?? 0) + weight,
    });
  }

  const criteriaUsage = [...criteriaUsageMap.values()].sort(
    (left, right) => right.count - left.count
  );
  const scoreRows = [...scoreMap.values()].sort(
    (left, right) => right.score - left.score
  );

  const serviceBreakdown = await Promise.all(
    scopedServices.map(async service => {
      const reportCounts = await Promise.all(
        REPORT_TYPES.map(reportType =>
          getReportDelegate(reportType.model).count({
            where: buildReportWhere(reportType, range, service),
          })
        )
      );

      const incidentCounts = await Promise.all(
        INCIDENT_REPORT_TYPES.map(reportType =>
          getReportDelegate(reportType.model).count({
            where: buildReportWhere(reportType, range, service),
          })
        )
      );

      return {
        service,
        label: serviceLabel(service),
        reportCount: reportCounts.reduce((sum, count) => sum + count, 0),
        incidentCount: incidentCounts.reduce((sum, count) => sum + count, 0),
      } satisfies ServiceBreakdownItem;
    })
  );

  const reportTypeBreakdown = reportTypeCounts.map(reportType => ({
    slug: reportType.slug,
    title: reportType.title,
    total: reportType.total,
    unread: reportType.unread,
  }));
  const incidentTypeBreakdown = reportTypeBreakdown.filter(
    reportType => reportType.slug !== "general"
  );

  const reports = reportTypeBreakdown.reduce(
    (sum, reportType) => sum + reportType.total,
    0
  );
  const unreadReports = reportTypeBreakdown.reduce(
    (sum, reportType) => sum + reportType.unread,
    0
  );
  const incidents = incidentTypeBreakdown.reduce(
    (sum, reportType) => sum + reportType.total,
    0
  );
  const netEvaluationScore = positiveWeight + negativeWeight;

  const trend = enumerateDays(range).map(date => ({
    date,
    reports: trendReports.get(date) ?? 0,
    incidents: trendIncidents.get(date) ?? 0,
    signatures: trendSignatures.get(date) ?? 0,
  }));

  return {
    range: {
      preset: range.preset,
      from: range.from,
      to: range.to,
      description: formatRangeLabel(range),
    },
    summary: {
      reports,
      unreadReports,
      incidents,
      signatures: signatureRows.length,
      netEvaluationScore,
      positiveEvaluations: positiveCount,
      negativeEvaluations: negativeCount,
    },
    trend,
    serviceBreakdown,
    reportTypeBreakdown,
    incidentTypeBreakdown,
    topSigners,
    evaluationSummary: {
      total: evaluationRows.length,
      positiveCount,
      negativeCount,
      positiveWeight,
      negativeWeight,
      netScore: netEvaluationScore,
    },
    criteriaUsage: criteriaUsage.slice(0, 6),
    leaderboard: {
      top: scoreRows.slice(0, 5),
      bottom: [...scoreRows].reverse().slice(0, 5),
    },
  };
}
