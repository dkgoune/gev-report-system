import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { canAccessPlatform } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
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

  if (!canAccessPlatform(session)) {
    redirect("/auth/login?error=unauthorized");
  }

  const memberships = await prisma.userAgencyMembership.findMany({
    where: {
      userId: session.userId,
      isActive: true,
      agency: {
        isActive: true,
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
    select: {
      agencyId: true,
      role: true,
      agency: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!memberships.length) {
    redirect("/auth/login?error=unauthorized");
  }

  if (
    !memberships.some(
      membership => membership.agencyId === session.activeAgencyId
    )
  ) {
    redirect("/auth/login?error=unauthorized");
  }

  return (
    <AppShell
      session={session}
      memberships={memberships.map(membership => ({
        agencyId: membership.agencyId,
        agencyName: membership.agency.name,
        role: membership.role,
      }))}
    >
      {children}
    </AppShell>
  );
}
