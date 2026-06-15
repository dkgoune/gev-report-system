import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { getReportViewLimits } from "@/lib/report-view-limit";
import { ReportedIncidentsList } from "@/components/reports/reported-incidents-list";

type ReportedIncidentsPageProps = {
  searchParams: Promise<{
    from?: string;
    page?: string;
    pageSize?: string;
    templateId?: string;
    to?: string;
  }>;
};

function normalizePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(value: string | undefined) {
  const parsed = Number(value);
  if (parsed === 20 || parsed === 50) {
    return parsed;
  }
  return 10;
}

function normalizeDateInput(value: string | undefined) {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export default async function ReportedIncidentsPage({
  searchParams,
}: ReportedIncidentsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "report_read")) {
    redirect("/");
  }

  const query = await searchParams;
  const templateId = (query.templateId || "").trim();
  const startDate = normalizeDateInput(query.from);
  const endDate = normalizeDateInput(query.to);
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);

  const limits = await getReportViewLimits(session);

  const andConditions: any[] = [];

  if (limits.hasLimit) {
    andConditions.push({
      generalReport: {
        OR: [
          { reportedById: session.userId },
          {
            reportedBy: {
              memberships: {
                some: {
                  agencyId: session.activeAgencyId,
                  roles: {
                    some: {
                      id: { in: limits.allowedRoleIds },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });
  }

  if (startDate || endDate) {
    andConditions.push({
      workSchedule: {
        workDate: {
          ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
          ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
        },
      },
    });
  }

  if (templateId) {
    andConditions.push({ templateId });
  }

  const where: any = {
    workSchedule: {
      agencyId: session.activeAgencyId,
    },
  };

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [totalItems, templates, agency] = await Promise.all([
    prisma.generalReportIncidentEntry.count({ where }),
    prisma.incidentTemplate.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.agency.findUnique({
      where: { id: session.activeAgencyId },
      select: { name: true },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);

  const incidents = await prisma.generalReportIncidentEntry.findMany({
    where,
    orderBy: [{ workSchedule: { workDate: "desc" } }, { createdAt: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      generalReportId: true,
      templateId: true,
      templateNameSnapshot: true,
      templateCodeSnapshot: true,
      valuesJson: true,
      schemaSnapshotJson: true,
      createdAt: true,
      workSchedule: {
        select: {
          workDate: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      },
      generalReport: {
        select: {
          reportedBy: {
            select: {
              fullName: true,
              username: true,
            },
          },
        },
      },
    },
  });

  return (
    <ReportedIncidentsList
      agencyName={agency?.name || "Agence"}
      incidents={incidents.map(inc => ({
        id: inc.id,
        generalReportId: inc.generalReportId,
        templateName: inc.templateNameSnapshot,
        templateCode: inc.templateCodeSnapshot,
        valuesJson: inc.valuesJson,
        schemaSnapshotJson: inc.schemaSnapshotJson,
        createdAt: inc.createdAt.toISOString(),
        workDate: inc.workSchedule.workDate.toISOString(),
        serviceName: inc.workSchedule.service.name,
        reportedBy: inc.generalReport.reportedBy,
      }))}
      templates={templates}
      filters={{
        templateId,
        startDate,
        endDate,
        page: currentPage,
        pageSize,
      }}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}
