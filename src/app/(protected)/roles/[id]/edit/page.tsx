import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { RoleEditorForm } from "@/components/role-management/role-editor-form";

type EditRolePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRolePage({ params }: EditRolePageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "user_manage_permissions")) {
    redirect("/");
  }

  const { id } = await params;

  const [role, roles] = await Promise.all([
    prisma.role.findUnique({
      where: { id },
      include: {
        allowedToViewReportsOf: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.role.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!role || role.agencyId !== session.activeAgencyId) {
    notFound();
  }

  return (
    <RoleEditorForm
      mode="update"
      roleId={role.id}
      availableRoles={roles}
      initialState={{
        name: role.name,
        description: role.description || "",
        permissions: role.permissions,
        allowedToViewRoleIds: role.allowedToViewReportsOf.map(r => r.id),
      }}
      title={`Modifier le rôle : ${role.name}`}
      description="Ajustez le nom, la description ou modifiez la grille des permissions de ce rôle."
    />
  );
}
