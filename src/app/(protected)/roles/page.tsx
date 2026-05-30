import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { RolesList, type RoleListItem } from "@/components/role-management/roles-list";

export default async function RolesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Only allow users with user_manage_permissions to access role management
  if (!hasPermission(session, "user_manage_permissions")) {
    redirect("/");
  }

  const roles = await prisma.role.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      createdBy: {
        select: {
          fullName: true,
        },
      },
      memberships: {
        select: {
          id: true,
        },
      },
    },
  });

  const formattedRoles: RoleListItem[] = roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissionsCount: role.permissions.length,
    membersCount: role.memberships.length,
    creatorName: role.createdBy?.fullName || "Système",
    createdAt: role.createdAt.toISOString(),
  }));

  const canManage = hasPermission(session, "user_manage_permissions");

  return <RolesList initialRoles={formattedRoles} canManage={canManage} />;
}
