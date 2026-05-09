import { notFound } from "next/navigation";
import { CriterionEditorForm } from "@/components/criteria-management/criterion-editor-form";
import { prisma } from "@/lib/prisma";

type EditCriterionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCriterionPage({
  params,
}: EditCriterionPageProps) {
  const { id } = await params;

  const criterion = await prisma.criterion.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      impact: true,
      defaultWeight: true,
      isActive: true,
    },
  });

  if (!criterion) {
    notFound();
  }

  return (
    <CriterionEditorForm
      mode="update"
      criterionId={criterion.id}
      initialState={{
        name: criterion.name,
        impact: criterion.impact,
        defaultWeight: criterion.defaultWeight.toString(),
        isActive: criterion.isActive,
      }}
      title={`Mettre a jour ${criterion.name}`}
      description="Modifiez le libellé, l'impact ou le poids du critère depuis une page dédiée."
    />
  );
}
