"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { defaultWorkPostFormState } from "./constants";
import type { WorkPostFormState, WorkPostItem } from "./types";

type WorkPostsManagerProps = {
  initialWorkPosts: WorkPostItem[];
  services: Array<{ id: string; name: string }>;
};

export function WorkPostsManager({ initialWorkPosts, services }: WorkPostsManagerProps) {
  const [workPosts, setWorkPosts] = useState<WorkPostItem[]>(initialWorkPosts);
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<WorkPostFormState>(
    defaultWorkPostFormState
  );
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<WorkPostFormState>(
    defaultWorkPostFormState
  );
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const sortedWorkPosts = useMemo(() => {
    return [...workPosts].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }

      if (a.order !== b.order) {
        return b.order - a.order;
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }, [workPosts]);

  const filteredWorkPosts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return sortedWorkPosts;
    }

    return sortedWorkPosts.filter(workPost => {
      return (
        workPost.name.toLowerCase().includes(term) ||
        workPost.code.toLowerCase().includes(term) ||
        (workPost.description || "").toLowerCase().includes(term)
      );
    });
  }, [search, sortedWorkPosts]);

  function onChange(
    field: keyof WorkPostFormState,
    value: string | boolean | number
  ) {
    setFormState(current => ({ ...current, [field]: value }));
  }

  function onEditChange(
    field: keyof WorkPostFormState,
    value: string | boolean | number
  ) {
    setEditFormState(current => ({ ...current, [field]: value }));
  }

  function startEdit(workPost: WorkPostItem) {
    setEditingPostId(workPost.id);
    setEditFormState({
      name: workPost.name,
      code: workPost.code,
      description: workPost.description || "",
      isActive: workPost.isActive,
      order: workPost.order,
      serviceId: workPost.serviceId || "",
    });
  }

  function cancelEdit() {
    setEditingPostId(null);
    setEditFormState(defaultWorkPostFormState);
  }

  async function reload() {
    const response = await fetch("/api/posts", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      posts?: WorkPostItem[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les postes.");
      return;
    }

    setWorkPosts(payload?.posts || []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de creer le poste.");
      setSubmitting(false);
      return;
    }

    toast.success("Poste cree.");
    setFormState(defaultWorkPostFormState);
    setSubmitting(false);
    await reload();
  }

  async function onToggleActive(workPost: WorkPostItem) {
    const response = await fetch(`/api/posts/${workPost.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !workPost.isActive }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Mise a jour impossible.");
      return;
    }

    toast.success("Poste mis a jour.");
    await reload();
  }

  async function onSaveEdit() {
    if (!editingPostId) {
      return;
    }

    setSavingEdit(true);

    const response = await fetch(`/api/posts/${editingPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFormState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de modifier le poste.");
      setSavingEdit(false);
      return;
    }

    toast.success("Poste modifie.");
    setSavingEdit(false);
    cancelEdit();
    await reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Gestion des postes
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Creez et activez les postes de travail de l'agence courante.
        </p>
      </div>

      <section className="border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Nouveau poste
        </h3>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nom</span>
            <input
              value={formState.name}
              onChange={event => onChange("name", event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Code</span>
            <input
              value={formState.code}
              onChange={event => onChange("code", event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2"
              placeholder="Ex: CHEF_EQUIPE"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Ordre</span>
            <input
              type="number"
              value={formState.order}
              onChange={event => onChange("order", Number(event.target.value))}
              className="w-full border border-slate-300 bg-white px-3 py-2"
              placeholder="Ex: 1"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <input
              value={formState.description}
              onChange={event => onChange("description", event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Service associé</span>
            <select
              value={formState.serviceId}
              onChange={event => onChange("serviceId", event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Aucun service (poste global)</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creation..." : "Ajouter le poste"}
            </Button>
          </div>
        </form>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Postes existants
          </h3>
          <label className="mt-3 block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2"
              placeholder="Nom, code ou description"
            />
          </label>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredWorkPosts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-600">
              {sortedWorkPosts.length === 0
                ? "Aucun poste configure."
                : "Aucun poste ne correspond a la recherche."}
            </p>
          ) : (
            filteredWorkPosts.map(workPost => (
              <div
                key={workPost.id}
                className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                {editingPostId === workPost.id ? (
                  <div className="w-full space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Nom</span>
                        <input
                          value={editFormState.name}
                          onChange={event =>
                            onEditChange("name", event.target.value)
                          }
                          className="w-full border border-slate-300 bg-white px-3 py-2"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Code</span>
                        <input
                          value={editFormState.code}
                          onChange={event =>
                            onEditChange("code", event.target.value)
                          }
                          className="w-full border border-slate-300 bg-white px-3 py-2"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">
                          Ordre
                        </span>
                        <input
                          type="number"
                          value={editFormState.order}
                          onChange={event =>
                            onEditChange("order", Number(event.target.value))
                          }
                          className="w-full border border-slate-300 bg-white px-3 py-2"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">
                          Description
                        </span>
                        <input
                          value={editFormState.description}
                          onChange={event =>
                            onEditChange("description", event.target.value)
                          }
                          className="w-full border border-slate-300 bg-white px-3 py-2"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">
                          Service associé
                        </span>
                        <select
                          value={editFormState.serviceId}
                          onChange={event =>
                            onEditChange("serviceId", event.target.value)
                          }
                          className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-805"
                        >
                          <option value="">Aucun service (poste global)</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void onSaveEdit()}
                        disabled={savingEdit}
                      >
                        {savingEdit ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={savingEdit}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {workPost.name}{" "}
                        <span className="text-slate-500">
                          ({workPost.code})
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">
                        {workPost.description || "Aucune description"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {workPost.service ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                            Service : {workPost.service.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            Poste global
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium ${
                          workPost.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {workPost.isActive ? "Actif" : "Inactif"}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(workPost)}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleActive(workPost)}
                      >
                        {workPost.isActive ? "Desactiver" : "Activer"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
