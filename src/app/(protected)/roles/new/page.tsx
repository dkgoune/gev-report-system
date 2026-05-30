import { redirect } from "next/navigation";
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

  return (
    <RoleEditorForm
      mode="create"
      initialState={{
        name: "",
        description: "",
        permissions: [],
      }}
      title="Ajouter un nouveau rôle"
      description="Définissez un nouveau rôle et attribuez-lui des permissions spécifiques pour votre agence."
    />
  );
}
