import Link from "next/link";
import { Button } from "@/components/ui/button";
import { serviceLabel } from "@/lib/services";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dailyReportPageSizes } from "./constants";
import type { DailyReportItem, DailyReportListFilters } from "./types";

type DailyReportHistoryProps = {
  filters: DailyReportListFilters;
  isAdmin: boolean;
  reports: DailyReportItem[];
  totalItems: number;
  totalPages: number;
};

export function DailyReportHistory({
  filters,
  isAdmin,
  reports,
  totalItems,
  totalPages,
}: DailyReportHistoryProps) {
  const startRow =
    totalItems === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const endRow = Math.min(filters.page * filters.pageSize, totalItems);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Liste des rapports généraux
          </h2>
          <p className="text-sm text-slate-600">
            Recherchez, filtrez et paginez les rapports via l'API.
          </p>
        </div>

        <Button asChild>
          <Link href="/reports/general/new">Ajouter un rapport</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <form className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Rechercher par contenu ou auteur"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Service</span>
            {isAdmin ? (
              <select
                name="service"
                defaultValue={filters.service}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tous les services</option>
                <option value="envoi">Envoi</option>
                <option value="piste">Piste</option>
                <option value="retrait">Retrait</option>
              </select>
            ) : (
              <>
                <input type="hidden" name="service" value={filters.service} />
                <div className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                  {filters.service
                    ? serviceLabel(
                        filters.service as DailyReportItem["service"],
                      )
                    : "Mon service"}
                </div>
              </>
            )}
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Du</span>
            <input
              type="date"
              name="from"
              defaultValue={filters.startDate}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Au</span>
            <input
              type="date"
              name="to"
              defaultValue={filters.endDate}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Lecture</span>
            <select
              name="isRead"
              defaultValue={filters.isRead}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="true">Lus</option>
              <option value="false">Non lus</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Par page</span>
            <select
              name="pageSize"
              defaultValue={String(filters.pageSize)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {dailyReportPageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 lg:col-span-3 xl:col-span-6">
            <Button type="submit">Appliquer les filtres</Button>
            <Button asChild variant="outline">
              <Link href="/reports/general">Réinitialiser</Link>
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {totalItems === 0
          ? "Aucun rapport ne correspond aux filtres actuels."
          : `Affichage de ${startRow} à ${endRow} sur ${totalItems} rapports.`}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-slate-600">
          Consultez les derniers rapports généraux et ouvrez la saisie avec la
          meme date et le meme service si besoin.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Table className="min-w-full divide-y divide-slate-200 text-sm">
          <TableHeader className="bg-slate-50 text-left text-slate-700">
            <TableRow>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Date
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Service
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Saisi par
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Lecture
              </TableHead>
              <TableHead className="px-4 py-3 font-medium">Résumé</TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {reports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-600"
                >
                  Aucun rapport disponible.
                </TableCell>
              </TableRow>
            ) : null}

            {reports.map((report) => (
              <TableRow key={report.id} className="align-top">
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {formatDate(report.reportDate)}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {serviceLabel(report.service)}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-slate-900">
                      {report.reportedBy.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{report.reportedBy.username}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <span
                    className={
                      report.isRead
                        ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                        : "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
                    }
                  >
                    {report.isRead ? "Lu" : "Non lu"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700">
                  <div className="max-w-xl whitespace-normal text-sm text-slate-700">
                    {report.problemesRencontres ||
                      report.observationGeneral ||
                      report.ambianceGenerale ||
                      "Aucun résumé disponible."}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <Link
                    href={`/reports/general/${report.id}`}
                    className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
                  >
                    Lire
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function buildPageHref(filters: DailyReportListFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.service) {
    params.set("service", filters.service);
  }

  if (filters.isRead) {
    params.set("isRead", filters.isRead);
  }

  if (filters.startDate) {
    params.set("from", filters.startDate);
  }

  if (filters.endDate) {
    params.set("to", filters.endDate);
  }

  params.set("pageSize", String(filters.pageSize));
  params.set("page", String(page));

  const query = params.toString();

  return query ? `/reports/general?${query}` : "/reports/general";
}
