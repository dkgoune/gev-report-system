import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import ViewReportComponent from "@/components/reports/view-report-component";
import { hasPermission } from "@/lib/permissions";
import { getReportViewLimits } from "@/lib/report-view-limit";

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
  const limits = await getReportViewLimits(session);

  const andConditions: any[] = [];
  if (limits.hasLimit) {
    andConditions.push({
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
    });
  }

  const where: any = {
    id,
    workSchedule: {
      agencyId: session.activeAgencyId,
    },
  };

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const report = await prisma.generalReport.findFirst({
    where,
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
        include: {
          template: {
            include: {
              allowedPosts: true,
            },
          },
        },
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

  const userAssignment = await prisma.workScheduleAssignment.findFirst({
    where: {
      workScheduleId: report.workScheduleId,
      userId: session.userId,
    },
    select: {
      postId: true,
      isLeader: true,
      isSubleader: true,
    },
  });

  const canReadAllIncidents = hasPermission(session, "report_read_all_incidents");
  const canUpdate = hasPermission(session, "report_create", "report_update");
  const canMarkRead = hasPermission(session, "report_mark_read");

  return (
    <ViewReportComponent
      report={report}
      canUpdate={canUpdate}
      canMarkRead={canMarkRead}
      userAssignment={userAssignment}
      canReadAllIncidents={canReadAllIncidents}
    />
  );
}
