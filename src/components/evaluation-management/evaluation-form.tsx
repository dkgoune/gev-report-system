"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BadgePlus, UserPlus } from "lucide-react";
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
  selectedCriterion?: EvaluationCriterionOption;
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
    return users.map(user => ({
      value: user.id,
      label: buildUserLabel(user),
      keywords: [user.fullName, user.role],
    }));
  }, [users]);

  return (
    <section className="border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">
          Nouvelle évaluation
        </h3>
        <p className="text-sm text-slate-600">
          Sélectionnez un membre du personnel, choisissez un critère actif, puis
          enregistrez l'observation du jour. Le poids applique reste celui du
          critere defini par l'administration.
        </p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        onSubmit={onSubmit}
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 font-medium text-slate-700">
            <span>Personnel</span>
          </div>
          <SearchableSelect
            value={formState.userId}
            onValueChange={value => onChange("userId", value)}
            options={userOptions}
            placeholder="Choisir un personnel"
            searchPlaceholder="Rechercher un personnel"
            emptyMessage="Aucun personnel ne correspond a la recherche."
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 font-medium text-slate-700">
            <span>Critère</span>
          </div>
          <SearchableSelect
            value={formState.criteriaId}
            onValueChange={value => onChange("criteriaId", value)}
            options={criterionOptions}
            placeholder="Choisir un critère"
            searchPlaceholder="Rechercher un critère"
            emptyMessage="Aucun critere ne correspond a la recherche."
          />
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Date d'évaluation</span>
          <input
            type="date"
            value={formState.evaluationDate}
            onChange={event => onChange("evaluationDate", event.target.value)}
            className="w-full border border-slate-300 bg-white px-3 py-2 mt-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2 xl:col-span-3">
          <span className="font-medium text-slate-700">Notes</span>
          <textarea
            value={formState.notes}
            onChange={event => onChange("notes", event.target.value)}
            className="min-h-28 w-full border border-slate-300 bg-white px-3 py-2"
            placeholder="Ajoutez un contexte ou une justification si nécessaire."
          />
        </label>

        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3">
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
