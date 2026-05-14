import { redirect } from "next/navigation";
import { CriterionEditorForm } from "@/components/criteria-management/criterion-editor-form";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { getServerSession } from "@/lib/session";

export default async function CreateCriterionPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  return (
    <CriterionEditorForm
      mode="create"
      title="Ajouter un critère"
      description="Créez une nouvelle règle d'évaluation avec son impact et sa limite quotidienne."
    />
  );
}
