"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  canCancel: boolean;
  filters: {
    criteriaId: string;
    endDate: string;
    page: number;
    pageSize: number;
    search: string;
    startDate: string;
  };
  totalItems: number;
  totalPages: number;
};

export function EvaluationsList({
  criteriaOptions,
  evaluations,
  canCancel,
  filters,
  totalItems,
  totalPages,
}: EvaluationsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelComment, setCancelComment] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const router = useRouter();

  const startRow =
    totalItems === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const endRow = Math.min(filters.page * filters.pageSize, totalItems);

  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancellingId) return;

    setSubmittingCancel(true);
    try {
      const response = await fetch(`/api/evaluations/${cancellingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCancelled: true, comment: cancelComment }),
      });

      if (!response.ok) {
        toast.error("Impossible d'annuler l'évaluation.");
        return;
      }

      toast.success("Évaluation annulée avec succès.");
      setCancellingId(null);
      router.refresh();
    } catch (err) {
      toast.error("Une erreur est survenue.");
    } finally {
      setSubmittingCancel(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Liste des évaluations
          </h2>
          <p className="text-sm text-slate-600">
            Recherchez et filtrez les observations du personnel par critère et
            par date.
          </p>
        </div>

        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/evaluations/new">Ajouter une évaluation</Link>
        </Button>
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4">
        <AutoFilterForm className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Rechercher par personnel, critère, note..."
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
                  {criterion.name} ({impactLabel(criterion.impact as any)})
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

          <div className="flex flex-wrap gap-2 lg:col-span-5 justify-end">
            <Button asChild variant="outline">
              <Link href="/evaluations">Réinitialiser les filtres</Link>
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
          ? "Aucune évaluation ne correspond aux filtres actuels."
          : `Affichage de ${startRow} à ${endRow} sur ${totalItems} évaluations.`}
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white">
        <Table className="min-w-full divide-y divide-slate-200 text-sm text-left">
          <TableHeader className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs">
            <TableRow>
              <TableHead className="px-6 py-4">Personnel</TableHead>
              <TableHead className="px-6 py-4 max-w-48">
                Critère d'évaluation
              </TableHead>
              <TableHead className="px-6 py-4">Observateur</TableHead>
              <TableHead className="px-6 py-4">Date</TableHead>
              <TableHead className="px-6 py-4">Date de saisie</TableHead>
              <TableHead className="px-6 py-4">Notes</TableHead>
              <TableHead className="px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {evaluations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-6 py-10 text-center text-slate-500 italic"
                >
                  Aucune évaluation trouvée.
                </TableCell>
              </TableRow>
            ) : null}

            {evaluations.map(evaluation => {
              const isPositive = evaluation.criterion.impact === "POSITIVE";
              const impactClasses = isPositive
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200";

              return (
                <TableRow
                  key={evaluation.id}
                  className={`align-middle hover:bg-slate-50/50 transition-colors ${
                    evaluation.isCancelled ? "bg-rose-50/20 text-slate-400" : ""
                  }`}
                >
                  <TableCell className={`px-6 py-4 font-semibold ${evaluation.isCancelled ? "text-slate-400 line-through" : "text-slate-900"}`}>
                    {evaluation.evaluatedUser ? evaluation.evaluatedUser.fullName : "Général / Aucun personnel"}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className={`font-semibold max-w-56 wrap-break-word whitespace-normal ${evaluation.isCancelled ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {evaluation.criterion.name}
                    </p>
                    {!evaluation.isCancelled && (
                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border mt-1 ${impactClasses}`}
                      >
                        {impactLabel(evaluation.criterion.impact as any)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-700">
                    <p className={`font-medium ${evaluation.isCancelled ? "text-slate-400" : "text-slate-900"}`}>
                      {evaluation.evaluatingLeader.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      @{evaluation.evaluatingLeader.username}
                    </p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-500 text-xs">
                    {formatDateTime(evaluation.evaluationDate)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-500 text-xs">
                    {formatDateTime(evaluation.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-700">
                    <div className={`max-w-md whitespace-normal text-sm leading-relaxed p-2 border rounded ${evaluation.isCancelled ? "bg-slate-100/50 text-slate-400 border-slate-200" : "bg-slate-50/50 text-slate-600 border-slate-100"}`}>
                      {evaluation.comment || (
                        <span className="text-slate-400 italic">
                          Aucune note fournie
                        </span>
                      )}
                    </div>
                    {evaluation.isCancelled && evaluation.cancelledAt && (
                      <p className="text-[10px] text-rose-500 mt-1 font-medium italic">
                        Annulée le {formatDateTime(evaluation.cancelledAt)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-700">
                    {evaluation.isCancelled ? (
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border border-rose-200 bg-rose-50/50 text-rose-800">
                        Annulée
                      </span>
                    ) : canCancel ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 h-8"
                        onClick={() => {
                          setCancellingId(evaluation.id);
                          setCancelComment(evaluation.comment || "");
                        }}
                      >
                        Annuler
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
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

      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 animate-in fade-in-50 duration-200">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-lg rounded-lg">
            <h3 className="text-lg font-bold text-slate-900">
              Annuler l'évaluation
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Cette action annulera l'évaluation et exclura son score du total de l'agent.
              Vous pouvez également modifier les notes de l'observation pour y ajouter le motif de l'annulation.
            </p>
            <form onSubmit={handleCancelSubmit} className="mt-4 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700 block">Notes / Motif d'annulation</span>
                <textarea
                  value={cancelComment}
                  onChange={e => setCancelComment(e.target.value)}
                  className="w-full border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 rounded min-h-24"
                  placeholder="Ex: Erreur de saisie rectifiée, motif..."
                  required
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancellingId(null)}
                  disabled={submittingCancel}
                >
                  Fermer
                </Button>
                <Button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={submittingCancel}
                >
                  {submittingCancel ? "Annulation..." : "Confirmer l'annulation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} à ${hours}:${minutes}`;
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

  params.set("pageSize", String(filters.pageSize));
  params.set("page", String(page));

  const query = params.toString();

  return query ? `/evaluations?${query}` : "/evaluations";
}
