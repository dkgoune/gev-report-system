import { redirect } from "next/navigation";
import { AgenciesManager } from "@/components/agency-management/agencies-manager";
import { isSuperAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function AgenciesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!isSuperAdmin(session)) {
    redirect("/");
  }

  const agencies = await prisma.agency.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <AgenciesManager
      initialAgencies={agencies.map(agency => ({
        ...agency,
        createdAt: agency.createdAt.toISOString(),
        updatedAt: agency.updatedAt.toISOString(),
      }))}
    />
  );
}
