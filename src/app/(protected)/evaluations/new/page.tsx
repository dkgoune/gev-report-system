import { EvaluationManager } from "@/components/evaluation-management/evaluation-manager";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function CreateEvaluationPage() {
  const session = await getServerSession();

  const [users, criteria] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: [
            "agent",
            "convoyeur",
            "leader_envoi",
            "leader_piste",
            "leader_retrait",
          ],
        },
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        role: true,
      },
    }),
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
      initialCriteria={criteria.map((criterion) => ({
        ...criterion,
        defaultWeight: criterion.defaultWeight.toString(),
      }))}
      initialUsers={users}
    />
  );
}
