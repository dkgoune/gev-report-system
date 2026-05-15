import { redirect } from "next/navigation";
import { ReportsOverview } from "../../../components/reports/reports-overview";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type ReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    isRead?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    serviceId?: string;
    sortDirection?: string;
    sortField?: string;
    to?: string;
  }>;
};

type SortField = "reportDate" | "createdAt" | "reportedBy" | "isRead";

function normalizePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(value: string | undefined) {
  const allowed = new Set([10, 20, 50]);
  const parsed = Number(value);
  return allowed.has(parsed) ? parsed : 20;
}

function normalizeSortField(value: string | undefined): SortField {
  if (
    value === "reportDate" ||
    value === "createdAt" ||
    value === "reportedBy" ||
    value === "isRead"
  ) {
    return value;
  }

  return "reportDate";
}

function normalizeSortDirection(value: string | undefined): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "report_read")) {
    return <ReportsOverview canViewList={false} />;
  }

  const query = await searchParams;
  const search = (query.q || "").trim();
  const serviceId = (query.serviceId || "").trim();
  const isRead =
    query.isRead === "true" || query.isRead === "false" ? query.isRead : "";
  const startDate = query.from || "";
  const endDate = query.to || "";
  const pageSize = normalizePageSize(query.pageSize);
  const sortField = normalizeSortField(query.sortField);
  const sortDirection = normalizeSortDirection(query.sortDirection);

  const where: Record<string, unknown> = {
    workSchedule: {
      agencyId: session.activeAgencyId,
      ...(serviceId ? { serviceId } : {}),
    },
  };

  if (isRead) {
    where.isRead = isRead === "true";
  }

  if (search) {
    where.OR = [
      { ambianceGenerale: { contains: search, mode: "insensitive" } },
      { problemesRencontres: { contains: search, mode: "insensitive" } },
      { observationGeneral: { contains: search, mode: "insensitive" } },
      { reportedBy: { fullName: { contains: search, mode: "insensitive" } } },
      { reportedBy: { username: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (startDate || endDate) {
    where.workSchedule = {
      ...(where.workSchedule as Record<string, unknown>),
      workDate: {
        ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
        ...(endDate ? { lte: new Date(`${endDate}T00:00:00.000Z`) } : {}),
      },
    };
  }

  const orderBy =
    sortField === "reportedBy"
      ? ({ reportedBy: { fullName: sortDirection } } as const)
      : sortField === "reportDate"
        ? ({ workSchedule: { workDate: sortDirection } } as const)
        : ({ [sortField]: sortDirection } as const);

  const [totalItems, services] = await Promise.all([
    prisma.generalReport.count({
      where: where as never,
    }),
    prisma.serviceDefinition.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const page = Math.min(normalizePage(query.page), totalPages);

  const reports =
    totalItems > 0
      ? await prisma.generalReport.findMany({
          where: where as never,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            reportedBy: {
              select: {
                fullName: true,
                username: true,
              },
            },
            workSchedule: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        })
      : [];

  const payload = {
    filters: {
      search,
      serviceId,
      isRead,
      startDate,
      endDate,
      page,
      pageSize,
      sortField,
      sortDirection,
    },
    pagination: {
      totalItems,
      totalPages,
    },
    reports: reports.map(report => ({
      id: report.id,
      reportDate: report.workSchedule.workDate.toISOString(),
      isRead: report.isRead,
      createdAt: report.createdAt.toISOString(),
      serviceId: report.workSchedule.service.id,
      serviceName: report.workSchedule.service.name,
      reportedBy: {
        fullName: report.reportedBy.fullName,
        username: report.reportedBy.username,
      },
      problemesRencontres: report.problemesRencontres,
      observationGeneral: report.observationGeneral,
      ambianceGenerale: report.ambianceGenerale,
    })),
  };

  return (
    <ReportsOverview
      canViewList
      filters={payload.filters}
      services={services}
      reports={payload.reports}
      totalItems={payload.pagination.totalItems}
      totalPages={payload.pagination.totalPages}
    />
  );
}
