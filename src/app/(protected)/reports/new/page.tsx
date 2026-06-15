import { redirect } from "next/navigation";
import { ReportCreationManager } from "@/components/reports/report-creation-manager";
import { GENERAL_REPORT_FIELDS } from "@/components/reports/report-general-fields";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { getAgencyIncidentBindings } from "@/lib/incident-management";

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

  if (!hasPermission(session, "report_create")) {
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

  const schedules = await prisma.workSchedule.findMany({
    where: {
      agencyId: session.activeAgencyId,
      workDate: {
        gte: earliestDate,
        lte: todayDate,
      },

      OR: [{ generalReport: null }, { generalReport: { status: "draft" } }],
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
          postId: true,
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
              },
            },
          },
        },
      },
      generalReport: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (schedules.length === 0) {
    redirect("/");
  }

  // Incident bindings are needed to determine which incident fields
  // should be displayed in the report creation form
  const initialIncidentBoundings = await getAgencyIncidentBindings(
    session.activeAgencyId
  );

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
      })),
    ])
  );

  const initialReportIdBySchedule = Object.fromEntries(
    schedules
      .map(schedule => [schedule.id, schedule.generalReport?.id ?? ""])
      .filter(([, reportId]) => reportId)
  ) as Record<string, string>;

  const userPostIdBySchedule = Object.fromEntries(
    schedules.map(schedule => {
      const myAssignment = schedule.assignments.find(
        assignment => assignment.user.id === session.userId
      );
      return [schedule.id, myAssignment?.postId ?? ""];
    })
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
      initialReportIdBySchedule={initialReportIdBySchedule}
      personnelBySchedule={personnelBySchedule}
      initialIncidentBoundings={initialIncidentBoundings}
      userPostIdBySchedule={userPostIdBySchedule}
    />
  );
}
