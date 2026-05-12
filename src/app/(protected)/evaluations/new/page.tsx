import { EvaluationManager } from "@/components/evaluation-management/evaluation-manager";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { listScopedUsers } from "@/lib/user-scope";

const EVALUATION_TARGET_ROLES = [
  "agent",
  "convoyer",
  "leader",
  "subleader",
] as const;

export default async function CreateEvaluationPage() {
  const session = await getServerSession();

  const [users, criteria] = await Promise.all([
    session ? listScopedUsers(session, [...EVALUATION_TARGET_ROLES]) : [],
    prisma.criterion.findMany({
      where: { isActive: true },
      orderBy: [{ impact: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        impact: true,
        defaultWeight: true,
      },
    }),
  ]);

  return (
    <EvaluationManager
      canViewList={session?.role === "admin"}
      initialCriteria={criteria.map(criterion => ({
        ...criterion,
        defaultWeight: criterion.defaultWeight.toString(),
      }))}
      initialUsers={users}
    />
  );
}
