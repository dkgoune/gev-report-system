"use client";

import Link from "next/link";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SignatureLogItem, SignatureAgentOption } from "./types";
import { AutoFilterForm } from "../ui/auto-filter-form";

type SignaturesListProps = {
  signers: SignatureAgentOption[];
  filters: {
    endDate: string;
    page: number;
    pageSize: number;
    search: string;
    startDate: string;
    userId: string;
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
  canUpdate: boolean;
};

export function SignaturesList({
  signers,
  filters,
  signatures,
  summary,
  totalItems,
  totalPages,
  canUpdate,
}: SignaturesListProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const onPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `signatures-${filters.startDate || "all"}-to-${filters.endDate || "all"}`,
  });

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
            Suivez les signatures enregistrées par les travailleurs et apportez des ajustements.
          </p>
        </div>

        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/signatures/new">Enregistrer des signatures</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total des fiches" value={String(summary.totalItems)} />
        <SummaryCard label="Signatures Aujourd'hui" value={String(summary.todayCount)} />
        <SummaryCard label="Signatures Ce mois-ci" value={String(summary.monthCount)} />
        <SummaryCard
          label="Signataires actifs"
          value={String(summary.activeSigners)}
        />
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4">
        <AutoFilterForm className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Rechercher par signataire..."
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
                  {signer.fullName}
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
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>
                  {size} par page
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 lg:col-span-5 justify-end">
            <Button asChild variant="outline">
              <Link href="/signatures">Réinitialiser les filtres</Link>
            </Button>
            <Button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white">
              Filtrer
            </Button>
          </div>
        </AutoFilterForm>
      </div>

      <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {totalItems === 0
          ? "Aucune signature ne correspond aux filtres actuels."
          : `Affichage de ${startRow} à ${endRow} sur ${totalItems} fiches de signature.`}
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-white">
          <h3 className="text-base font-semibold text-slate-900">
            Liste des signatures
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onPrint()}
            disabled={signatures.length === 0}
          >
            <Printer className="mr-1.5 size-3.5" />
            Imprimer la liste
          </Button>
        </div>
        <Table className="min-w-full divide-y divide-slate-200 text-sm">
          <TableHeader className="bg-slate-50 text-left text-slate-700 font-semibold uppercase tracking-wider text-xs">
            <TableRow>
              <TableHead className="px-6 py-4">Signataire</TableHead>
              <TableHead className="px-6 py-4 text-center">Nombre de signatures</TableHead>
              <TableHead className="px-6 py-4">Date et heure de signature</TableHead>
              <TableHead className="px-6 py-4">Date de saisie</TableHead>
              <TableHead className="px-6 py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {signatures.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-slate-600 italic"
                >
                  Aucune signature trouvée.
                </TableCell>
              </TableRow>
            ) : null}

            {signatures.map(signature => (
              <TableRow key={signature.id} className="align-middle hover:bg-slate-50/50 transition-colors">
                <TableCell className="px-6 py-4 font-semibold text-slate-900">
                  {signature.user.fullName}
                  <span className="block text-slate-400 font-mono text-[10px] mt-0.5">@{signature.user.username}</span>
                </TableCell>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex bg-teal-50 border border-teal-200 text-teal-800 text-xs px-2.5 py-1 font-semibold rounded-full">
                    {signature.signatureCount} signatures
                  </span>
                </td>
                <TableCell className="px-6 py-4 text-slate-700">
                  {formatDateTime(signature.signedAt)}
                </TableCell>
                <TableCell className="px-6 py-4 text-slate-500 text-xs">
                  {formatDateTime(signature.createdAt)}
                </TableCell>
                <TableCell className="px-6 py-4 text-right whitespace-nowrap">
                  {canUpdate ? (
                    <Link
                      href={`/signatures/${signature.id}`}
                      className="text-sm font-semibold text-teal-600 hover:text-teal-700 underline-offset-4 hover:underline"
                    >
                      Modifier
                    </Link>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
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

      {/* Hidden printable copy of the signatures list */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-slate-900 space-y-6">
          <header className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-extrabold uppercase tracking-wider text-slate-800">
              Signatures de bordereaux
            </h1>
            <div className="text-xs text-slate-600 mt-2 space-y-1">
              {(filters.startDate || filters.endDate) ? (
                <p>
                  Période: {filters.startDate ? `du ${formatDateTime(filters.startDate).split(" à ")[0]}` : ""} {filters.endDate ? `au ${formatDateTime(filters.endDate).split(" à ")[0]}` : ""}
                </p>
              ) : null}
              {filters.search ? <p>Recherche: "{filters.search}"</p> : null}
              {filters.userId && signers.find(s => s.id === filters.userId) ? (
                <p>Signataire: {signers.find(s => s.id === filters.userId)?.fullName}</p>
              ) : null}
            </div>
          </header>
          <table className="w-full border-collapse border border-slate-300 text-xs text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-800">
                <th className="border-r border-slate-300 p-2">Signataire</th>
                <th className="border-r border-slate-300 p-2 text-center">Nombre de signatures</th>
                <th className="border-r border-slate-300 p-2">Date et heure de signature</th>
                <th className="p-2">Date de saisie</th>
              </tr>
            </thead>
            <tbody>
              {signatures.map(signature => (
                <tr key={signature.id} className="border-b border-slate-200">
                  <td className="border-r border-slate-200 p-2 font-semibold">
                    {signature.user.fullName}
                    <span className="block text-slate-400 font-mono text-[9px] mt-0.5">@{signature.user.username}</span>
                  </td>
                  <td className="border-r border-slate-200 p-2 text-center">{signature.signatureCount} signatures</td>
                  <td className="border-r border-slate-200 p-2">{formatDateTime(signature.signedAt)}</td>
                  <td className="p-2">{formatDateTime(signature.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-slate-200 bg-white rounded-lg shadow-sm p-4 py-3 flex gap-2 items-center justify-between">
      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <span className="font-bold text-slate-800 text-lg">{value}</span>
    </article>
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

function buildPageHref(filters: SignaturesListProps["filters"], page: number) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
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
