"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultCriterionFormState, impactOptions } from "./constants";
import type { CriterionFormState, CriterionImpact } from "./types";

type CriterionEditorFormProps = {
  mode: "create" | "update";
  initialState?: CriterionFormState;
  criterionId?: string;
  title: string;
  description: string;
};

export function CriterionEditorForm({
  mode,
  initialState = defaultCriterionFormState,
  criterionId,
  title,
  description,
}: CriterionEditorFormProps) {
  const [formState, setFormState] = useState<CriterionFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const endpoint =
      mode === "create" ? "/api/criteria" : `/api/criteria/${criterionId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error ||
          (mode === "create"
            ? "Impossible de créer le critère."
            : "Impossible de mettre à jour le critère.")
      );
      setSubmitting(false);
      return;
    }

    toast.success(
      mode === "create" ? "Critère créé avec succès." : "Critère mis à jour."
    );
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/criteria">Retour a la liste</Link>
        </Button>
      </div>

      <section className="border border-slate-200 bg-slate-50 p-4">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Nom du critère</span>
            <input
              value={formState.name}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
              placeholder="Ex: Absence non justifiée"
              required
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Impact</span>
            <Select
              value={formState.impact}
              onValueChange={value =>
                setFormState(current => ({
                  ...current,
                  impact: value as CriterionImpact,
                }))
              }
            >
              <SelectTrigger className="w-full bg-white text-sm">
                <SelectValue placeholder="Choisir un impact" />
              </SelectTrigger>
              <SelectContent>
                {impactOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Poids par défaut</span>
            <input
              type="number"
              step="0.01"
              value={formState.defaultWeight}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  defaultWeight: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              Maximum quotidien
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={formState.maxDaily}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  maxDaily: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
              placeholder="Laisser vide pour aucune limite"
            />
            <span className="block text-xs text-slate-500">
              Nombre maximum d'evaluations appliquees par jour pour un meme
              personnel avec ce critere.
            </span>
          </label>

          <label className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            <span>Critère actif</span>
          </label>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? mode === "create"
                  ? "Création..."
                  : "Enregistrement..."
                : mode === "create"
                  ? "Créer le critère"
                  : "Mettre a jour le critère"}
            </Button>
            <Button asChild variant="outline" disabled={submitting}>
              <Link href="/criteria">Annuler</Link>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
