import { redirect } from "next/navigation";
import { ReportsOverview } from "../../../components/reports/reports-overview";
import { prisma } from "@/lib/prisma";
import { listReports } from "@/lib/report-records";
import { getServerSession } from "@/lib/session";

type ReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    groupId?: string;
    isRead?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    service?: string;
    sortDirection?: string;
    sortField?: string;
    to?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.role === "subleader") {
    return <ReportsOverview canViewList={false} />;
  }

  const [payload, groups] = await Promise.all([
    listReports("general", session, await searchParams),
    session.role === "admin"
      ? prisma.group.findMany({
          where: { isActive: true },
          orderBy: [{ service: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            service: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <ReportsOverview
      canViewList
      filters={payload.filters}
      groups={groups}
      isAdmin={session.role === "admin"}
      reports={payload.reports}
      totalItems={payload.pagination.totalItems}
      totalPages={payload.pagination.totalPages}
    />
  );
}
