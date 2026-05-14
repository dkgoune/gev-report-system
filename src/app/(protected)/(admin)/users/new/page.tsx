import { redirect } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { defaultUserFormState } from "@/components/user-management/constants";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { getServerSession } from "@/lib/session";

export default async function CreateUserPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  return (
    <UserEditorForm
      mode="create"
      initialState={defaultUserFormState}
      title="Ajouter un personnel"
      description="Créez un nouveau compte puis revenez a la liste des personnels."
    />
  );
}
