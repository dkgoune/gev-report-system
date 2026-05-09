import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { canAccessPlatform } from "@/lib/authz";
import { getServerSession } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessPlatform(session.role)) {
    redirect("/auth/login?error=unauthorized");
  }

  return <AppShell session={session}>{children}</AppShell>;
}
