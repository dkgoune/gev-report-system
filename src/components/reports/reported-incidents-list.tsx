"use client";

import Link from "next/link";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";
import { AutoFilterForm } from "../ui/auto-filter-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReportedIncident = {
  id: string;
  generalReportId: string;
  templateName: string;
  templateCode: string;
  valuesJson: unknown;
  schemaSnapshotJson: unknown;
  createdAt: string;
  workDate: string;
  serviceName: string;
  reportedBy: {
    fullName: string;
    username: string;
  };
};

type ReportedIncidentsListProps = {
  agencyName: string;
  incidents: ReportedIncident[];
  templates: Array<{ id: string; name: string; code: string }>;
  filters: {
    templateId: string;
    startDate: string;
    endDate: string;
    page: number;
    pageSize: number;
  };
  totalItems: number;
  totalPages: number;
};

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, char => char.toUpperCase());
}

function extractSchemaItems(schemaSnapshotJson: unknown) {
  if (!Array.isArray(schemaSnapshotJson)) return [];
  const items: Array<{ key: string; label: string }> = [];
  for (const raw of schemaSnapshotJson) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const key = typeof raw.key === "string" ? raw.key.trim() : "";
    const label = typeof raw.label === "string" ? raw.label.trim() : "";
    if (!key) continue;
    items.push({ key, label: label || humanizeKey(key) });
  }
  return items;
}

function formatIncidentValue(value: unknown): string {
  if (value === null || value === undefined) return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") return String(value);
  if (typeof value === "string")
    return value.trim().length > 0 ? value.trim() : "Non renseigné";
  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map(formatIncidentValue).join(", ")
      : "Non renseigné";
  }
  return String(value);
}

function buildDisplayFields(entry: {
  valuesJson: unknown;
  schemaSnapshotJson: unknown;
}) {
  const values =
    entry.valuesJson &&
    typeof entry.valuesJson === "object" &&
    !Array.isArray(entry.valuesJson)
      ? (entry.valuesJson as Record<string, unknown>)
      : {};
  const schemaItems = extractSchemaItems(entry.schemaSnapshotJson);
  const schemaByKey = new Map(schemaItems.map(item => [item.key, item.label]));
  const orderedKeys = [
    ...schemaItems.map(item => item.key),
    ...Object.keys(values).filter(key => !schemaByKey.has(key)),
  ];
  return orderedKeys.map(key => ({
    key,
    label: schemaByKey.get(key) ?? humanizeKey(key),
    value: formatIncidentValue(values[key]),
  }));
}

export function ReportedIncidentsList({
  agencyName,
  incidents,
  templates,
  filters,
  totalItems,
  totalPages,
}: ReportedIncidentsListProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const startRow =
    totalItems === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const endRow = Math.min(filters.page * filters.pageSize, totalItems);

  const onPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `incidents-${agencyName}-${filters.startDate || "debut"}-${filters.endDate || "fin"}`,
  });

  return (
    <section className="space-y-4">
      {/* Printable Area (Hidden on screen) */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-slate-900 space-y-6">
          <header className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-extrabold uppercase tracking-wider text-slate-800">
              Rapport des Incidents Signalés
            </h1>
            <p className="text-sm text-slate-600 mt-1">Agence: {agencyName}</p>
            <div className="text-xs text-slate-500 mt-2">
              Période: {filters.startDate || "Début"} au{" "}
              {filters.endDate || "Fin"}
            </div>
          </header>
          <table className="w-full border-collapse border border-slate-300 text-xs text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-800">
                <th className="border-r border-slate-300 p-2">Date service</th>
                <th className="border-r border-slate-300 p-2">Service</th>
                <th className="border-r border-slate-300 p-2">Incident</th>
                <th className="border-r border-slate-300 p-2">Déclarant</th>
                <th className="p-2">Détails</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center italic text-slate-400"
                  >
                    Aucun incident trouvé.
                  </td>
                </tr>
              ) : (
                incidents.map(inc => {
                  const fields = buildDisplayFields(inc);
                  return (
                    <tr key={inc.id} className="border-b border-slate-200">
                      <td className="border-r border-slate-200 p-2">
                        {new Date(inc.workDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        {inc.serviceName}
                      </td>
                      <td className="border-r border-slate-200 p-2 font-semibold">
                        {inc.templateName}
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        {inc.reportedBy.fullName}
                      </td>
                      <td className="p-2 font-mono text-[10px]">
                        {fields.map(f => (
                          <div key={f.key}>
                            <strong>{f.label}:</strong> {f.value}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Incidents signalés dans les rapports
          </h2>
          <p className="text-sm text-slate-600">
            Consultez, filtrez et imprimez la liste des incidents saisis par les
            agents dans leurs rapports journaliers.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void onPrint()}
          >
            <Printer className="mr-2 size-4" />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4">
        <AutoFilterForm className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Type d'incident</span>
            <select
              name="templateId"
              defaultValue={filters.templateId}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les types</option>
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.code})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Du</span>
            <input
              type="date"
              name="from"
              defaultValue={filters.startDate}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Au</span>
            <input
              type="date"
              name="to"
              defaultValue={filters.endDate}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Par page</span>
            <select
              name="pageSize"
              defaultValue={String(filters.pageSize)}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>
                  {size} par page
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 lg:col-span-4 justify-end">
            <Button asChild variant="outline">
              <Link href="/reports/reported-incidents">
                Réinitialiser les filtres
              </Link>
            </Button>
            <Button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white"
            >
              Filtrer
            </Button>
          </div>
        </AutoFilterForm>
      </div>

      <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {totalItems === 0
          ? "Aucun incident ne correspond aux filtres actuels."
          : `Affichage de ${startRow} à ${endRow} sur ${totalItems} incidents signalés.`}
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white">
        <Table className="min-w-full divide-y divide-slate-200 text-sm text-left">
          <TableHeader className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs">
            <TableRow>
              <TableHead className="px-6 py-4">Date</TableHead>
              <TableHead className="px-6 py-4">Service</TableHead>
              <TableHead className="px-6 py-4">Type d'incident</TableHead>
              <TableHead className="px-6 py-4">Déclarant</TableHead>
              <TableHead className="px-6 py-4 max-w-lg">Détails</TableHead>
              <TableHead className="px-6 py-4 text-right">Rapport</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {incidents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-6 py-10 text-center text-slate-500 italic"
                >
                  Aucun incident trouvé.
                </TableCell>
              </TableRow>
            ) : (
              incidents.map(inc => {
                const fields = buildDisplayFields(inc);
                return (
                  <TableRow
                    key={inc.id}
                    className="align-top hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap text-slate-950 font-medium">
                      {new Date(inc.workDate).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {inc.serviceName}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                      {inc.templateName}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-slate-700">
                      <p className="font-semibold text-slate-800">
                        {inc.reportedBy.fullName}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1.5 max-w-lg">
                        {fields.map(f => (
                          <div key={f.key} className="text-xs">
                            <span className="font-semibold text-slate-900 mr-1.5">
                              {f.label}:
                            </span>
                            <span className="text-slate-600 whitespace-pre-wrap">
                              {f.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right whitespace-nowrap">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/reports/${inc.generalReportId}`}>
                          <Eye className="mr-1.5 size-3.5" />
                          Voir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between bg-slate-50/50">
          <p className="text-sm text-slate-600">
            Page {filters.page} sur {totalPages}
          </p>

          <div className="flex items-center gap-2">
            {filters.page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Précédent
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={buildPageHref(filters, filters.page - 1)}>
                  Précédent
                </Link>
              </Button>
            )}

            {filters.page >= totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Suivant
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={buildPageHref(filters, filters.page + 1)}>
                  Suivant
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildPageHref(
  filters: ReportedIncidentsListProps["filters"],
  page: number
) {
  const params = new URLSearchParams();
  if (filters.templateId) params.set("templateId", filters.templateId);
  if (filters.startDate) params.set("from", filters.startDate);
  if (filters.endDate) params.set("to", filters.endDate);
  params.set("pageSize", String(filters.pageSize));
  params.set("page", String(page));
  return `/reports/reported-incidents?${params.toString()}`;
}
