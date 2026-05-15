import { notFound, redirect } from "next/navigation";
import { IncidentTemplateEditor } from "@/components/incident-management/incident-template-editor";
import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import { getIncidentTemplateDetailPageData } from "@/lib/incident-management";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function IncidentTemplateDetailPage({ params }: Params) {
  const session = await getServerSession();

  if (!session) redirect("/auth/login");

  if (!hasPermission(session, "incident_binding_manage")) {
    redirect("/");
  }

  const { id } = await params;

  const { template, templates } = await getIncidentTemplateDetailPageData(
    session.activeAgencyId,
    id
  );

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <IncidentSectionNav />
      <IncidentTemplateEditor
        mode="edit"
        templates={templates}
        template={template}
      />
    </div>
  );
}
