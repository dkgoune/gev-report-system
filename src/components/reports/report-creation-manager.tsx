"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Role, Service } from "@/generated/prisma/enums";
import type {
  GeneralSubReportEntry,
  GeneralSubReportSection,
} from "@/lib/general-report-subreports";
import type { ReportGroup } from "@/lib/report-records";
import type { ReportFieldDefinition } from "@/lib/report-types";
import { Button } from "@/components/ui/button";
import { ReportAttendanceSection } from "./report-attendance-section";
import { ReportGeneralSection } from "./report-general-section";
import { ReportIncidentTableSection } from "./report-incident-table-section";

type PersonnelOption = {
  id: string;
  fullName: string;
  groupId: string | null;
  role: Role;
  username: string;
};

type ReportCreationManagerProps = {
  generalFields: ReportFieldDefinition[];
  groupsByService: Record<string, ReportGroup[]>;
  initialDate: string;
  initialGroupId: string;
  isAdmin: boolean;
  personnelByService: Record<string, PersonnelOption[]>;
  sectionsByService: Record<string, GeneralSubReportSection[]>;
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

export function ReportCreationManager({
  generalFields,
  groupsByService,
  initialDate,
  initialGroupId,
  isAdmin,
  personnelByService,
  sectionsByService,
}: ReportCreationManagerProps) {
  const router = useRouter();
  const groups = useMemo(
    () => Object.values(groupsByService).flat(),
    [groupsByService]
  );
  const initialGroup =
    groups.find(group => group.id === initialGroupId) ?? groups[0] ?? null;
  const initialService = initialGroup?.service ?? ("envoi" as Service);
  const initialScopedPersonnel = (
    personnelByService[initialService] ?? []
  ).filter(user => (initialGroupId ? user.groupId === initialGroupId : true));
  const initialPresentIds = buildPresentIds(initialScopedPersonnel);
  const defaultFieldValues = useMemo(
    () => createInitialFieldValues(generalFields),
    [generalFields]
  );
  const [reportDate, setReportDate] = useState(initialDate);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [fieldValues, setFieldValues] =
    useState<Record<string, string>>(defaultFieldValues);
  const [presentIds, setPresentIds] = useState<string[]>(initialPresentIds);
  const [subReports, setSubReports] = useState<
    Partial<Record<string, GeneralSubReportEntry[]>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const currentGroup =
    groups.find(group => group.id === groupId) ?? initialGroup;
  const service = currentGroup?.service ?? initialService;
  const effectiveGroupId = currentGroup?.id ?? "";
  const currentPersonnel = useMemo(
    () =>
      (personnelByService[service] ?? []).filter(user =>
        effectiveGroupId ? user.groupId === effectiveGroupId : true
      ),
    [effectiveGroupId, personnelByService, service]
  );
  const currentGroups = useMemo(() => groups, [groups]);
  const currentSections = sectionsByService[service] ?? [];

  const absentIds = useMemo(
    () =>
      currentPersonnel
        .map(user => user.id)
        .filter(userId => !presentIds.includes(userId)),
    [currentPersonnel, presentIds]
  );

  function handleGroupChange(nextGroupId: string) {
    const nextGroup = groups.find(group => group.id === nextGroupId);
    const nextService = nextGroup?.service ?? service;
    setGroupId(nextGroupId);
    setPresentIds(
      buildPresentIds(
        (personnelByService[nextService] ?? []).filter(user =>
          nextGroupId ? user.groupId === nextGroupId : true
        )
      )
    );
    setSubReports({});
  }

  function handleReset() {
    setReportDate(initialDate);
    setGroupId(initialGroupId);
    setFieldValues(defaultFieldValues);
    setPresentIds(
      buildPresentIds(
        (personnelByService[initialService] ?? []).filter(user =>
          initialGroupId ? user.groupId === initialGroupId : true
        )
      )
    );
    setSubReports({});
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

    const confirmed = window.confirm(
      "Confirmer l'enregistrement de ce rapport ? Après validation, vous ne pourrez plus le modifier."
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/reports/general", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: effectiveGroupId,
        reportDate,
        service,
        ...fieldValues,
        presentPersonnelIds: presentIds,
        absentPersonnelIds: absentIds,
        subReports: Object.fromEntries(
          currentSections.map(section => [
            section.slug,
            subReports[section.slug] ?? [],
          ])
        ),
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      report?: { id: string };
    } | null;

    if (!response.ok || !payload?.report) {
      toast.error(payload?.error || "Impossible d'enregistrer le rapport.");
      setSubmitting(false);
      return;
    }

    toast.success("Rapport général enregistré.");
    setSubmitting(false);
    router.push("/reports");
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <ReportGeneralSection
        fields={generalFields}
        groups={currentGroups}
        groupId={effectiveGroupId}
        isAdmin={isAdmin}
        reportDate={reportDate}
        values={fieldValues}
        onGroupChange={handleGroupChange}
        onFieldChange={(fieldKey, value) =>
          setFieldValues(current => ({ ...current, [fieldKey]: value }))
        }
        onDateChange={setReportDate}
      />

      <ReportAttendanceSection
        personnel={currentPersonnel}
        presentIds={presentIds}
        onTogglePresent={togglePresent}
      />

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-teal-700 uppercase">
            Rapports specifiques
          </p>
        </div>

        <div className="space-y-5">
          {currentSections.map(section => (
            <ReportIncidentTableSection
              key={`${service}-${section.slug}`}
              entries={subReports[section.slug] ?? []}
              section={section}
              service={service}
              onEntriesChange={entries =>
                setSubReports(current => ({
                  ...current,
                  [section.slug]: entries,
                }))
              }
            />
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-3 border border-slate-200 bg-slate-900 px-5 py-4 text-white">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer le rapport"}
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
      </section>
    </form>
  );
}
