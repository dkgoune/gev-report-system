import { redirect } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { defaultUserFormState } from "@/components/user-management/constants";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export default async function CreateUserPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "user_create")) {
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
