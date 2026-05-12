import { redirect } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { defaultUserFormState } from "@/components/user-management/constants";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function CreateUserPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAdminWorkspace(session.role)) {
    redirect("/");
  }

  const groups = await prisma.group.findMany({
    where: { isActive: true },
    orderBy: [{ service: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      service: true,
    },
  });

  return (
    <UserEditorForm
      mode="create"
      initialState={defaultUserFormState}
      groups={groups}
      title="Ajouter un personnel"
      description="Créez un nouveau compte puis revenez a la liste des personnels."
    />
  );
}
