import { redirect } from "next/navigation";
import { AnalyticsSurface } from "@/components/analytics/analytics-surfaces";
import { getAnalyticsSnapshot } from "../../../../lib/analytics";
import { resolveAnalyticsRange } from "@/lib/analytics-range";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { getServerSession } from "@/lib/session";

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

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  const range = resolveAnalyticsRange(await searchParams);
  const snapshot = await getAnalyticsSnapshot(session, range);

  return <AnalyticsSurface snapshot={snapshot} />;
}
