import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { defaultUserFormState } from "@/components/user-management/constants";

export default function CreateUserPage() {
  return (
    <UserEditorForm
      mode="create"
      initialState={defaultUserFormState}
      title="Ajouter un personnel"
      description="Créez un nouveau compte puis revenez a la liste des personnels."
    />
  );
}
