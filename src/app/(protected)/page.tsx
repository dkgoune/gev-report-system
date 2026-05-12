import { redirect } from "next/navigation";
import { DashboardSurface } from "@/components/analytics/analytics-surfaces";
import { getAnalyticsSnapshot } from "@/lib/analytics";
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

  if (session.role !== "admin") {
    redirect("/reports");
  }

  const range = resolveAnalyticsRange(await searchParams);
  const snapshot = await getAnalyticsSnapshot(session, range);

  return <DashboardSurface snapshot={snapshot} />;
}
