import { notFound } from "next/navigation";
import { UserEditorForm } from "@/components/user-management/user-editor-form";
import { prisma } from "@/lib/prisma";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      phone: true,
      isActive: true,
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
        role: user.role,
        phone: user.phone || "",
        password: "",
        isActive: user.isActive,
      }}
      title={`Mettre a jour ${user.fullName}`}
      description="Modifiez les informations du personnel depuis une page dédiée."
    />
  );
}
