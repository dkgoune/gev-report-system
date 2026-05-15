import { IncidentSectionNav } from "@/components/incident-management/incident-section-nav";
import { IncidentBindingsManager } from "@/components/incident-management/incident-bindings-manager";
import { getIncidentBindingsPageData } from "@/lib/incident-management";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function IncidentBindingsPage() {
  const session = await getServerSession();

  if (!session) redirect("/auth/login");

  if (!hasPermission(session, "incident_binding_manage")) {
    redirect("/");
  }

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
