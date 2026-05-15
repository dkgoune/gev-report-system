import { redirect } from "next/navigation";
import { CriteriaManager } from "@/components/criteria-management/criteria-manager";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export default async function CriteriaPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "criteria_read")) {
    redirect("/");
  }

  const criteria = await prisma.criterion.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      impact: true,
      weight: true,
      maxDaily: true,
      isActive: true,
      createdAt: true,
      createdById: true,
    },
  });

  const initialCriteria = criteria.map(criterion => ({
    ...criterion,
    weight: criterion.weight.toString(),
    createdAt: criterion.createdAt.toISOString(),
  }));

  return <CriteriaManager initialCriteria={initialCriteria} />;
}
