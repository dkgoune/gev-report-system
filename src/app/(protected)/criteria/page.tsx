import { CriteriaManager } from "@/components/criteria-management/criteria-manager";
import { prisma } from "@/lib/prisma";

export default async function CriteriaPage() {
  const criteria = await prisma.criterion.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      impact: true,
      defaultWeight: true,
      isActive: true,
      createdAt: true,
      createdById: true,
    },
  });

  const initialCriteria = criteria.map((criterion) => ({
    ...criterion,
    defaultWeight: criterion.defaultWeight.toString(),
    createdAt: criterion.createdAt.toISOString(),
  }));

  return <CriteriaManager initialCriteria={initialCriteria} />;
}
