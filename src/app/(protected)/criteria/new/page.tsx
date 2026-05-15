import { redirect } from "next/navigation";
import { CriterionEditorForm } from "@/components/criteria-management/criterion-editor-form";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export default async function CreateCriterionPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "criteria_create")) {
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
