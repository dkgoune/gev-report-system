import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { IncidentTemplateItem } from "./types";

type IncidentTemplatesListProps = {
  templates: IncidentTemplateItem[];
};

export function IncidentTemplatesList({
  templates,
}: IncidentTemplatesListProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Modeles d'incidents
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Selectionnez un modele pour voir ses details, son historique et le
            modifier.
          </p>
        </div>
        <Button asChild type="button" size="sm">
          <Link href="/reports/incidents/templates/new">Nouveau modele</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun modele configure.</p>
        ) : (
          templates.map(template => (
            <article key={template.id} className="border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">
                {template.name}{" "}
                <span className="text-slate-500">({template.code})</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {template.description || "Sans description"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Versions: {template.versions.length} | Derniere: v
                {template.versions[0]?.version ?? 0} (
                {template.versions[0]?.status ?? "-"})
              </p>
              <div className="mt-3">
                <Button asChild type="button" variant="outline" size="sm">
                  <Link href={`/reports/incidents/templates/${template.id}`}>
                    Ouvrir
                  </Link>
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
