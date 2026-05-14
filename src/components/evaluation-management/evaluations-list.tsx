import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { impactLabel } from "@/components/criteria-management/constants";
import { AutoFilterForm } from "../ui/auto-filter-form";
import type { EvaluationCriterionOption, EvaluationItem } from "./types";

type EvaluationsListProps = {
  criteriaOptions: EvaluationCriterionOption[];
  evaluations: EvaluationItem[];
  filters: {
    criteriaId: string;
    endDate: string;
    page: number;
    pageSize: number;
    search: string;
    startDate: string;
    workScheduleId: string;
  };
  totalItems: number;
  totalPages: number;
};

export function EvaluationsList({
  criteriaOptions,
  evaluations,
  filters,
  totalItems,
  totalPages,
}: EvaluationsListProps) {
  const startRow =
    totalItems === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const endRow = Math.min(filters.page * filters.pageSize, totalItems);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Liste des évaluations
          </h2>
          <p className="text-sm text-slate-600">
            Recherchez, filtrez et paginez les évaluations directement depuis la
            base de données.
          </p>
        </div>

        <Button asChild>
          <Link href="/evaluations/new">Ajouter une évaluation</Link>
        </Button>
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4">
        <AutoFilterForm className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 items-end">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Rechercher par personnel, critère, note ou auteur"
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Critère</span>
            <select
              name="criteriaId"
              defaultValue={filters.criteriaId}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les critères</option>
              {criteriaOptions.map(criterion => (
                <option key={criterion.id} value={criterion.id}>
                  {criterion.name} ({impactLabel(criterion.impact)})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Planning</span>
            <input
              name="workScheduleId"
              defaultValue={filters.workScheduleId}
              placeholder="ID planning"
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            />
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
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 ">
            <Button asChild variant="outline">
              <Link href="/evaluations">Réinitialiser</Link>
            </Button>
          </div>
        </AutoFilterForm>
      </div>

      <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {totalItems === 0
          ? "Aucune évaluation ne correspond aux filtres actuels."
          : `Affichage de ${startRow} à ${endRow} sur ${totalItems} évaluations.`}
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white">
        <Table className="min-w-full divide-y divide-slate-200 text-sm">
          <TableHeader className="bg-slate-50 text-left text-slate-700">
            <TableRow>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Planning
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Personnel
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Critère
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Score
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Saisi par
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {evaluations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-600"
                >
                  Aucune évaluation trouvée.
                </TableCell>
              </TableRow>
            ) : null}

            {evaluations.map(evaluation => {
              const impactClasses =
                evaluation.criterion.impact === "POSITIVE"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700";

              return (
                <TableRow key={evaluation.id} className="align-top">
                  <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatDate(evaluation.workSchedule.workDate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {evaluation.workSchedule.service.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    <p className="font-medium text-slate-900">
                      {evaluation.evaluatedUser.fullName}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    <p className="font-medium text-slate-900">
                      {evaluation.criterion.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {impactLabel(evaluation.criterion.impact)}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${impactClasses}`}
                    >
                      {evaluation.score}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    <p className="font-medium text-slate-900">
                      {evaluation.evaluatingLeader.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{evaluation.evaluatingLeader.username}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-700">
                    <div className="max-w-md whitespace-normal text-sm text-slate-700">
                      {evaluation.comment}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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

  const monthNames = [
    "janv.",
    "fevr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "aout",
    "sept.",
    "oct.",
    "nov.",
    "dec.",
  ];

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

function buildPageHref(filters: EvaluationsListProps["filters"], page: number) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.criteriaId) {
    params.set("criteriaId", filters.criteriaId);
  }

  if (filters.startDate) {
    params.set("from", filters.startDate);
  }

  if (filters.endDate) {
    params.set("to", filters.endDate);
  }

  if (filters.workScheduleId) {
    params.set("workScheduleId", filters.workScheduleId);
  }

  params.set("pageSize", String(filters.pageSize));
  params.set("page", String(page));

  const query = params.toString();

  return query ? `/evaluations?${query}` : "/evaluations";
}
