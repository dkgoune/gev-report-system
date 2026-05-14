"use client";

import { IncidentFieldType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import type { FieldDraft } from "./incident-field-utils";
import { FIELD_TYPE_OPTIONS } from "./incident-field-utils";

type IncidentFieldDraftEditorProps = {
  field: FieldDraft;
  index: number;
  totalCount: number;
  onUpdate: (
    index: number,
    key: keyof FieldDraft,
    value: string | boolean
  ) => void;
  onRemove: (index: number) => void;
};

export function IncidentFieldDraftEditor({
  field,
  index,
  totalCount,
  onUpdate,
  onRemove,
}: IncidentFieldDraftEditorProps) {
  return (
    <div className="space-y-2 border border-slate-200 bg-white p-3">
      {/* Row 1: identity and presentation */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* key */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Cle</span>
          <input
            value={field.key}
            onChange={event => onUpdate(index, "key", event.target.value)}
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="ex: nom_passager"
          />
        </label>

        {/* label */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Libelle</span>
          <input
            value={field.label}
            onChange={event => onUpdate(index, "label", event.target.value)}
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="Ex: Nom du passager"
          />
        </label>

        {/* type */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Type</span>
          <select
            value={field.type}
            onChange={event =>
              onUpdate(
                index,
                "type",
                event.target.value as keyof typeof IncidentFieldType
              )
            }
            className="w-full border border-slate-300 px-2 py-1 text-sm"
          >
            {FIELD_TYPE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {/* placeholder */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Placeholder</span>
          <input
            value={field.placeholder}
            onChange={event =>
              onUpdate(index, "placeholder", event.target.value)
            }
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="Texte indicatif"
          />
        </label>

        {/* options */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">
            Options (a, b, c, ...)
          </span>
          <input
            value={field.optionsText}
            onChange={event =>
              onUpdate(index, "optionsText", event.target.value)
            }
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="opt1, opt2, opt3, ..."
          />
        </label>

        {/* min length */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Long. min</span>
          <input
            value={field.minLength}
            onChange={event => onUpdate(index, "minLength", event.target.value)}
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="ex: 3"
          />
        </label>

        {/* max length */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Long. max</span>
          <input
            value={field.maxLength}
            onChange={event => onUpdate(index, "maxLength", event.target.value)}
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="ex: 100"
          />
        </label>

        {/* regex */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Regex</span>
          <input
            value={field.pattern}
            onChange={event => onUpdate(index, "pattern", event.target.value)}
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="^[A-Z]+$"
          />
        </label>

        {/* min value */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Val. min</span>
          <input
            value={field.minValue}
            onChange={event => onUpdate(index, "minValue", event.target.value)}
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="ex: 0"
          />
        </label>

        {/* max value */}
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Val. max</span>
          <input
            value={field.maxValue}
            onChange={event => onUpdate(index, "maxValue", event.target.value)}
            className="w-full border border-slate-300 px-2 py-1 text-sm"
            placeholder="ex: 999"
          />
        </label>

        {/* required */}
        <label className="inline-flex items-center gap-1 text-xs text-slate-700 border border-slate-300 px-2 py-1">
          <input
            type="checkbox"
            checked={field.required}
            onChange={event =>
              onUpdate(index, "required", event.target.checked)
            }
          />
          Requis
        </label>

        {/* action */}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={totalCount === 1}
        >
          Retirer
        </Button>
      </div>
    </div>
  );
}
