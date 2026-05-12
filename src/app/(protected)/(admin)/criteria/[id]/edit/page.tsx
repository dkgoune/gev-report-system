import { notFound, redirect } from "next/navigation";
import { CriterionEditorForm } from "@/components/criteria-management/criterion-editor-form";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type EditCriterionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCriterionPage({
  params,
}: EditCriterionPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAdminWorkspace(session.role)) {
    redirect("/");
  }

  const { id } = await params;

  const criterion = await prisma.criterion.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      impact: true,
      defaultWeight: true,
      maxDaily: true,
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
        maxDaily: criterion.maxDaily === null ? "" : String(criterion.maxDaily),
        isActive: criterion.isActive,
      }}
      title={`Mettre a jour ${criterion.name}`}
      description="Modifiez le libellé, l'impact, le poids ou la limite quotidienne du critère depuis une page dédiée."
    />
  );
}
