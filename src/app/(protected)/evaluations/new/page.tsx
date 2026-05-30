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

  const [users, criteria] = await Promise.all([
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
  ]);

  return (
    <EvaluationManager
      canViewList={hasPermission(session, "evaluation_read")}
      initialCriteria={criteria}
      initialUsers={users}
    />
  );
}
