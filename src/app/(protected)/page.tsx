import { redirect } from "next/navigation";
import { DashboardSurface } from "@/components/analytics/analytics-surfaces";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { getAnalyticsSnapshot } from "../../lib/analytics";
import { resolveAnalyticsRange } from "@/lib/analytics-range";
import { getServerSession } from "@/lib/session";

type DashboardPageProps = {
  searchParams: Promise<{
    from?: string;
    preset?: string;
    to?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/reports");
  }

  const range = resolveAnalyticsRange(await searchParams);
  const snapshot = await getAnalyticsSnapshot(session, range);

  return <DashboardSurface snapshot={snapshot} />;
}
