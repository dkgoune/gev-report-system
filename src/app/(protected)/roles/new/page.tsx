import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { RoleEditorForm } from "@/components/role-management/role-editor-form";

export default async function NewRolePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "user_manage_permissions")) {
    redirect("/");
  }

  const roles = await prisma.role.findMany({
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
  });

  return (
    <RoleEditorForm
      mode="create"
      availableRoles={roles}
      initialState={{
        name: "",
        description: "",
        permissions: [],
        allowedToViewRoleIds: [],
      }}
      title="Ajouter un nouveau rôle"
      description="Définissez un nouveau rôle et attribuez-lui des permissions spécifiques pour votre agence."
    />
  );
}
