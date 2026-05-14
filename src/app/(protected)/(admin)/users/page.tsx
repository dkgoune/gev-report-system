import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { getServerSession } from "@/lib/session";
import { UsersManager } from "@/components/user-management/users-manager";

export default async function UsersPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          agencyId: session.activeAgencyId,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      username: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        where: {
          agencyId: session.activeAgencyId,
        },
        select: {
          role: true,
          isActive: true,
        },
      },
    },
  });

  const initialUsers = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.memberships[0]?.role ?? "worker",
    membershipActive: user.memberships[0]?.isActive ?? false,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <UsersManager
      initialUsers={initialUsers}
      currentUserRole={session.activeMembershipRole}
    />
  );
}
