import { IncidentsManager } from "@/components/incident-management/incidents-manager";
import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import {
  getIncidentOverviewPageData,
  requireIncidentAdminSession,
} from "@/lib/incident-management";

export default async function ReportIncidentsPage() {
  const session = await requireIncidentAdminSession();
  const overview = await getIncidentOverviewPageData(session.activeAgencyId);

  return (
    <div className="space-y-6">
      <IncidentSectionNav />
      <IncidentsManager {...overview} />
    </div>
  );
}
