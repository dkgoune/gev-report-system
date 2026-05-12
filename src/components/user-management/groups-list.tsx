"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serviceLabel } from "@/lib/services";
import type { GroupItem } from "./types";

type GroupsListProps = {
  groups: GroupItem[];
  loading: boolean;
  search: string;
  deletingId: string | null;
  editingId: string | null;
  onSearchChange: (value: string) => void;
  onEdit: (group: GroupItem) => void;
  onDelete: (group: GroupItem) => Promise<void>;
};

export function GroupsList({
  groups,
  loading,
  search,
  deletingId,
  editingId,
  onSearchChange,
  onEdit,
  onDelete,
}: GroupsListProps) {
  const [pendingDeleteGroup, setPendingDeleteGroup] =
    useState<GroupItem | null>(null);

  return (
    <section className="space-y-4  bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            Liste des groupes
          </h3>
          <p className="text-sm text-slate-600">
            Vérifiez les services associés et le nombre de membres par groupe.
          </p>
        </div>

        <label className="w-full max-w-sm space-y-2 text-sm">
          <span className="font-medium text-slate-700">Recherche</span>
          <input
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Rechercher par nom ou service"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="overflow-hidden border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Groupe</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Membres</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  {loading
                    ? "Chargement des groupes..."
                    : "Aucun groupe ne correspond à la recherche."}
                </TableCell>
              </TableRow>
            ) : (
              groups.map(group => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-500">
                        Mis à jour le {formatDate(group.updatedAt)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{serviceLabel(group.service)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        group.isActive
                          ? "inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                          : "inline-flex rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
                      }
                    >
                      {group.isActive ? "Actif" : "Inactif"}
                    </span>
                  </TableCell>
                  <TableCell>{group.memberCount}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant={
                          editingId === group.id ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => onEdit(group)}
                      >
                        <Pencil />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === group.id}
                        onClick={() => setPendingDeleteGroup(group)}
                      >
                        <Trash2 />
                        {deletingId === group.id
                          ? "Suppression..."
                          : "Supprimer"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteGroup)}
        onOpenChange={open => {
          if (!open && !deletingId) {
            setPendingDeleteGroup(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce groupe ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteGroup
                ? `Le groupe ${pendingDeleteGroup.name} sera supprimé s'il n'a plus de membres.`
                : "Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!pendingDeleteGroup || Boolean(deletingId)}
              onClick={event => {
                event.preventDefault();

                if (!pendingDeleteGroup) {
                  return;
                }

                void onDelete(pendingDeleteGroup).then(() => {
                  setPendingDeleteGroup(null);
                });
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-SN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
