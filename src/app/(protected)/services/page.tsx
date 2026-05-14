import { redirect } from "next/navigation";
import { ServicesManager } from "@/components/service-management/services-manager";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function ServicesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  const services = await prisma.serviceDefinition.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      color: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <ServicesManager
      initialServices={services.map(service => ({
        ...service,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      }))}
    />
  );
}
