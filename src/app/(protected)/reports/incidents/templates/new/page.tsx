import { IncidentTemplateEditor } from "@/components/incident-management/incident-template-editor";
import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import { getIncidentTemplatesPageData } from "@/lib/incident-management";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

export default async function NewIncidentTemplatePage() {
  const session = await getServerSession();

  if (!session) redirect("/auth/login");

  if (!hasPermission(session, "incident_binding_manage")) {
    redirect("/");
  }

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
