import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import ViewReportComponent from "@/components/reports/view-report-component";
import { hasPermission } from "@/lib/permissions";

type ReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (
    !hasPermission(
      session,
      "report_read",
      "report_create",
      "report_update",
      "report_mark_read"
    )
  ) {
    redirect("/");
  }

  const { id } = await params;
  const report = await prisma.generalReport.findFirst({
    where: {
      id,
      workSchedule: {
        agencyId: session.activeAgencyId,
      },
    },
    include: {
      reportedBy: {
        select: {
          fullName: true,
          username: true,
        },
      },
      readBy: {
        select: {
          fullName: true,
        },
      },
      workSchedule: {
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      },
      incidentEntries: {
        orderBy: [{ displayOrder: "asc" }],
      },
      attendances: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!report) {
    notFound();
  }

  const canUpdate = hasPermission(session, "report_create", "report_update");
  const canMarkRead = hasPermission(session, "report_mark_read");

  return (
    <ViewReportComponent
      report={report}
      canUpdate={canUpdate}
      canMarkRead={canMarkRead}
    />
  );
}
