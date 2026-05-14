import { redirect } from "next/navigation";
import { EvaluationsAnalyticsSurface } from "../../../../components/analytics/evaluations-analytics-surface";
import { resolveAnalyticsRange } from "@/lib/analytics-range";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { getEvaluationsAnalyticsSnapshot } from "@/lib/evaluations-analytics";
import { getServerSession } from "@/lib/session";

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

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  const range = resolveAnalyticsRange(await searchParams);
  const snapshot = await getEvaluationsAnalyticsSnapshot(session, range);

  return <EvaluationsAnalyticsSurface snapshot={snapshot} />;
}
