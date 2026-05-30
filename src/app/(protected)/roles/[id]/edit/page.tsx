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

  const role = await prisma.role.findUnique({
    where: { id },
  });

  if (!role || role.agencyId !== session.activeAgencyId) {
    notFound();
  }

  return (
    <RoleEditorForm
      mode="update"
      roleId={role.id}
      initialState={{
        name: role.name,
        description: role.description || "",
        permissions: role.permissions,
      }}
      title={`Modifier le rôle : ${role.name}`}
      description="Ajustez le nom, la description ou modifiez la grille des permissions de ce rôle."
    />
  );
}
