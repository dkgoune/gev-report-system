import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import { IncidentBindingsManager } from "@/components/incident-management/incident-bindings-manager";
import {
  getIncidentBindingsPageData,
  requireIncidentAdminSession,
} from "@/lib/incident-management";

export default async function IncidentBindingsPage() {
  const session = await requireIncidentAdminSession();
  const { bindings, services, templateOptions } =
    await getIncidentBindingsPageData(session.activeAgencyId);

  return (
    <div className="space-y-6">
      <IncidentSectionNav />
      <IncidentBindingsManager
        initialBindings={bindings}
        initialServices={services}
        initialTemplateOptions={templateOptions}
      />
    </div>
  );
}
