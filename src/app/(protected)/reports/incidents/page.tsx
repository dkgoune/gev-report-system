import { IncidentsManager } from "@/components/incident-management/incidents-manager";
import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import { getIncidentOverviewPageData } from "@/lib/incident-management";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export default async function ReportIncidentsPage() {
  const session = await getServerSession();

  if (!session) redirect("/auth/login");

  if (
    !hasPermission(session, "incident_binding_manage", "incident_template_read")
  ) {
    redirect("/");
  }

  const overview = await getIncidentOverviewPageData(session.activeAgencyId);

  return (
    <div className="space-y-6">
      <IncidentSectionNav />
      <IncidentsManager {...overview} />
    </div>
  );
}
