import { notFound, redirect } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
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
      memberships: {
        where: {
          agencyId: session.activeAgencyId,
        },
        select: {
          role: true,
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
        role: user.memberships[0]?.role ?? "worker",
        phone: user.phone || "",
        password: "",
        isActive: user.isActive,
      }}
      title={`Mettre a jour ${user.fullName}`}
      description="Modifiez les informations du personnel depuis une page dédiée."
    />
  );
}
