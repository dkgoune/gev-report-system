import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import { IncidentTemplatesManager } from "@/components/incident-management/incident-templates-manager";
import { getIncidentTemplatesPageData } from "@/lib/incident-management";
import { hasPermission } from "@/lib/permissions";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function IncidentTemplatesPage() {
  const session = await getServerSession();

  if (!session) redirect("/auth/login");

  if (
    !hasPermission(session, "incident_template_read", "incident_binding_manage")
  ) {
    redirect("/");
  }

  const { templates } = await getIncidentTemplatesPageData(
    session.activeAgencyId
  );

  return (
    <div className="space-y-6">
      <IncidentSectionNav />
      <IncidentTemplatesManager initialTemplates={templates} />
    </div>
  );
}
