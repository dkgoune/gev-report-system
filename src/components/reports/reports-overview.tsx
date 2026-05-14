import Link from "next/link";
import { roleLabel } from "@/components/user-management/constants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AutoFilterForm } from "../ui/auto-filter-form";

type ServiceOption = {
  id: string;
  name: string;
};

export type ReportListFilters = {
  endDate: string;
  isRead: string;
  page: number;
  pageSize: number;
  search: string;
  serviceId: string;
  sortDirection: "asc" | "desc";
  sortField: "createdAt" | "isRead" | "reportDate" | "reportedBy";
  startDate: string;
};

export type ReportRecord = {
  id: string;
  reportDate: string;
  isRead: boolean;
  createdAt: string;
  serviceId: string | null;
  serviceName: string | null;
  reportedBy: {
    fullName: string;
    username: string;
    role: "admin" | "scheduler" | "reporter" | "worker";
  };
  problemesRencontres: string | null;
  observationGeneral: string | null;
  ambianceGenerale: string | null;
};

type ReportsOverviewProps = {
  canViewList: boolean;
  filters?: ReportListFilters;
  services?: ServiceOption[];
  reports?: ReportRecord[];
  totalItems?: number;
  totalPages?: number;
};

const pageSizes = [10, 20, 50] as const;

export function ReportsOverview({
  canViewList,
  filters,
  services = [],
  reports = [],
  totalItems = 0,
  totalPages = 1,
}: ReportsOverviewProps) {
  if (!canViewList || !filters) {
    return (
      <div className="space-y-8">
        <section className="grid gap-6 border border-slate-200 bg-[linear-gradient(135deg,#f0fdfa_0%,#ffffff_42%,#fff7ed_100%)] p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,22rem)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.18em] text-teal-700 uppercase">
                Rapports
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                Nouveau rapport général
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Vous pouvez créer le rapport du jour, mais l'historique détaillé
                des rapports est réservé aux profils responsables.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/reports/new">Créer le rapport du jour</Link>
              </Button>
            </div>
          </div>

          <div className="border border-slate-200 bg-white/90 p-4 text-sm shadow-sm">
            <p className="font-semibold text-slate-900">Accès à l'historique</p>
            <p className="mt-2 text-slate-600">
              Les travailleurs peuvent créer les rapports autorisés, mais ne
              voient pas la liste complète de l'historique.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const startRow =
    totalItems === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const endRow = Math.min(filters.page * filters.pageSize, totalItems);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Rapports généraux
          </h2>
          <p className="text-sm text-slate-600">
            Recherchez, filtrez, triez et parcourez les rapports enregistrés.
          </p>
        </div>

        <Button asChild>
          <Link href="/reports/new">Créer un rapport</Link>
        </Button>
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4">
        <AutoFilterForm className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 items-end">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Rechercher par contenu ou auteur"
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Service</span>
            <select
              name="serviceId"
              defaultValue={filters.serviceId}
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les services</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Tri</span>
            <select
              name="sortField"
              defaultValue={filters.sortField}
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="reportDate">Date du rapport</option>
              <option value="createdAt">Date de saisie</option>
              <option value="reportedBy">Auteur</option>
              <option value="isRead">Lecture</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Ordre</span>
            <select
              name="sortDirection"
              defaultValue={filters.sortDirection}
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Par page</span>
            <select
              name="pageSize"
              defaultValue={String(filters.pageSize)}
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {pageSizes.map(size => (
                <option key={size} value={size}>
                  {size}
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
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Au</span>
            <input
              type="date"
              name="to"
              defaultValue={filters.endDate}
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Lecture</span>
            <select
              name="isRead"
              defaultValue={filters.isRead}
              className="w-full  border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="true">Lus</option>
              <option value="false">Non lus</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/reports">Réinitialiser</Link>
            </Button>
          </div>
        </AutoFilterForm>
      </div>

      <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {totalItems === 0
          ? "Aucun rapport ne correspond aux filtres actuels."
          : `Affichage de ${startRow} à ${endRow} sur ${totalItems} rapports.`}
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white">
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

            {reports.map(report => (
              <TableRow key={report.id} className="align-top">
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {formatDate(report.reportDate)}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {report.serviceName ?? "Non précisé"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-slate-900">
                      {report.reportedBy.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {roleLabel(report.reportedBy.role)} - @
                      {report.reportedBy.username}
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
                    {buildSummary(report)}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/reports/${report.id}`}>Voir</Link>
                  </Button>
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

function buildSummary(report: ReportRecord) {
  return (
    (typeof report.problemesRencontres === "string" &&
      report.problemesRencontres.trim()) ||
    (typeof report.observationGeneral === "string" &&
      report.observationGeneral.trim()) ||
    (typeof report.ambianceGenerale === "string" &&
      report.ambianceGenerale.trim()) ||
    "Aucun résumé disponible."
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

function buildPageHref(filters: ReportListFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.serviceId) {
    params.set("serviceId", filters.serviceId);
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

  params.set("sortField", filters.sortField);
  params.set("sortDirection", filters.sortDirection);
  params.set("pageSize", String(filters.pageSize));
  params.set("page", String(page));

  const query = params.toString();

  return query ? `/reports?${query}` : "/reports";
}
