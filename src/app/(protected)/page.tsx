import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
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

  return <UserLandingPageComponent session={session} />;
}
