import { IncidentTemplateEditor } from "@/components/incident-management/incident-template-editor";
import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import {
  getIncidentTemplatesPageData,
  requireIncidentAdminSession,
} from "@/lib/incident-management";

export default async function NewIncidentTemplatePage() {
  const session = await requireIncidentAdminSession();
  const { templates } = await getIncidentTemplatesPageData(
    session.activeAgencyId
  );

  return (
    <div className="space-y-6">
      <IncidentSectionNav />
      <IncidentTemplateEditor mode="create" templates={templates} />
    </div>
  );
}
