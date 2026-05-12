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
import {
  createEmptyGeneralSubReportEntry,
  isGeneralSubReportEntryEmpty,
  type GeneralSubReportEntry,
  type GeneralSubReportSection,
} from "@/lib/general-report-subreports";
import type { Service } from "@/generated/prisma/enums";

type ReportIncidentTableSectionProps = {
  entries: GeneralSubReportEntry[];
  section: GeneralSubReportSection;
  service: Service;
  onEntriesChange: (entries: GeneralSubReportEntry[]) => void;
};

export function ReportIncidentTableSection({
  entries,
  section,
  service,
  onEntriesChange,
}: ReportIncidentTableSectionProps) {
  const fields = useMemo(
    () => section.fieldsByService[service] ?? [],
    [section.fieldsByService, service]
  );
  const [draftEntry, setDraftEntry] = useState<GeneralSubReportEntry>(() =>
    createEmptyGeneralSubReportEntry(section.slug, service)
  );

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
    if (isGeneralSubReportEntryEmpty(section.slug, service, draftEntry)) {
      return;
    }

    onEntriesChange([...entries, draftEntry]);
    setDraftEntry(createEmptyGeneralSubReportEntry(section.slug, service));
  }

  return (
    <section className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900">
          {section.title}
        </h3>
        <p className="text-sm leading-6 text-slate-600">
          {section.description}
        </p>
      </div>

      <div className="overflow-x-auto border border-slate-200">
        <Table className="min-w-full text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow>
              {fields.map(field => (
                <TableHead key={field.key} className="min-w-44 px-3 py-3">
                  {field.label}
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
                  colSpan={fields.length + 1}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {section.emptyLabel}
                </TableCell>
              </TableRow>
            ) : null}

            {entries.map((entry, rowIndex) => (
              <TableRow key={`${section.slug}-${rowIndex}`}>
                {fields.map(field => (
                  <TableCell key={field.key} className="px-3 py-3 align-top">
                    <IncidentFieldInput
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
              {fields.map(field => (
                <TableCell key={field.key} className="px-3 py-3 align-top">
                  <IncidentFieldInput
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
                <Button type="button" size="sm" onClick={addEntry}>
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

function IncidentFieldInput({
  field,
  value,
  onChange,
}: {
  field: { key: string; placeholder?: string; type: string };
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        onChange={event => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="min-h-11 w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        rows={1}
      />
    );
  }

  return (
    <input
      type={
        field.type === "number"
          ? "number"
          : field.type === "time"
            ? "time"
            : "text"
      }
      value={typeof value === "boolean" ? String(value) : String(value ?? "")}
      onChange={event => onChange(event.target.value)}
      placeholder={field.placeholder}
      className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
    />
  );
}
