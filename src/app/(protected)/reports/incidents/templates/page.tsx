import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import { IncidentTemplatesManager } from "@/components/incident-management/incident-templates-manager";
import {
  getIncidentTemplatesPageData,
  requireIncidentAdminSession,
} from "@/lib/incident-management";

export default async function IncidentTemplatesPage() {
  const session = await requireIncidentAdminSession();
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
