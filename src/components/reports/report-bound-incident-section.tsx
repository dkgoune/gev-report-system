"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ValidationRules = {
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  minValue: number | null;
  maxValue: number | null;
};

type BoundIncidentField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: string[];
  validation: ValidationRules;
};

export type BoundIncidentSection = {
  bindingId: string;
  templateId: string;
  templateName: string;
  templateVersionNumber: number;
  fields: BoundIncidentField[];
  minEntries: number;
  maxEntries: number | null;
  isRequired: boolean;
};

type EntryValue = Record<string, string | boolean>;

type ReportBoundIncidentSectionProps = {
  section: BoundIncidentSection;
  entries: EntryValue[];
  onEntriesChange: (entries: EntryValue[]) => void;
};

function createEmptyEntry(fields: BoundIncidentField[]) {
  return Object.fromEntries(
    fields.map(field => [field.key, field.type === "boolean" ? false : ""])
  ) as EntryValue;
}

function hasAnyEntryValue(entry: EntryValue) {
  return Object.values(entry).some(value => {
    if (typeof value === "boolean") {
      return value;
    }

    return String(value ?? "").trim().length > 0;
  });
}

export function ReportBoundIncidentSection({
  section,
  entries,
  onEntriesChange,
}: ReportBoundIncidentSectionProps) {
  const [draftEntry, setDraftEntry] = useState<EntryValue>(() =>
    createEmptyEntry(section.fields)
  );

  const limitReached =
    section.maxEntries !== null && entries.length >= section.maxEntries;

  const helperLabel = useMemo(() => {
    if (!section.isRequired) {
      return "Section optionnelle.";
    }

    if (section.maxEntries === null) {
      return `Section requise: au moins ${section.minEntries} entree(s).`;
    }

    return `Section requise: ${section.minEntries} a ${section.maxEntries} entree(s).`;
  }, [section.isRequired, section.maxEntries, section.minEntries]);

  function updateEntry(
    rowIndex: number,
    fieldKey: string,
    value: string | boolean
  ) {
    onEntriesChange(
      entries.map((entry, index) =>
        index === rowIndex ? { ...entry, [fieldKey]: value } : entry
      )
    );
  }

  function removeEntry(rowIndex: number) {
    onEntriesChange(entries.filter((_, index) => index !== rowIndex));
  }

  function addEntry() {
    if (limitReached || !hasAnyEntryValue(draftEntry)) {
      return;
    }

    onEntriesChange([...entries, draftEntry]);
    setDraftEntry(createEmptyEntry(section.fields));
  }

  return (
    <section className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900">
          {section.templateName}
        </h3>
        <p className="text-sm leading-6 text-slate-600">{helperLabel}</p>
      </div>

      <div className="overflow-x-auto border border-slate-200">
        <Table className="min-w-full text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow>
              {section.fields.map(field => (
                <TableHead key={field.key} className="min-w-44 px-3 py-3">
                  {field.label}
                  {field.required ? " *" : ""}
                </TableHead>
              ))}
              <TableHead className="w-20 px-3 py-3 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={section.fields.length + 1}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Aucune entree ajoutee.
                </TableCell>
              </TableRow>
            ) : null}

            {entries.map((entry, rowIndex) => (
              <TableRow key={`${section.bindingId}-${rowIndex}`}>
                {section.fields.map(field => (
                  <TableCell key={field.key} className="px-3 py-3 align-top">
                    <BoundFieldInput
                      field={field}
                      value={entry[field.key] ?? ""}
                      onChange={value =>
                        updateEntry(rowIndex, field.key, value)
                      }
                    />
                  </TableCell>
                ))}
                <TableCell className="px-3 py-3 align-top text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEntry(rowIndex)}
                  >
                    <Trash2 />
                    Retirer
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-amber-50/50">
              {section.fields.map(field => (
                <TableCell key={field.key} className="px-3 py-3 align-top">
                  <BoundFieldInput
                    field={field}
                    value={draftEntry[field.key] ?? ""}
                    onChange={value =>
                      setDraftEntry(current => ({
                        ...current,
                        [field.key]: value,
                      }))
                    }
                  />
                </TableCell>
              ))}
              <TableCell className="px-3 py-3 align-top text-right">
                <Button
                  type="button"
                  size="sm"
                  disabled={limitReached}
                  onClick={addEntry}
                >
                  Ajouter
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function BoundFieldInput({
  field,
  value,
  onChange,
}: {
  field: BoundIncidentField;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        onChange={event => onChange(event.target.value)}
        placeholder={field.placeholder ?? undefined}
        className="min-h-11 w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        rows={1}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm text-slate-700 p-3 border border-slate-300 bg-white">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={event => onChange(event.target.checked)}
        />
        Oui
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={String(value ?? "")}
        onChange={event => onChange(event.target.value)}
        className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
      >
        <option value="">Selectionner...</option>
        {field.options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={
        field.type === "number"
          ? "number"
          : field.type === "time"
            ? "time"
            : field.type === "date"
              ? "date"
              : "text"
      }
      value={typeof value === "boolean" ? String(value) : String(value ?? "")}
      onChange={event => onChange(event.target.value)}
      placeholder={field.placeholder ?? undefined}
      className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
    />
  );
}
