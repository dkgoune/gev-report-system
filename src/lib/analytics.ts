import { formatRangeLabel, type AnalyticsRange } from "@/lib/analytics-range";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type DailyTrendPoint = {
  date: string;
  reports: number;
  incidents: number;
  signatures: number;
};

type BreakdownItem = {
  slug: string;
  title: string;
  total: number;
  unread: number;
};

type ServiceBreakdownItem = {
  service: string;
  label: string;
  incidentCount: number;
  reportCount: number;
};

type TopSignerItem = {
  userId: string;
  fullName: string;
  count: number;
};

type LeaderboardItem = {
  userId: string;
  fullName: string;
  count: number;
  score: number;
};

type CriteriaUsageItem = {
  name: string;
  count: number;
};

export type AnalyticsSnapshot = {
  range: {
    description: string;
    from: string;
    preset: string;
    to: string;
  };
  summary: {
    reports: number;
    incidents: number;
    unreadReports: number;
    signatures: number;
    netEvaluationScore: number;
    positiveEvaluations: number;
  };
  trend: DailyTrendPoint[];
  incidentTypeBreakdown: BreakdownItem[];
  reportTypeBreakdown: BreakdownItem[];
  serviceBreakdown: ServiceBreakdownItem[];
  topSigners: TopSignerItem[];
  evaluationSummary: {
    positiveCount: number;
    negativeCount: number;
    netScore: number;
  };
  leaderboard: {
    top: LeaderboardItem[];
  };
  criteriaUsage: CriteriaUsageItem[];
};

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function signedEvaluationScore(score: number, impact: string): number {
  const normalizedImpact = impact.trim().toLowerCase();

  if (normalizedImpact === "low" || normalizedImpact === "negative") {
    return -1;
  }

  return 1;
}

export async function getAnalyticsSnapshot(
  session: SessionPayload,
  range: AnalyticsRange
): Promise<AnalyticsSnapshot> {
  const [
    reports,
    incidentEntries,
    signatureRows,
    signerGroups,
    evaluations,
    criteriaRows,
  ] = await Promise.all([
    prisma.generalReport.findMany({
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
        isRead: true,
        createdAt: true,
        workSchedule: {
          select: {
            workDate: true,
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.generalReportIncidentEntry.findMany({
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
        createdAt: true,
        templateCodeSnapshot: true,
        templateNameSnapshot: true,
        workSchedule: {
          select: {
            workDate: true,
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.signatureLog.findMany({
      where: {
        user: {
          memberships: {
            some: {
              agencyId: session.activeAgencyId,
              isActive: true,
            },
          },
        },
        signedAt: {
          gte: range.fromDate,
          lte: range.toDate,
        },
      },
      select: {
        id: true,
        userId: true,
        signedAt: true,
        signatureCount: true,
      },
    }),
    prisma.signatureLog.groupBy({
      by: ["userId"],
      _sum: {
        signatureCount: true,
      },
      where: {
        user: {
          memberships: {
            some: {
              agencyId: session.activeAgencyId,
              isActive: true,
            },
          },
        },
        signedAt: {
          gte: range.fromDate,
          lte: range.toDate,
        },
      },
      orderBy: {
        _sum: {
          signatureCount: "desc",
        },
      },
      take: 8,
    }),
    prisma.personnelEvaluation.findMany({
      where: {
        criterion: {
          agencyId: session.activeAgencyId,
        },
        evaluationDate: {
          gte: range.fromDate,
          lte: range.toDate,
        },
        isCancelled: false,
      },
      select: {
        score: true,
        evaluatedUserId: true,
        evaluatedUser: {
          select: {
            fullName: true,
          },
        },
        criterion: {
          select: {
            impact: true,
          },
        },
      },
    }),
    prisma.personnelEvaluation.groupBy({
      by: ["criterionId"],
      _count: {
        _all: true,
      },
      where: {
        criterion: {
          agencyId: session.activeAgencyId,
        },
        evaluationDate: {
          gte: range.fromDate,
          lte: range.toDate,
        },
        isCancelled: false,
      },
      orderBy: {
        _count: {
          criterionId: "desc",
        },
      },
      take: 8,
    }),
  ]);

  const signerUserIds = signerGroups.map(item => item.userId);
  const criterionIds = criteriaRows.map(item => item.criterionId);

  const [signerUsers, criteria] = await Promise.all([
    signerUserIds.length
      ? prisma.user.findMany({
          where: { id: { in: signerUserIds } },
          select: {
            id: true,
            fullName: true,
          },
        })
      : Promise.resolve([]),

    criterionIds.length
      ? prisma.criterion.findMany({
          where: {
            id: {
              in: criterionIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const usersById = new Map(signerUsers.map(item => [item.id, item.fullName]));
  const criteriaById = new Map(criteria.map(item => [item.id, item.name]));

  const trendByDate = new Map<string, DailyTrendPoint>();

  for (let cursor = new Date(range.fromDate); cursor <= range.toDate; ) {
    const date = toDateOnly(cursor);
    trendByDate.set(date, {
      date,
      reports: 0,
      incidents: 0,
      signatures: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const reportTypeMap = new Map<string, BreakdownItem>();
  const serviceMap = new Map<string, ServiceBreakdownItem>();

  for (const report of reports) {
    const dateKey = toDateOnly(report.workSchedule.workDate);
    const trendPoint = trendByDate.get(dateKey);

    if (trendPoint) {
      trendPoint.reports += 1;
    }

    const serviceId = report.workSchedule.service.id;
    const serviceName = report.workSchedule.service.name;

    const reportType = reportTypeMap.get(serviceId) || {
      slug: slugify(serviceName),
      title: serviceName,
      total: 0,
      unread: 0,
    };

    reportType.total += 1;
    if (!report.isRead) {
      reportType.unread += 1;
    }

    reportTypeMap.set(serviceId, reportType);

    const serviceEntry = serviceMap.get(serviceId) || {
      service: serviceId,
      label: serviceName,
      incidentCount: 0,
      reportCount: 0,
    };

    serviceEntry.reportCount += 1;
    serviceMap.set(serviceId, serviceEntry);
  }

  const incidentTypeMap = new Map<string, BreakdownItem>();

  for (const incident of incidentEntries) {
    const dateKey = toDateOnly(incident.workSchedule.workDate);
    const trendPoint = trendByDate.get(dateKey);

    if (trendPoint) {
      trendPoint.incidents += 1;
    }

    const key = incident.templateCodeSnapshot || incident.templateNameSnapshot;
    const title = incident.templateNameSnapshot || "Incident";

    const entry = incidentTypeMap.get(key) || {
      slug: slugify(key || title || "incident"),
      title,
      total: 0,
      unread: 0,
    };

    entry.total += 1;
    incidentTypeMap.set(key, entry);

    const serviceId = incident.workSchedule.service.id;
    const serviceName = incident.workSchedule.service.name;
    const serviceEntry = serviceMap.get(serviceId) || {
      service: serviceId,
      label: serviceName,
      incidentCount: 0,
      reportCount: 0,
    };

    serviceEntry.incidentCount += 1;
    serviceMap.set(serviceId, serviceEntry);
  }

  for (const signature of signatureRows) {
    const dateKey = toDateOnly(signature.signedAt);
    const trendPoint = trendByDate.get(dateKey);

    if (trendPoint) {
      trendPoint.signatures += signature.signatureCount;
    }
  }

  let positiveCount = 0;
  let negativeCount = 0;
  let netScore = 0;

  const leaderboardMap = new Map<string, LeaderboardItem>();

  for (const evaluation of evaluations) {
    const signed = signedEvaluationScore(
      evaluation.score,
      evaluation.criterion.impact
    );

    if (signed >= 0) {
      positiveCount += 1;
    } else {
      negativeCount += 1;
    }

    netScore += signed;

    const userId = evaluation.evaluatedUserId;
    if (userId && evaluation.evaluatedUser) {
      const current = leaderboardMap.get(userId) || {
        userId,
        fullName: evaluation.evaluatedUser.fullName,
        count: 0,
        score: 0,
      };

      current.count += 1;
      current.score += signed;
      leaderboardMap.set(userId, current);
    }
  }

  const topSigners: TopSignerItem[] = signerGroups.map(group => ({
    userId: group.userId,
    fullName: usersById.get(group.userId) || "Utilisateur",
    count: group._sum?.signatureCount || 0,
  }));

  const criteriaUsage: CriteriaUsageItem[] = criteriaRows
    .map(row => ({
      name: criteriaById.get(row.criterionId) || "Critère",
      count: row._count._all,
    }))
    .sort((left, right) => right.count - left.count);

  const leaderboardTop = Array.from(leaderboardMap.values())
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.count - left.count;
    })
    .slice(0, 8);

  const incidentBreakdown = Array.from(incidentTypeMap.values()).sort(
    (left, right) => right.total - left.total
  );

  const reportBreakdown = Array.from(reportTypeMap.values()).sort(
    (left, right) => right.total - left.total
  );

  const serviceBreakdown = Array.from(serviceMap.values()).sort(
    (left, right) => right.incidentCount - left.incidentCount
  );

  const unreadReports = reports.filter(report => !report.isRead).length;

  return {
    range: {
      preset: range.preset,
      from: range.from,
      to: range.to,
      description: formatRangeLabel(range),
    },
    summary: {
      reports: reports.length,
      incidents: incidentEntries.length,
      unreadReports,
      signatures: signatureRows.reduce((sum, sig) => sum + sig.signatureCount, 0),
      netEvaluationScore: netScore,
      positiveEvaluations: positiveCount,
    },
    trend: Array.from(trendByDate.values()),
    incidentTypeBreakdown: incidentBreakdown,
    reportTypeBreakdown: reportBreakdown,
    serviceBreakdown,
    topSigners,
    evaluationSummary: {
      positiveCount,
      negativeCount,
      netScore,
    },
    leaderboard: {
      top: leaderboardTop,
    },
    criteriaUsage,
  };
}
