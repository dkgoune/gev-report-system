import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import UserLandingPageComponent from "@/components/layout/user-landing-page";

type DashboardPageProps = {
  searchParams: Promise<{
    from?: string;
    preset?: string;
    to?: string;
  }>;
};

export default async function DashboardPage({}: DashboardPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      fullName: true,
      username: true,
      phone: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return <UserLandingPageComponent session={session} user={user} />;
}
