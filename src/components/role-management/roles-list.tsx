"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Shield, UserCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export type RoleListItem = {
  id: string;
  name: string;
  description: string | null;
  permissionsCount: number;
  membersCount: number;
  creatorName: string;
  createdAt: string;
};

type RolesListProps = {
  initialRoles: RoleListItem[];
  canManage: boolean;
};

export function RolesList({ initialRoles, canManage }: RolesListProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleListItem[]>(initialRoles);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRoles = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return roles;
    return roles.filter(
      role =>
        role.name.toLowerCase().includes(query) ||
        (role.description && role.description.toLowerCase().includes(query))
    );
  }, [roles, search]);

  async function handleDeleteConfirm() {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/roles/${deletingId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        toast.error(payload?.error || "Impossible de supprimer le rôle.");
        return;
      }

      toast.success("Rôle supprimé avec succès.");
      setRoles(current => current.filter(r => r.id !== deletingId));
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setDeletingName("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestion des Rôles</h2>
          <p className="mt-1 text-sm text-slate-600">
            Créez des rôles personnalisés avec des permissions spécifiques pour vos agents.
          </p>
        </div>

        {canManage && (
          <Button asChild className="shrink-0 bg-teal-600 hover:bg-teal-700">
            <Link href="/roles/new" className="inline-flex items-center gap-2">
              <Plus className="size-4" />
              Nouveau rôle
            </Link>
          </Button>
        )}
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4">
        <label className="space-y-2 text-sm block">
          <span className="font-medium text-slate-700">Rechercher un rôle</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer par nom ou description..."
            className="w-full max-w-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </label>
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Nom & Description</th>
                <th className="px-6 py-4 text-center">Permissions</th>
                <th className="px-6 py-4 text-center">Membres Actifs</th>
                <th className="px-6 py-4">Créateur</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-6 py-10 text-center text-slate-500 italic"
                  >
                    Aucun rôle trouvé.
                  </td>
                </tr>
              ) : (
                filteredRoles.map(role => (
                  <tr key={role.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 text-base">{role.name}</p>
                      {role.description ? (
                        <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                          {role.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-1">
                          Aucune description fournie
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200/60 text-teal-800 text-xs px-2.5 py-1 font-semibold rounded-full">
                        <Shield className="size-3 text-teal-600" />
                        {role.permissionsCount} permissions
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200/60 text-blue-800 text-xs px-2.5 py-1 font-semibold rounded-full">
                        <UserCheck className="size-3 text-blue-600" />
                        {role.membersCount} personnels
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>
                        <p className="text-sm font-medium">{role.creatorName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Créé le {new Date(role.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            title="Modifier le rôle"
                          >
                            <Link href={`/roles/${role.id}/edit`}>
                              <Pencil className="size-4 text-slate-600" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Supprimer le rôle"
                            onClick={() => {
                              setDeletingId(role.id);
                              setDeletingName(role.name);
                            }}
                          >
                            <Trash2 className="size-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog
        open={Boolean(deletingId)}
        onOpenChange={open => {
          if (!open) {
            setDeletingId(null);
            setDeletingName("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement le rôle{" "}
              <strong className="text-slate-800">"{deletingName}"</strong> ? Cette action est
              irréversible et retirera ce rôle à tous les utilisateurs associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
              onClick={e => {
                e.preventDefault();
                void handleDeleteConfirm();
              }}
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
