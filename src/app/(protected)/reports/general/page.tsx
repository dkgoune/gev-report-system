import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Service } from "@/generated/prisma/enums";
import { DailyReportHistory } from "@/components/daily-report-management/daily-report-history";
import { getServiceForRole, isValidService } from "@/lib/services";
import { getServerSession } from "@/lib/session";

type GeneralReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    isRead?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    service?: string;
    to?: string;
  }>;
};

type DailyReportsPayload = {
  reports: Array<{
    id: string;
    reportDate: string;
    service: Service;
    isRead: boolean;
    personnelPresent: string | null;
    personnelAbsent: string | null;
    ambianceGenerale: string | null;
    problemesRencontres: string | null;
    etatGeneralService: string | null;
    passationService: string | null;
    observationGeneral: string | null;
    createdAt: string;
    reportedBy: {
      id: string;
      fullName: string;
      username: string;
    };
  }>;
  filters: {
    search: string;
    service: Service | "";
    isRead: string;
    startDate: string;
    endDate: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export default async function GeneralReportsPage({
  searchParams,
}: GeneralReportsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const leaderService = getServiceForRole(session.role);
  const serviceFilter =
    session.role === "admin"
      ? params.service && isValidService(params.service)
        ? params.service
        : ""
      : leaderService;

  if (session.role !== "admin" && !serviceFilter) {
    redirect("/");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "http";

  if (!host) {
    throw new Error("Host header is required to fetch daily reports.");
  }

  const apiParams = new URLSearchParams();
  apiParams.set("mode", "list");

  if (params.q) {
    apiParams.set("q", params.q);
  }

  if (serviceFilter) {
    apiParams.set("service", serviceFilter);
  }

  if (params.from) {
    apiParams.set("from", params.from);
  }

  if (params.isRead) {
    apiParams.set("isRead", params.isRead);
  }

  if (params.to) {
    apiParams.set("to", params.to);
  }

  if (params.page) {
    apiParams.set("page", params.page);
  }

  if (params.pageSize) {
    apiParams.set("pageSize", params.pageSize);
  }

  const response = await fetch(
    `${protocol}://${host}/api/daily-reports?${apiParams.toString()}`,
    {
      headers: {
        cookie: headerStore.get("cookie") || "",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les rapports journaliers.");
  }

  const payload = (await response.json()) as DailyReportsPayload;
  const isAdmin = session.role === "admin";

  return (
    <DailyReportHistory
      filters={{
        page: payload.pagination.page,
        pageSize: payload.pagination.pageSize,
        search: payload.filters.search,
        service: payload.filters.service,
        isRead: payload.filters.isRead,
        startDate: payload.filters.startDate,
        endDate: payload.filters.endDate,
      }}
      isAdmin={isAdmin}
      reports={payload.reports}
      totalItems={payload.pagination.totalItems}
      totalPages={payload.pagination.totalPages}
    />
  );
}
