"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type AgencyItem = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AgencyFormState = {
  name: string;
  code: string;
};

type AgenciesManagerProps = {
  initialAgencies: AgencyItem[];
};

const defaultFormState: AgencyFormState = {
  name: "",
  code: "",
};

export function AgenciesManager({ initialAgencies }: AgenciesManagerProps) {
  const [agencies, setAgencies] = useState<AgencyItem[]>(initialAgencies);
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<AgencyFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);
  const [editFormState, setEditFormState] =
    useState<AgencyFormState>(defaultFormState);
  const [savingEdit, setSavingEdit] = useState(false);

  const sortedAgencies = useMemo(() => {
    return [...agencies].sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }
      return left.name.localeCompare(right.name, "fr");
    });
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return sortedAgencies;
    }

    return sortedAgencies.filter(agency => {
      return (
        agency.name.toLowerCase().includes(term) ||
        agency.code.toLowerCase().includes(term)
      );
    });
  }, [search, sortedAgencies]);

  function onChange(field: keyof AgencyFormState, value: string) {
    setFormState(current => ({ ...current, [field]: value }));
  }

  function onEditChange(field: keyof AgencyFormState, value: string) {
    setEditFormState(current => ({ ...current, [field]: value }));
  }

  function startEdit(agency: AgencyItem) {
    setEditingAgencyId(agency.id);
    setEditFormState({
      name: agency.name,
      code: agency.code,
    });
  }

  function cancelEdit() {
    setEditingAgencyId(null);
    setEditFormState(defaultFormState);
  }

  async function reload() {
    const response = await fetch("/api/agencies", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      agencies?: AgencyItem[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les agences.");
      return;
    }

    setAgencies(payload?.agencies || []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch("/api/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de creer l'agence.");
      setSubmitting(false);
      return;
    }

    toast.success("Agence creee.");
    setFormState(defaultFormState);
    setSubmitting(false);
    await reload();
  }

  async function onSaveEdit() {
    if (!editingAgencyId) {
      return;
    }

    setSavingEdit(true);

    const response = await fetch(`/api/agencies/${editingAgencyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFormState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de modifier l'agence.");
      setSavingEdit(false);
      return;
    }

    toast.success("Agence modifiee.");
    setSavingEdit(false);
    cancelEdit();
    await reload();
  }

  async function onToggleActive(agency: AgencyItem) {
    const response = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !agency.isActive }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Mise a jour impossible.");
      return;
    }

    toast.success("Agence mise a jour.");
    await reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Gestion des agences
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Creez et administrez toutes les agences de la plateforme.
        </p>
      </div>

      <section className="border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Nouvelle agence
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
              placeholder="Ex: AGENCE_CENTRALE"
            />
          </label>

          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creation..." : "Ajouter l'agence"}
            </Button>
          </div>
        </form>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Agences existantes
          </h3>
          <label className="mt-3 block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Recherche</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2"
              placeholder="Nom ou code"
            />
          </label>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredAgencies.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-600">
              {sortedAgencies.length === 0
                ? "Aucune agence configuree."
                : "Aucune agence ne correspond a la recherche."}
            </p>
          ) : (
            filteredAgencies.map(agency => (
              <div
                key={agency.id}
                className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                {editingAgencyId === agency.id ? (
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
                        size="sm"
                        variant="outline"
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
                        {agency.name}{" "}
                        <span className="text-slate-500">({agency.code})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium ${
                          agency.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {agency.isActive ? "Active" : "Inactive"}
                      </span>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(agency)}
                      >
                        Modifier
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleActive(agency)}
                      >
                        {agency.isActive ? "Desactiver" : "Activer"}
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
