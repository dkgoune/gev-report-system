import { notFound, redirect } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "user_update")) {
    redirect("/");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      username: true,
      phone: true,
      isActive: true,
      memberships: {
        select: {
          agencyId: true,
          isActive: true,
          roles: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Format memberships for the form state
  const formattedMemberships = user.memberships.map(m => ({
    agencyId: m.agencyId,
    isActive: m.isActive,
    roleIds: m.roles.map(r => r.id),
  }));

  return (
    <UserEditorForm
      mode="update"
      userId={user.id}
      initialState={{
        fullName: user.fullName,
        username: user.username,
        phone: user.phone || "",
        password: "",
        isActive: user.isActive,
        roleIds: [], // kept for type safety, but the component will use memberships
        memberships: formattedMemberships,
      }}
      title={`Mettre à jour ${user.fullName}`}
      description="Modifiez les informations, les liaisons d'agences et les rôles du personnel depuis une page dédiée."
      canEditPermissions={hasPermission(session, "user_manage_permissions")}
    />
  );
}
