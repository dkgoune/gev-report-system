import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { UsersManager } from "@/components/user-management/users-manager";

export default async function UsersPage() {
  const session = await getServerSession();
  const currentUserRole = session?.role ?? "agent";

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
    },
  });

  const initialUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <UsersManager
      initialUsers={initialUsers}
      currentUserRole={currentUserRole}
    />
  );
}
