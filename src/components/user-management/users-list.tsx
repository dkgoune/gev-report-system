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
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel, roleOptions } from "./constants";
import type { UserItem } from "./types";
import { serviceLabel } from "@/lib/services";

type UsersListProps = {
  users: UserItem[];
  loading: boolean;
  search: string;
  isAdmin: boolean;
  deletingId: string | null;
  onSearchChange: (value: string) => void;
  onDelete: (user: UserItem) => Promise<void>;
};

export function UsersList({
  users,
  loading,
  search,
  isAdmin,
  deletingId,
  onSearchChange,
  onDelete,
}: UsersListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fullName", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserItem | null>(
    null
  );

  const columns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: ({ column }: HeaderContext<UserItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom complet
            <ArrowUpDown className="size-4" />
          </button>
        ),
        cell: ({ row }: CellContext<UserItem, unknown>) => (
          <div>
            <p className="font-medium text-slate-900">
              {row.original.fullName}
            </p>
            <p className="text-xs text-slate-500">
              Créé le {formatDate(row.original.createdAt)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "username",
        header: ({ column }: HeaderContext<UserItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom utilisateur
            <ArrowUpDown className="size-4" />
          </button>
        ),
        cell: ({ row }: CellContext<UserItem, unknown>) => (
          <span>@{row.original.username}</span>
        ),
      },
      {
        id: "role",
        accessorFn: (user: UserItem) => roleLabel(user.role),
        header: ({ column }: HeaderContext<UserItem, unknown>) => (
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rôle
            <ArrowUpDown className="size-4" />
          </button>
        ),
        filterFn: "equalsString",
      },
      {
        id: "group",
        accessorFn: (user: UserItem) => user.group?.name || "Aucun groupe",
        header: "Groupe",
        cell: ({ row }: CellContext<UserItem, unknown>) => {
          if (!row.original.group) {
            return <span className="text-slate-500">Aucun groupe</span>;
          }

          return (
            <div>
              <p className="font-medium text-slate-900">
                {row.original.group.name}
              </p>
              <p className="text-xs text-slate-500">
                {serviceLabel(row.original.group.service)}
              </p>
            </div>
          );
        },
      },
      {
        id: "phone",
        accessorFn: (user: UserItem) => user.phone || "Non renseigné",
        header: "Téléphone",
      },
      {
        id: "status",
        accessorFn: (user: UserItem) => (user.isActive ? "Actif" : "Inactif"),
        header: ({ column }: HeaderContext<UserItem, unknown>) => (
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
        cell: ({ getValue }: CellContext<UserItem, unknown>) => {
          const value = getValue() as string;

          return (
            <span
              className={
                value === "Actif"
                  ? "inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                  : "inline-flex rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
              }
            >
              {value}
            </span>
          );
        },
      },

      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }: CellContext<UserItem, unknown>) => (
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => router.push(`/users/${row.original.id}/edit`)}
                >
                  <Pencil />
                  Modifier le personnel
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      router.push(`/users/${row.original.id}/reset-password`)
                    }
                  >
                    <RotateCcw />
                    Réinitialiser le mot de passe
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setPendingDeleteUser(row.original)}
                  disabled={deletingId === row.original.id}
                >
                  <Trash2 />
                  {deletingId === row.original.id
                    ? "Suppression..."
                    : "Supprimer"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [deletingId, isAdmin, router]
  );

  // TanStack Table manages imperative table helpers internally; this lint rule is a compiler advisory, not a runtime issue here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
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
            Table des personnels
          </h3>
          <p className="text-sm text-slate-600">
            Triez, filtrez et parcourez les comptes sans perdre les actions de
            gestion.
          </p>
        </div>

        <Button asChild className="md:hidden">
          <Link href="/users/new">
            <Plus />
            Ajouter un personnel
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
              placeholder="Rechercher par nom, username, rôle ou groupe"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Rôle</span>
            <Select
              value={
                (table.getColumn("role")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={value =>
                table
                  .getColumn("role")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full rounded-md bg-white text-sm">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roleOptions.map(role => (
                  <SelectItem key={role.value} value={role.label}>
                    {role.label}
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
                  Aucun personnel trouvé.
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
            Affichage de {startRow} à {endRow} sur {totalRows} personnels.
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

      <AlertDialog
        open={Boolean(pendingDeleteUser)}
        onOpenChange={open => {
          if (!open) {
            setPendingDeleteUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce personnel ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteUser
                ? `Le compte de ${pendingDeleteUser.fullName} sera supprimé définitivement.`
                : "Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={
                !pendingDeleteUser || deletingId === pendingDeleteUser?.id
              }
              onClick={() => {
                if (!pendingDeleteUser) {
                  return;
                }

                void onDelete(pendingDeleteUser).finally(() => {
                  setPendingDeleteUser(null);
                });
              }}
            >
              {pendingDeleteUser && deletingId === pendingDeleteUser.id
                ? "Suppression..."
                : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} ${hours}:${minutes}`;
}
