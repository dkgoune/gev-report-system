import { redirect } from "next/navigation";
import { EvaluationsAnalyticsSurface } from "../../../components/analytics/evaluations-analytics-surface";
import { resolveAnalyticsRange } from "@/lib/analytics-range";
import { getEvaluationsAnalyticsSnapshot } from "@/lib/evaluations-analytics";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type EvaluationsAnalyticsPageProps = {
  searchParams: Promise<{
    from?: string;
    preset?: string;
    to?: string;
  }>;
};

export default async function EvaluationsAnalyticsPage({
  searchParams,
}: EvaluationsAnalyticsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "dashboard_evaluations_view")) {
    redirect("/");
  }

  const range = resolveAnalyticsRange(await searchParams);
  const snapshot = await getEvaluationsAnalyticsSnapshot(session, range);

  return <EvaluationsAnalyticsSurface snapshot={snapshot} />;
}
