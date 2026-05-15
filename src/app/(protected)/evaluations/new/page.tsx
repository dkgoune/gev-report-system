import { EvaluationManager } from "@/components/evaluation-management/evaluation-manager";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { listScopedUsers } from "@/lib/user-scope";

export default async function CreateEvaluationPage() {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "evaluation_create")) {
    return null;
  }

  const [users, criteria, schedules] = await Promise.all([
    listScopedUsers(session),
    prisma.criterion.findMany({
      where: {
        isActive: true,
        agencyId: session.activeAgencyId,
      },
      orderBy: [{ impact: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        impact: true,
      },
    }),
    prisma.workSchedule.findMany({
      where: {
        agencyId: session.activeAgencyId,
        status: "published",
      },
      orderBy: [{ workDate: "desc" }],
      take: 100,
      select: {
        id: true,
        workDate: true,
        service: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <EvaluationManager
      canViewList={hasPermission(session, "evaluation_read")}
      initialCriteria={criteria}
      initialSchedules={schedules.map(schedule => ({
        id: schedule.id,
        workDate: schedule.workDate.toISOString(),
        serviceName: schedule.service.name,
      }))}
      initialUsers={users}
    />
  );
}
