import { notFound, redirect } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { canAccessAdminWorkspace } from "@/lib/authz";
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

  if (!canAccessAdminWorkspace(session.role)) {
    redirect("/");
  }

  const { id } = await params;

  const [user, groups] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        groupId: true,
        phone: true,
        isActive: true,
      },
    }),
    prisma.group.findMany({
      where: { isActive: true },
      orderBy: [{ service: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        service: true,
      },
    }),
  ]);

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
        role: user.role,
        groupId: user.groupId ?? "",
        phone: user.phone || "",
        password: "",
        isActive: user.isActive,
      }}
      groups={groups}
      title={`Mettre a jour ${user.fullName}`}
      description="Modifiez les informations du personnel depuis une page dédiée."
    />
  );
}
