"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BadgePlus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  impactOptions,
  impactLabel,
} from "@/components/criteria-management/constants";
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
  selectedCriterion,
  submitting,
  users,
  onSubmit,
  onChange,
  onReset,
}: EvaluationFormProps) {
  const groupedCriteria = useMemo(() => {
    return impactOptions.map((option) => ({
      impact: option.value,
      label: option.label,
      items: criteria.filter((criterion) => criterion.impact === option.value),
    }));
  }, [criteria]);

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">
          Nouvelle évaluation
        </h3>
        <p className="text-sm text-slate-600">
          Sélectionnez un membre du personnel, choisissez un critère actif, puis
          enregistrez l'observation du jour.
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 font-medium text-slate-700">
            <span>Personnel</span>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href="/users/new">
                <UserPlus />
                Ajouter un personnel
              </Link>
            </Button>
          </div>
          <Select
            value={formState.userId}
            onValueChange={(value) => onChange("userId", value)}
          >
            <SelectTrigger className="w-full rounded-md bg-white text-sm">
              <SelectValue placeholder="Choisir un personnel" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {buildUserLabel(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 font-medium text-slate-700">
            <span>Critère</span>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href="/criteria/new">
                <BadgePlus />
                Ajouter un critère
              </Link>
            </Button>
          </div>
          <Select
            value={formState.criteriaId}
            onValueChange={(value) => onChange("criteriaId", value)}
          >
            <SelectTrigger className="w-full rounded-md bg-white text-sm">
              <SelectValue placeholder="Choisir un critère" />
            </SelectTrigger>
            <SelectContent>
              {groupedCriteria.map((group) => (
                <div key={group.impact}>
                  <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase">
                    {group.label}
                  </div>
                  {group.items.map((criterion) => (
                    <SelectItem key={criterion.id} value={criterion.id}>
                      {buildCriterionLabel(criterion)}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Date d'évaluation</span>
          <input
            type="date"
            value={formState.evaluationDate}
            onChange={(event) => onChange("evaluationDate", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Poids personnalisé</span>
          <input
            type="number"
            step="0.01"
            value={formState.weightOverride}
            onChange={(event) => onChange("weightOverride", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            placeholder={selectedCriterion?.defaultWeight || "Ex: -2.50"}
          />
          <span className="block text-xs text-slate-500">
            Laisser vide pour utiliser le poids par défaut du critère.
            {selectedCriterion
              ? ` Poids actuel: ${selectedCriterion.defaultWeight} (${impactLabel(selectedCriterion.impact)}).`
              : ""}
          </span>
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Notes</span>
          <textarea
            value={formState.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            placeholder="Ajoutez un contexte ou une justification si nécessaire."
          />
        </label>

        <div className="flex flex-wrap gap-2 md:col-span-2">
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
