import { redirect } from "next/navigation";
import { ReportCreationManager } from "@/components/reports/report-creation-manager";
import { GENERAL_REPORT_FIELDS } from "@/components/reports/report-general-fields";
import { canAccessAgencyAdminWorkspace, canCreateReports } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type NewReportPageProps = {
  searchParams: Promise<{
    workScheduleId?: string;
  }>;
};

export default async function NewReportPage({
  searchParams,
}: NewReportPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canCreateReports(session)) {
    redirect("/reports");
  }

  const query = await searchParams;

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const earliestIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const todayDate = new Date(`${todayIso}T00:00:00.000Z`);
  const earliestDate = new Date(`${earliestIso}T00:00:00.000Z`);

  const isAdmin = canAccessAgencyAdminWorkspace(session);

  const schedules = await prisma.workSchedule.findMany({
    where: {
      agencyId: session.activeAgencyId,
      workDate: {
        gte: earliestDate,
        lte: todayDate,
      },
      ...(!isAdmin
        ? {
            assignments: {
              some: {
                userId: session.userId,
                OR: [{ isLeader: true }, { isSubleader: true }],
              },
            },
          }
        : {}),
      generalReport: null,
    },
    orderBy: [{ workDate: "desc" }],
    select: {
      id: true,
      workDate: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      assignments: {
        select: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              memberships: {
                where: {
                  agencyId: session.activeAgencyId,
                  isActive: true,
                },
                take: 1,
                select: {
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (schedules.length === 0) {
    redirect("/");
  }

  const availableSchedules = schedules.map(schedule => ({
    id: schedule.id,
    workDate: schedule.workDate.toISOString(),
    serviceId: schedule.service.id,
    serviceName: schedule.service.name,
  }));

  const personnelBySchedule = Object.fromEntries(
    schedules.map(schedule => [
      schedule.id,
      schedule.assignments.map(assignment => ({
        id: assignment.user.id,
        fullName: assignment.user.fullName,
        username: assignment.user.username,
        role: assignment.user.memberships[0]?.role ?? "worker",
      })),
    ])
  );

  const requestedScheduleId = (query.workScheduleId || "").trim();
  const initialWorkScheduleId = availableSchedules.some(
    schedule => schedule.id === requestedScheduleId
  )
    ? requestedScheduleId
    : availableSchedules[0].id;

  return (
    <ReportCreationManager
      generalFields={GENERAL_REPORT_FIELDS}
      schedules={availableSchedules}
      initialWorkScheduleId={initialWorkScheduleId}
      personnelBySchedule={personnelBySchedule}
    />
  );
}
