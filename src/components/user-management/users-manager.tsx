"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { roleLabel, serviceOptionLabel } from "./constants";
import type { UserItem } from "./types";
import { UsersList } from "./users-list";

type UsersManagerProps = {
  initialUsers: UserItem[];
  currentUserRole: string;
};

export function UsersManager({
  initialUsers,
  currentUserRole,
}: UsersManagerProps) {
  const isAdmin = currentUserRole === "admin";

  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function loadUsers() {
    setLoadingUsers(true);
    const response = await fetch("/api/users", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      users?: UserItem[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les personnels.");
      setLoadingUsers(false);
      return;
    }

    setUsers(payload?.users || []);
    setLoadingUsers(false);
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter(user => {
      return (
        user.fullName.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        roleLabel(user.role).toLowerCase().includes(term) ||
        (user.phone || "").toLowerCase().includes(term) ||
        (user.group?.name || "").toLowerCase().includes(term) ||
        (user.group ? serviceOptionLabel(user.group.service) : "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [search, users]);

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;

  async function onDelete(user: UserItem) {
    setDeletingId(user.id);

    const response = await fetch(`/api/users/${user.id}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de supprimer ce personnel.");
      setDeletingId(null);
      return;
    }

    toast.success("Personnel supprimé.");
    setDeletingId(null);
    await loadUsers();
  }
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Gestion des personnels
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Administrez les comptes, leur rattachement aux groupes métier et
            leurs accès depuis cette page dédiée.
          </p>
        </div>

        <Button asChild>
          <Link href="/users/new">Ajouter un personnel</Link>
        </Button>
      </div>

      <UsersList
        users={filteredUsers}
        loading={loadingUsers}
        search={search}
        isAdmin={isAdmin}
        deletingId={deletingId}
        onSearchChange={setSearch}
        onDelete={onDelete}
      />
    </div>
  );
}
