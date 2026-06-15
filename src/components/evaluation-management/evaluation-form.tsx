"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { impactOptions } from "@/components/criteria-management/constants";
import { buildCriterionLabel, buildUserLabel } from "./constants";
import type {
  EvaluationCriterionOption,
  EvaluationFormState,
  EvaluationUserOption,
} from "./types";

type EvaluationFormProps = {
  criteria: EvaluationCriterionOption[];
  formState: EvaluationFormState;
  submitting: boolean;
  users: EvaluationUserOption[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof EvaluationFormState, value: string) => void;
  onReset: () => void;
};

export function EvaluationForm({
  criteria,
  formState,
  submitting,
  users,
  onSubmit,
  onChange,
  onReset,
}: EvaluationFormProps) {
  const groupedCriteria = useMemo(() => {
    return impactOptions.map(option => ({
      impact: option.value,
      label: option.label,
      items: criteria.filter(criterion => criterion.impact === option.value),
    }));
  }, [criteria]);

  const criterionOptions = useMemo(() => {
    return groupedCriteria.flatMap(group =>
      group.items.map(criterion => ({
        value: criterion.id,
        label: buildCriterionLabel(criterion),
        keywords: [group.label, criterion.name],
      }))
    );
  }, [groupedCriteria]);

  const userOptions = useMemo(() => {
    const options = users.map(user => ({
      value: user.id,
      label: buildUserLabel(user),
      keywords: [user.fullName],
    }));
    return [
      {
        value: "",
        label: "Aucun personnel (Évaluation générale / Incident)",
        keywords: ["aucun", "general", "incident"],
      },
      ...options,
    ];
  }, [users]);

  return (
    <section className="border border-slate-200 bg-slate-50 p-6 rounded-lg shadow-xs max-w-4xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          Nouvelle évaluation
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Sélectionnez un membre du personnel (optionnel), choisissez un critère actif, puis
          enregistrez vos notes et observations du jour.
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 block">
              Personnel (Optionnel)
            </span>
            <SearchableSelect
              value={formState.evaluatedUserId}
              onValueChange={value => onChange("evaluatedUserId", value)}
              options={userOptions}
              placeholder="Choisir un personnel"
              searchPlaceholder="Rechercher un personnel"
              emptyMessage="Aucun personnel ne correspond à la recherche."
            />
          </div>

          <div className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 block">
              Critère *
            </span>
            <SearchableSelect
              value={formState.criterionId}
              onValueChange={value => onChange("criterionId", value)}
              options={criterionOptions}
              placeholder="Choisir un critère"
              searchPlaceholder="Rechercher un critère"
              emptyMessage="Aucun critère ne correspond à la recherche."
            />
          </div>

          <label className="space-y-2 text-sm block">
            <span className="font-semibold text-slate-700 block">
              Date et heure d'évaluation *
            </span>
            <input
              type="datetime-local"
              value={formState.date}
              onChange={event => onChange("date", event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded h-9.5"
              required
            />
          </label>

          <label className="space-y-2 text-sm sm:col-span-2 block">
            <span className="font-semibold text-slate-700 block">
              Notes / Observations *
            </span>
            <textarea
              value={formState.comment}
              onChange={event => onChange("comment", event.target.value)}
              className="min-h-28 w-full border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded"
              placeholder="Ajoutez vos observations et remarques pour ce membre du personnel."
              required
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Enregistrer l'évaluation"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={submitting}
          >
            Réinitialiser
          </Button>
        </div>
      </form>
    </section>
  );
}
