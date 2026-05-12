import { redirect } from "next/navigation";
import { CriteriaManager } from "@/components/criteria-management/criteria-manager";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function CriteriaPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAdminWorkspace(session.role)) {
    redirect("/");
  }

  const criteria = await prisma.criterion.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      impact: true,
      defaultWeight: true,
      maxDaily: true,
      isActive: true,
      createdAt: true,
      createdById: true,
    },
  });

  const initialCriteria = criteria.map(criterion => ({
    ...criterion,
    defaultWeight: criterion.defaultWeight.toString(),
    createdAt: criterion.createdAt.toISOString(),
  }));

  return <CriteriaManager initialCriteria={initialCriteria} />;
}
