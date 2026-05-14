import { IncidentTemplatesList } from "./incident-templates-list";
import type { IncidentTemplateItem } from "./types";

type IncidentTemplatesManagerProps = {
  initialTemplates: IncidentTemplateItem[];
};

export function IncidentTemplatesManager({
  initialTemplates,
}: IncidentTemplatesManagerProps) {
  return <IncidentTemplatesList templates={initialTemplates} />;
}
