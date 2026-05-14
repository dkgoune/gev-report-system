"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { defaultServiceFormState } from "./constants";
import type { ServiceFormState, ServiceItem } from "./types";

type ServicesManagerProps = {
  initialServices: ServiceItem[];
};

export function ServicesManager({ initialServices }: ServicesManagerProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [formState, setFormState] = useState<ServiceFormState>(
    defaultServiceFormState
  );
  const [submitting, setSubmitting] = useState(false);

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }, [services]);

  function onChange(field: keyof ServiceFormState, value: string | boolean) {
    setFormState(current => ({ ...current, [field]: value }));
  }

  async function reload() {
    const response = await fetch("/api/services", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      services?: ServiceItem[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les services.");
      return;
    }

    setServices(payload?.services || []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de creer le service.");
      setSubmitting(false);
      return;
    }

    toast.success("Service cree.");
    setFormState(defaultServiceFormState);
    setSubmitting(false);
    await reload();
  }

  async function onToggleActive(service: ServiceItem) {
    const response = await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !service.isActive }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Mise a jour impossible.");
      return;
    }

    toast.success("Service mis a jour.");
    await reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Gestion des services
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Creez et activez les services disponibles dans l'agence courante.
        </p>
      </div>

      <section className="border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Nouveau service
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
              placeholder="Ex: ENVOI"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Couleur (hex)</span>
            <input
              value={formState.color}
              onChange={event => onChange("color", event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2"
              placeholder="#0f766e"
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

          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creation..." : "Ajouter le service"}
            </Button>
          </div>
        </form>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Services existants
          </h3>
        </div>
        <div className="divide-y divide-slate-200">
          {sortedServices.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-600">
              Aucun service configure.
            </p>
          ) : (
            sortedServices.map(service => (
              <div
                key={service.id}
                className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {service.name}{" "}
                    <span className="text-slate-500">({service.code})</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {service.description || "Aucune description"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium ${
                      service.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {service.isActive ? "Actif" : "Inactif"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleActive(service)}
                  >
                    {service.isActive ? "Desactiver" : "Activer"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
