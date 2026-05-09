import { CriterionEditorForm } from "@/components/criteria-management/criterion-editor-form";

export default function CreateCriterionPage() {
  return (
    <CriterionEditorForm
      mode="create"
      title="Ajouter un critère"
      description="Créez une nouvelle règle d'évaluation pour le personnel."
    />
  );
}
