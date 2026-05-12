"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { defaultGroupFormState, serviceOptionLabel } from "./constants";
import { GroupEditorForm } from "./group-editor-form";
import { GroupsList } from "./groups-list";
import type { GroupFormState, GroupItem } from "./types";

type GroupsManagerProps = {
  initialGroups: GroupItem[];
};

export function GroupsManager({ initialGroups }: GroupsManagerProps) {
  const [groups, setGroups] = useState<GroupItem[]>(initialGroups);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [groupFormState, setGroupFormState] = useState<GroupFormState>(
    defaultGroupFormState
  );

  async function loadGroups() {
    setLoadingGroups(true);
    const response = await fetch("/api/groups", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      groups?: GroupItem[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les groupes.");
      setLoadingGroups(false);
      return;
    }

    setGroups(payload?.groups || []);
    setLoadingGroups(false);
  }

  const filteredGroups = useMemo(() => {
    const term = groupSearch.trim().toLowerCase();

    if (!term) {
      return groups;
    }

    return groups.filter(group => {
      return (
        group.name.toLowerCase().includes(term) ||
        serviceOptionLabel(group.service).toLowerCase().includes(term) ||
        (group.isActive ? "actif" : "inactif").includes(term)
      );
    });
  }, [groupSearch, groups]);

  function onEditGroup(group: GroupItem) {
    setEditingGroupId(group.id);
    setGroupFormState({
      name: group.name,
      service: group.service,
      isActive: group.isActive,
    });
  }

  function onCancelGroupEdit() {
    setEditingGroupId(null);
    setGroupFormState(defaultGroupFormState);
  }

  async function onSubmitGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGroupSubmitting(true);

    const endpoint = editingGroupId
      ? `/api/groups/${editingGroupId}`
      : "/api/groups";
    const method = editingGroupId ? "PATCH" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupFormState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible d'enregistrer le groupe.");
      setGroupSubmitting(false);
      return;
    }

    toast.success(
      editingGroupId ? "Groupe mis à jour." : "Groupe créé avec succès."
    );
    setGroupSubmitting(false);
    onCancelGroupEdit();
    await loadGroups();
  }

  async function onDeleteGroup(group: GroupItem) {
    setDeletingGroupId(group.id);

    const response = await fetch(`/api/groups/${group.id}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de supprimer ce groupe.");
      setDeletingGroupId(null);
      return;
    }

    toast.success("Groupe supprimé.");
    setDeletingGroupId(null);
    if (editingGroupId === group.id) {
      onCancelGroupEdit();
    }
    await loadGroups();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Gestion des groupes de personnels
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Créez, modifiez et supprimez les groupes de personnels depuis cette
            page dédiée.
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <GroupEditorForm
          mode={editingGroupId ? "update" : "create"}
          value={groupFormState}
          submitting={groupSubmitting}
          onChange={setGroupFormState}
          onSubmit={onSubmitGroup}
          onCancel={onCancelGroupEdit}
        />

        <GroupsList
          groups={filteredGroups}
          loading={loadingGroups}
          search={groupSearch}
          deletingId={deletingGroupId}
          editingId={editingGroupId}
          onSearchChange={setGroupSearch}
          onEdit={onEditGroup}
          onDelete={onDeleteGroup}
        />
      </section>
    </div>
  );
}
