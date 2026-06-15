"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReportPublishButton } from "./report-publish-button";
import type { ReportFieldDefinition } from "./report-general-fields";
import {
  ReportBoundIncidentSection,
  type BoundIncidentSection,
} from "./report-bound-incident-section";
import { ReportAttendanceSection } from "./report-attendance-section";
import { ReportGeneralSection } from "./report-general-section";

type PersonnelOption = {
  id: string;
  fullName: string;
  username: string;
};

type WorkScheduleOption = {
  id: string;
  workDate: string;
  serviceId: string;
  serviceName: string;
};

type BindingFieldValidation = {
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  minValue: number | null;
  maxValue: number | null;
};

type BindingFieldDefinition = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: string[];
  validation: BindingFieldValidation;
};

type BindingPayloadItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string | null;
  templateId: string;
  templateName: string;
  templateVersionId: string;
  templateVersionNumber: number;
  minEntries: number;
  maxEntries: number | null;
  isRequired: boolean;
  isActive: boolean;
  templateVersionFields: BindingFieldDefinition[];
  allowedPosts?: Array<{ id: string; name: string; code: string }>;
};

type ReportCreationManagerProps = {
  generalFields: ReportFieldDefinition[];
  schedules: WorkScheduleOption[];
  initialWorkScheduleId: string;
  initialReportIdBySchedule: Record<string, string>;
  personnelBySchedule: Record<string, PersonnelOption[]>;
  initialIncidentBoundings: BindingPayloadItem[];
  userPostIdBySchedule?: Record<string, string>;
};

function createInitialFieldValues(fields: ReportFieldDefinition[]) {
  return Object.fromEntries(fields.map(field => [field.key, ""])) as Record<
    string,
    string
  >;
}

function buildPresentIds(personnel: PersonnelOption[]) {
  return personnel.map(user => user.id);
}

function buildIncidentEntriesByBinding(
  incidentEntries: Array<{
    templateId: string;
    valuesJson: Record<string, unknown>;
  }>,
  boundSectionsByService: Partial<Record<string, BoundIncidentSection[]>>
) {
  const templateIdToBindingId: Record<string, string> = {};

  for (const sections of Object.values(boundSectionsByService)) {
    if (!sections) {
      continue;
    }

    for (const section of sections) {
      templateIdToBindingId[section.templateId] = section.bindingId;
    }
  }

  const entriesByBinding: Partial<
    Record<string, Record<string, string | boolean>[]>
  > = {};

  for (const incident of incidentEntries) {
    const bindingId = templateIdToBindingId[incident.templateId];
    if (!bindingId) {
      continue;
    }

    entriesByBinding[bindingId] = [
      ...(entriesByBinding[bindingId] ?? []),
      incident.valuesJson as Record<string, string | boolean>,
    ];
  }

  return entriesByBinding;
}

export function ReportCreationManager({
  generalFields,
  schedules,
  initialWorkScheduleId,
  initialReportIdBySchedule,
  personnelBySchedule,
  initialIncidentBoundings = [],
  userPostIdBySchedule = {},
}: ReportCreationManagerProps) {
  const router = useRouter();
  const initialPersonnel = personnelBySchedule[initialWorkScheduleId] ?? [];
  const initialPresentIds = buildPresentIds(initialPersonnel);
  const defaultFieldValues = useMemo(
    () => createInitialFieldValues(generalFields),
    [generalFields]
  );
  const [workScheduleId, setWorkScheduleId] = useState(initialWorkScheduleId);
  const [fieldValues, setFieldValues] =
    useState<Record<string, string>>(defaultFieldValues);
  const [presentIds, setPresentIds] = useState<string[]>(initialPresentIds);
  const [boundSectionsByService, setBoundSectionsByService] = useState<
    Partial<Record<string, BoundIncidentSection[]>>
  >({});
  const [boundIncidentEntries, setBoundIncidentEntries] = useState<
    Partial<Record<string, Record<string, string | boolean>[]>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(
    initialReportIdBySchedule[initialWorkScheduleId] ?? null
  );

  const selectedSchedule = useMemo(
    () => schedules.find(schedule => schedule.id === workScheduleId) ?? null,
    [schedules, workScheduleId]
  );

  const serviceId = selectedSchedule?.serviceId ?? "";

  const currentPersonnel = useMemo(
    () => personnelBySchedule[workScheduleId] ?? [],
    [personnelBySchedule, workScheduleId]
  );

  const absentIds = useMemo(
    () =>
      currentPersonnel
        .map(user => user.id)
        .filter(userId => !presentIds.includes(userId)),
    [currentPersonnel, presentIds]
  );

  const currentUserPostId = userPostIdBySchedule[workScheduleId] ?? null;

  const activeBoundSections = useMemo(() => {
    const rawSections = boundSectionsByService[serviceId] ?? [];
    return rawSections.filter(section => {
      if (!section.allowedPosts || section.allowedPosts.length === 0) {
        return true;
      }
      return section.allowedPosts.some(post => post.id === currentUserPostId);
    });
  }, [boundSectionsByService, serviceId, currentUserPostId]);

  function handleWorkScheduleChange(nextWorkScheduleId: string) {
    setWorkScheduleId(nextWorkScheduleId);
    setSavedReportId(initialReportIdBySchedule[nextWorkScheduleId] ?? null);
    setFieldValues(defaultFieldValues);
    setPresentIds(
      buildPresentIds(personnelBySchedule[nextWorkScheduleId] ?? [])
    );
    setBoundIncidentEntries({});
  }

  useEffect(() => {
    async function loadBoundSections() {
      const grouped = initialIncidentBoundings.reduce<
        Partial<Record<string, BoundIncidentSection[]>>
      >((acc, binding) => {
        if (!binding.isActive) {
          return acc;
        }

        const section: BoundIncidentSection = {
          bindingId: binding.id,
          templateId: binding.templateId,
          templateName: binding.templateName,
          templateVersionNumber: binding.templateVersionNumber,
          fields: binding.templateVersionFields,
          minEntries: binding.minEntries,
          maxEntries: binding.maxEntries,
          isRequired: binding.isRequired,
          allowedPosts: binding.allowedPosts ?? [],
        };

        acc[binding.serviceId] = [...(acc[binding.serviceId] ?? []), section];
        return acc;
      }, {});

      setBoundSectionsByService(grouped);
      setBoundIncidentEntries(current => {
        const next = { ...current };

        for (const sections of Object.values(grouped)) {
          if (!sections) {
            continue;
          }
          for (const section of sections) {
            if (!next[section.bindingId]) {
              next[section.bindingId] = [];
            }
          }
        }

        return next;
      });
    }

    void loadBoundSections();
  }, [initialIncidentBoundings]);

  useEffect(() => {
    let cancelled = false;

    async function loadDraft() {
      if (!savedReportId) {
        return;
      }

      const response = await fetch(`/api/reports/general/${savedReportId}`, {
        method: "GET",
      });
      const payload = (await response.json().catch(() => null)) as {
        report?: {
          ambianceGenerale: string | null;
          problemesRencontres: string | null;
          etatGeneralService: string | null;
          passationService: string | null;
          observationGeneral: string | null;
          presentPersonnel?: Array<{ id: string }>;
          incidentEntries?: Array<{
            id: string;
            templateId: string;
            templateNameSnapshot: string;
            valuesJson: Record<string, unknown>;
          }>;
        };
      } | null;

      if (!response.ok || !payload?.report || cancelled) {
        return;
      }

      setFieldValues(current => ({
        ...current,
        ambianceGenerale: payload.report?.ambianceGenerale ?? "",
        problemesRencontres: payload.report?.problemesRencontres ?? "",
        etatGeneralService: payload.report?.etatGeneralService ?? "",
        passationService: payload.report?.passationService ?? "",
        observationGeneral: payload.report?.observationGeneral ?? "",
      }));

      const presentFromReport =
        payload.report.presentPersonnel?.map(user => user.id) ?? [];
      if (presentFromReport.length > 0) {
        setPresentIds(presentFromReport);
      }

      const incidentEntries = payload.report.incidentEntries ?? [];
      const entriesByBinding = buildIncidentEntriesByBinding(
        incidentEntries,
        boundSectionsByService
      );

      // Replace entries for a fresh edit session instead of appending repeatedly.
      setBoundIncidentEntries(entriesByBinding);
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [savedReportId, boundSectionsByService]);

  function handleReset() {
    setWorkScheduleId(initialWorkScheduleId);
    setSavedReportId(initialReportIdBySchedule[initialWorkScheduleId] ?? null);
    setFieldValues(defaultFieldValues);
    setPresentIds(
      buildPresentIds(personnelBySchedule[initialWorkScheduleId] ?? [])
    );
    setBoundIncidentEntries({});
  }

  function togglePresent(userId: string, checked: boolean) {
    setPresentIds(current =>
      checked
        ? Array.from(new Set([...current, userId]))
        : current.filter(id => id !== userId)
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    for (const section of activeBoundSections) {
      const entries = boundIncidentEntries[section.bindingId] ?? [];

      if (section.isRequired && entries.length < section.minEntries) {
        toast.error(
          `${section.templateName}: minimum ${section.minEntries} entree(s) requise(s).`
        );
        return;
      }

      if (section.maxEntries !== null && entries.length > section.maxEntries) {
        toast.error(
          `${section.templateName}: maximum ${section.maxEntries} entree(s) autorisee(s).`
        );
        return;
      }

      for (const entry of entries) {
        for (const field of section.fields) {
          const rawValue = entry[field.key];

          if (field.required) {
            const missing =
              typeof rawValue === "boolean"
                ? rawValue !== true
                : String(rawValue ?? "").trim().length === 0;
            if (missing) {
              toast.error(
                `${section.templateName}: ${field.label} est obligatoire.`
              );
              return;
            }
          }

          if (typeof rawValue === "string") {
            const value = rawValue.trim();

            if (
              field.validation.minLength !== null &&
              value.length < field.validation.minLength
            ) {
              toast.error(
                `${section.templateName}: ${field.label} doit contenir au moins ${field.validation.minLength} caracteres.`
              );
              return;
            }

            if (
              field.validation.maxLength !== null &&
              value.length > field.validation.maxLength
            ) {
              toast.error(
                `${section.templateName}: ${field.label} depasse ${field.validation.maxLength} caracteres.`
              );
              return;
            }

            if (field.validation.pattern && value) {
              try {
                const regex = new RegExp(field.validation.pattern);
                if (!regex.test(value)) {
                  toast.error(
                    `${section.templateName}: ${field.label} ne respecte pas le format attendu.`
                  );
                  return;
                }
              } catch {
                toast.error(
                  `${section.templateName}: regex invalide sur ${field.label}.`
                );
                return;
              }
            }

            if (field.type === "number" && value) {
              const numberValue = Number(value);
              if (!Number.isFinite(numberValue)) {
                toast.error(
                  `${section.templateName}: ${field.label} doit etre numerique.`
                );
                return;
              }

              if (
                field.validation.minValue !== null &&
                numberValue < field.validation.minValue
              ) {
                toast.error(
                  `${section.templateName}: ${field.label} doit etre >= ${field.validation.minValue}.`
                );
                return;
              }

              if (
                field.validation.maxValue !== null &&
                numberValue > field.validation.maxValue
              ) {
                toast.error(
                  `${section.templateName}: ${field.label} doit etre <= ${field.validation.maxValue}.`
                );
                return;
              }
            }
          }
        }
      }
    }

    setSubmitting(true);

    const response = await fetch("/api/reports/general", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: savedReportId,
        workScheduleId,
        ...fieldValues,
        presentPersonnelIds: presentIds,
        absentPersonnelIds: absentIds,
        incidentEntries: Object.fromEntries(
          activeBoundSections.map(section => [
            section.bindingId,
            boundIncidentEntries[section.bindingId] ?? [],
          ])
        ),
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      report?: { id: string; status: "draft" | "published" };
    } | null;

    if (!response.ok || !payload?.report) {
      toast.error(payload?.error || "Impossible d'enregistrer le rapport.");
      setSubmitting(false);
      return;
    }

    setSavedReportId(payload.report.id);
    toast.success("Brouillon enregistré.");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <ReportGeneralSection
        fields={generalFields}
        schedules={schedules}
        workScheduleId={workScheduleId}
        values={fieldValues}
        onWorkScheduleChange={handleWorkScheduleChange}
        onFieldChange={(fieldKey, value) =>
          setFieldValues(current => ({ ...current, [fieldKey]: value }))
        }
      />

      <ReportAttendanceSection
        personnel={currentPersonnel}
        presentIds={presentIds}
        onTogglePresent={togglePresent}
      />

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-teal-700 uppercase">
            Incidents liés
          </p>
        </div>

        <div className="space-y-5">
          {activeBoundSections.map(section => (
            <ReportBoundIncidentSection
              key={`binding-${section.bindingId}`}
              section={section}
              entries={boundIncidentEntries[section.bindingId] ?? []}
              onEntriesChange={entries =>
                setBoundIncidentEntries(current => ({
                  ...current,
                  [section.bindingId]: entries,
                }))
              }
            />
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-3 border border-slate-200 bg-slate-900 px-5 py-4 text-white">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer le brouillon"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={submitting}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          onClick={handleReset}
        >
          Réinitialiser
        </Button>
        {savedReportId ? (
          <>
            <ReportPublishButton
              reportId={savedReportId}
              disabled={submitting}
            />
            <Button
              asChild
              type="button"
              size="lg"
              variant="outline"
              disabled={submitting}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href={`/reports/${savedReportId}`}>Voir le rapport</Link>
            </Button>
          </>
        ) : null}
      </section>
    </form>
  );
}
