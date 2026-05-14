"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { impactOptions } from "@/components/criteria-management/constants";
import { buildCriterionLabel, buildUserLabel } from "./constants";
import type {
  EvaluationCriterionOption,
  EvaluationFormState,
  EvaluationScheduleOption,
  EvaluationUserOption,
} from "./types";

type EvaluationFormProps = {
  criteria: EvaluationCriterionOption[];
  formState: EvaluationFormState;
  schedules: EvaluationScheduleOption[];
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
  schedules,
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
      keywords: [user.fullName],
    }));
  }, [users]);

  const scheduleOptions = useMemo(() => {
    return schedules.map(schedule => ({
      value: schedule.id,
      label: `${new Date(schedule.workDate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })} - ${schedule.serviceName}`,
      keywords: [schedule.serviceName, schedule.workDate],
    }));
  }, [schedules]);

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
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        onSubmit={onSubmit}
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 font-medium text-slate-700">
            <span>Personnel</span>
          </div>
          <SearchableSelect
            value={formState.evaluatedUserId}
            onValueChange={value => onChange("evaluatedUserId", value)}
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
            value={formState.criterionId}
            onValueChange={value => onChange("criterionId", value)}
            options={criterionOptions}
            placeholder="Choisir un critère"
            searchPlaceholder="Rechercher un critère"
            emptyMessage="Aucun critere ne correspond a la recherche."
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 font-medium text-slate-700">
            <span>Planning</span>
          </div>
          <SearchableSelect
            value={formState.workScheduleId}
            onValueChange={value => onChange("workScheduleId", value)}
            options={scheduleOptions}
            placeholder="Choisir un planning"
            searchPlaceholder="Rechercher un planning"
            emptyMessage="Aucun planning ne correspond a la recherche."
          />
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Score</span>
          <input
            type="number"
            min={0}
            value={formState.score}
            onChange={event => onChange("score", event.target.value)}
            className="w-full border border-slate-300 bg-white px-3 py-2 mt-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2 xl:col-span-4">
          <span className="font-medium text-slate-700">Notes</span>
          <textarea
            value={formState.comment}
            onChange={event => onChange("comment", event.target.value)}
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
