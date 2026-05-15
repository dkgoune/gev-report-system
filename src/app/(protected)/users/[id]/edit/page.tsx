import { notFound, redirect } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "user_update")) {
    redirect("/");
  }

  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: {
      id,
      memberships: {
        some: {
          agencyId: session.activeAgencyId,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      phone: true,
      isActive: true,
      userPermissionRules: {
        where: {
          agencyId: session.activeAgencyId,
          isEnabled: true,
        },
        select: {
          permission: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <UserEditorForm
      mode="update"
      userId={user.id}
      initialState={{
        fullName: user.fullName,
        username: user.username,
        phone: user.phone || "",
        password: "",
        isActive: user.isActive,
        permissions: user.userPermissionRules.map(rule => rule.permission),
      }}
      title={`Mettre a jour ${user.fullName}`}
      description="Modifiez les informations du personnel depuis une page dédiée."
    />
  );
}
