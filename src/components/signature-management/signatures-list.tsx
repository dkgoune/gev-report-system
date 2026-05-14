import Link from "next/link";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/components/user-management/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  SignatureAgentOption,
  SignatureLogItem,
  SignatureScheduleOption,
} from "./types";
import { AutoFilterForm } from "../ui/auto-filter-form";

type SignaturesListProps = {
  schedules: SignatureScheduleOption[];
  signers: SignatureAgentOption[];
  filters: {
    endDate: string;
    page: number;
    pageSize: number;
    search: string;
    startDate: string;
    userId: string;
    workScheduleId: string;
  };
  signatures: SignatureLogItem[];
  summary: {
    activeSigners: number;
    monthCount: number;
    todayCount: number;
    totalItems: number;
  };
  totalItems: number;
  totalPages: number;
};

export function SignaturesList({
  schedules,
  signers,
  filters,
  signatures,
  summary,
  totalItems,
  totalPages,
}: SignaturesListProps) {
  const startRow =
    totalItems === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const endRow = Math.min(filters.page * filters.pageSize, totalItems);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Signatures de bordereaux
          </h2>
          <p className="text-sm text-slate-600">
            Suivez les signatures enregistrées, recherchez un bordereau et
            corrigez les entrées si nécessaire.
          </p>
        </div>

        <Button asChild>
          <Link href="/signatures/new">Ajouter une signature</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total filtré" value={String(summary.totalItems)} />
        <SummaryCard label="Aujourd'hui" value={String(summary.todayCount)} />
        <SummaryCard label="Ce mois-ci" value={String(summary.monthCount)} />
        <SummaryCard
          label="Signataires actifs"
          value={String(summary.activeSigners)}
        />
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4">
        <AutoFilterForm className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 items-end">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Rechercher par bordereau ou signataire"
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Signataire</span>
            <select
              name="userId"
              defaultValue={filters.userId}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les signataires</option>
              {signers.map(signer => (
                <option key={signer.id} value={signer.id}>
                  {signer.fullName} ({roleLabel(signer.role)})
                </option>
              ))}
            </select>
          </label>

          {schedules.length > 0 ? (
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Planning</span>
              <select
                name="workScheduleId"
                defaultValue={filters.workScheduleId}
                className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tous les plannings</option>
                {schedules.map(schedule => (
                  <option key={schedule.id} value={schedule.id}>
                    {new Date(schedule.workDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    - {schedule.serviceName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

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
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 ">
            <Button asChild variant="outline">
              <Link href="/signatures">Réinitialiser</Link>
            </Button>
          </div>
        </AutoFilterForm>
      </div>

      <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {totalItems === 0
          ? "Aucune signature ne correspond aux filtres actuels."
          : `Affichage de ${startRow} à ${endRow} sur ${totalItems} signatures.`}
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white">
        <Table className="min-w-full divide-y divide-slate-200 text-sm">
          <TableHeader className="bg-slate-50 text-left text-slate-700">
            <TableRow>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Planning
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Date et heure
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Bordereau
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Signataire
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Arrivée bus
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Saisi le
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {signatures.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-600"
                >
                  Aucune signature trouvée.
                </TableCell>
              </TableRow>
            ) : null}

            {signatures.map(signature => (
              <TableRow key={signature.id} className="align-top">
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-slate-900">
                      {formatDate(signature.workSchedule.workDate)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {signature.workSchedule.serviceName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {signature.signedAt
                    ? formatDateTime(signature.signedAt)
                    : "Non renseignée"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <span className="font-medium text-slate-900">
                    {signature.slipNumber}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-slate-900">
                      {signature.user.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {roleLabel(signature.user.role)} - @
                      {signature.user.username}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {signature.busArrivalTime
                    ? formatDateTime(signature.busArrivalTime)
                    : "Non renseignée"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {formatDateTime(signature.createdAt)}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <Link
                    href={`/signatures/${signature.id}`}
                    className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
                  >
                    Modifier
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-slate-200 bg-slate-50 p-4 py-3 flex gap-2 items-center justify-between">
      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </article>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildPageHref(filters: SignaturesListProps["filters"], page: number) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.workScheduleId) {
    params.set("workScheduleId", filters.workScheduleId);
  }

  if (filters.userId) {
    params.set("userId", filters.userId);
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

  return query ? `/signatures?${query}` : "/signatures";
}
