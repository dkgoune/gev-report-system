import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { getServerSession } from "@/lib/session";
import { GroupsManager } from "@/components/user-management/groups-manager";

export default async function GroupsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAdminWorkspace(session.role)) {
    redirect("/");
  }

  const groups = await prisma.group.findMany({
    orderBy: [{ service: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      service: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  const initialGroups = groups.map(group => ({
    id: group.id,
    name: group.name,
    service: group.service,
    isActive: group.isActive,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
    memberCount: group._count.users,
  }));

  return <GroupsManager initialGroups={initialGroups} />;
}
