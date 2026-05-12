"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type CellContext,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type HeaderContext,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { impactLabel, impactOptions } from "./constants";
import type { CriterionItem } from "./types";

type CriteriaListProps = {
  criteria: CriterionItem[];
  loading: boolean;
  search: string;
  updatingId: string | null;
  onSearchChange: (value: string) => void;
  onToggleActive: (criterion: CriterionItem) => Promise<void>;
};

export function CriteriaList({
  criteria,
  loading,
  search,
  updatingId,
  onSearchChange,
  onToggleActive,
}: CriteriaListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<CriterionItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }: HeaderContext<CriterionItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Critère
            <ArrowUpDown className="size-4" />
          </button>
        ),
        cell: ({ row }: CellContext<CriterionItem, unknown>) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="text-xs text-slate-500">
              Créé le {formatDate(row.original.createdAt)}
            </p>
          </div>
        ),
      },
      {
        id: "impact",
        accessorFn: (criterion: CriterionItem) => impactLabel(criterion.impact),
        header: ({ column }: HeaderContext<CriterionItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Impact
            <ArrowUpDown className="size-4" />
          </button>
        ),
        filterFn: "equalsString",
        cell: ({ row }: CellContext<CriterionItem, unknown>) => {
          const label = impactLabel(row.original.impact);
          const classes =
            row.original.impact === "POSITIVE"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700";

          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        accessorKey: "defaultWeight",
        header: ({ column }: HeaderContext<CriterionItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Poids
            <ArrowUpDown className="size-4" />
          </button>
        ),
        cell: ({ row }: CellContext<CriterionItem, unknown>) =>
          row.original.defaultWeight,
      },
      {
        id: "maxDaily",
        accessorFn: (criterion: CriterionItem) =>
          criterion.maxDaily === null ? "Illimité" : String(criterion.maxDaily),
        header: ({ column }: HeaderContext<CriterionItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Max / jour
            <ArrowUpDown className="size-4" />
          </button>
        ),
        cell: ({ row }: CellContext<CriterionItem, unknown>) =>
          row.original.maxDaily === null ? "Illimité" : row.original.maxDaily,
      },
      {
        id: "status",
        accessorFn: (criterion: CriterionItem) =>
          criterion.isActive ? "Actif" : "Inactif",
        header: ({ column }: HeaderContext<CriterionItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Statut
            <ArrowUpDown className="size-4" />
          </button>
        ),
        filterFn: "equalsString",
        cell: ({ row }: CellContext<CriterionItem, unknown>) => {
          const label = row.original.isActive ? "Actif" : "Inactif";
          const classes = row.original.isActive
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-700";

          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }: CellContext<CriterionItem, unknown>) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ouvrir le menu d'actions"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onSelect={() =>
                    router.push(`/criteria/${row.original.id}/edit`)
                  }
                >
                  <Pencil />
                  Modifier le critère
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void onToggleActive(row.original)}
                  disabled={updatingId === row.original.id}
                >
                  <Power />
                  {updatingId === row.original.id
                    ? "Mise à jour..."
                    : row.original.isActive
                      ? "Désactiver"
                      : "Activer"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onToggleActive, router, updatingId]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: criteria,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 8,
      },
    },
  });

  const pagination = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow =
    totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalRows
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            Table des critères
          </h3>
          <p className="text-sm text-slate-600">
            Filtrez et pilotez les critères utilisés par les évaluations
            mensuelles.
          </p>
        </div>

        <Button asChild className="md:hidden">
          <Link href="/criteria/new">
            <Plus />
            Ajouter un critère
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              placeholder="Rechercher par nom, impact, poids ou limite"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Impact</span>
            <Select
              value={
                (table.getColumn("impact")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={value =>
                table
                  .getColumn("impact")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full rounded-md bg-white text-sm">
                <SelectValue placeholder="Tous les impacts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les impacts</SelectItem>
                {impactOptions.map(option => (
                  <SelectItem key={option.value} value={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Statut</span>
            <Select
              value={
                (table.getColumn("status")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={value =>
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full rounded-md bg-white text-sm">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Actif">Actifs</SelectItem>
                <SelectItem value="Inactif">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-600">Chargement...</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Table className="min-w-full divide-y divide-slate-200 text-sm">
          <TableHeader className="bg-slate-50 text-left text-slate-700">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 font-medium whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="px-4 py-8 text-center text-sm text-slate-600"
                >
                  Aucun critère trouvé.
                </TableCell>
              </TableRow>
            ) : null}

            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} className="align-top">
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    className="px-4 py-3 text-slate-700 whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Affichage de {startRow} à {endRow} sur {totalRows} critères.
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={value => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-full rounded-md text-sm md:w-40">
                <SelectValue placeholder="Taille de page" />
              </SelectTrigger>
              <SelectContent align="end">
                {[5, 8, 10, 20].map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size} par page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Précédent
              </Button>
              <span className="text-sm text-slate-600">
                Page {pagination.pageIndex + 1} sur{" "}
                {Math.max(table.getPageCount(), 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Suivant
              </Button>
            </div>
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
