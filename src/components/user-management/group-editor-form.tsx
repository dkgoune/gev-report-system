"use client";

import { Button } from "@/components/ui/button";
import {
  defaultGroupFormState,
  serviceOptions,
} from "@/components/user-management/constants";
import type { GroupFormState } from "@/components/user-management/types";

type GroupEditorFormProps = {
  mode: "create" | "update";
  value: GroupFormState;
  submitting: boolean;
  onChange: (value: GroupFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
};

export function GroupEditorForm({
  mode,
  value,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}: GroupEditorFormProps) {
  const isEditing = mode === "update";

  return (
    <section className="border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">
          {isEditing ? "Modifier le groupe" : "Créer un groupe"}
        </h3>
        <p className="text-sm text-slate-600">
          Définissez un groupe métier et rattachez-le à un service précis.
        </p>
      </div>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Nom du groupe</span>
          <input
            value={value.name}
            onChange={event =>
              onChange({
                ...value,
                name: event.target.value,
              })
            }
            className="w-full border border-slate-300 px-3 py-2"
            placeholder="Ex. Equipe Envoi Nuit"
            required
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Service</span>
          <select
            value={value.service}
            onChange={event =>
              onChange({
                ...value,
                service: event.target.value as GroupFormState["service"],
              })
            }
            className="w-full border border-slate-300 px-3 py-2"
          >
            {serviceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={value.isActive}
            onChange={event =>
              onChange({
                ...value,
                isActive: event.target.checked,
              })
            }
          />
          <span>Groupe actif</span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? isEditing
                ? "Enregistrement..."
                : "Création..."
              : isEditing
                ? "Mettre à jour le groupe"
                : "Créer le groupe"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => {
              onCancel();
              onChange(defaultGroupFormState);
            }}
          >
            {isEditing ? "Annuler" : "Réinitialiser"}
          </Button>
        </div>
      </form>
    </section>
  );
}
