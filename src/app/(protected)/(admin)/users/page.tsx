import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { getServerSession } from "@/lib/session";
import { UsersManager } from "@/components/user-management/users-manager";

export default async function UsersPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAdminWorkspace(session.role)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      group: {
        select: {
          id: true,
          name: true,
          service: true,
          isActive: true,
        },
      },
    },
  });

  const initialUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <UsersManager initialUsers={initialUsers} currentUserRole={session.role} />
  );
}
