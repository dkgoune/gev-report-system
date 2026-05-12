"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EvaluationForm } from "./evaluation-form";
import { defaultEvaluationFormState } from "./constants";
import type {
  EvaluationCriterionOption,
  EvaluationFormState,
  EvaluationUserOption,
} from "./types";

type EvaluationManagerProps = {
  canViewList: boolean;
  initialCriteria: EvaluationCriterionOption[];
  initialUsers: EvaluationUserOption[];
};

export function EvaluationManager({
  canViewList,
  initialCriteria,
  initialUsers,
}: EvaluationManagerProps) {
  const [criteria] = useState(initialCriteria);
  const [users] = useState(initialUsers);
  const [formState, setFormState] = useState<EvaluationFormState>(
    defaultEvaluationFormState
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
      skipped?: boolean;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible d'enregistrer l'évaluation.");
      setSubmitting(false);
      return;
    }

    toast.success(payload?.message || "Évaluation enregistrée.");
    setFormState(defaultEvaluationFormState);
    setSubmitting(false);
  }

  function onChange(field: keyof EvaluationFormState, value: string) {
    setFormState(current => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Ajouter une évaluation
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enregistrez un critère appliqué à un membre du personnel depuis une
            page dédiée.
          </p>
        </div>

        {canViewList ? (
          <Button asChild variant="outline">
            <Link href="/evaluations">Voir la liste</Link>
          </Button>
        ) : null}
      </div>

      <EvaluationForm
        criteria={criteria}
        formState={formState}
        submitting={submitting}
        users={users}
        onSubmit={onSubmit}
        onChange={onChange}
        onReset={() => setFormState(defaultEvaluationFormState)}
      />
    </div>
  );
}
