import { redirect } from "next/navigation";
import { AnalyticsSurface } from "@/components/analytics/analytics-surfaces";
import { getAnalyticsSnapshot } from "../../../lib/analytics";
import { resolveAnalyticsRange } from "@/lib/analytics-range";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type AnalyticsPageProps = {
  searchParams: Promise<{
    from?: string;
    preset?: string;
    to?: string;
  }>;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "dashboard_analytics_view")) {
    redirect("/");
  }

  const range = resolveAnalyticsRange(await searchParams);
  const snapshot = await getAnalyticsSnapshot(session, range);

  return <AnalyticsSurface snapshot={snapshot} />;
}
