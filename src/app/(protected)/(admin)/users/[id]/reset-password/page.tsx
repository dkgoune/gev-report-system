import { notFound, redirect } from "next/navigation";
import { UserResetPasswordPage } from "@/components/user-management/user-reset-password-page";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type ResetPasswordPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
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
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <UserResetPasswordPage userId={user.id} userFullName={user.fullName} />
  );
}
