"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Plus, Printer, Shield, X } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { WeeklyWorkSchedulePrintable } from "./weekly-work-schedule-printable";
import type {
  WeeklyAssignmentsByDate,
  WeeklyMatrixPerson,
  WorkSchedulePostOption,
  WorkScheduleServiceOption,
  WorkScheduleUserOption,
} from "./types";

type WeeklyWorkScheduleBoardProps = {
  agencyName: string;
  services: WorkScheduleServiceOption[];
  users: WorkScheduleUserOption[];
  posts: WorkSchedulePostOption[];
  initialServiceId: string;
  initialWeekStart: string;
  editable?: boolean;
  enforcePlanningWindow?: boolean;
};

type WeeklyStatus = "draft" | "published";

type WeeklyReadPayload = {
  days?: Array<{
    date: string;
    schedule: {
      id: string;
      status: "draft" | "published" | "archived";
      assignments: Array<{
        userId: string;
        postId: string;
        isLeader: boolean;
        isSubleader: boolean;
        user: {
          id: string;
          fullName: string;
          username: string;
        };
      }>;
    } | null;
  }>;
  error?: string;
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function startOfMonday(value: Date) {
  const day = value.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function addMonths(value: Date, amount: number) {
  const next = new Date(value);
  next.setUTCMonth(next.getUTCMonth() + amount);
  return next;
}

function getWeekDays(weekStartKey: string) {
  const monday = startOfMonday(parseDateKey(weekStartKey));
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(monday, index);
    return {
      label: WEEKDAY_LABELS[index],
      dateKey: toDateKey(day),
      dateLabel: day.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
    };
  });
}

function getCurrentWeekStartKey() {
  return toDateKey(startOfMonday(new Date()));
}

function getMaxWeekStartKey() {
  const start = startOfMonday(new Date());
  return toDateKey(startOfMonday(addMonths(start, 3)));
}

function normalizeWeekStartKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return getCurrentWeekStartKey();
  }

  return toDateKey(startOfMonday(parseDateKey(value)));
}

function buildEmptyMatrix(weekStartKey: string): WeeklyAssignmentsByDate {
  const days = getWeekDays(weekStartKey);
  const matrix: WeeklyAssignmentsByDate = {};

  for (const day of days) {
    matrix[day.dateKey] = {};
  }

  return matrix;
}

function roleLabel(person: WeeklyMatrixPerson) {
  if (person.isLeader) {
    return "Chef";
  }

  if (person.isSubleader) {
    return "Adjoint";
  }

  return "Agent";
}

function getRoleBadgeClass(person: WeeklyMatrixPerson) {
  if (person.isLeader) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  if (person.isSubleader) {
    return "border-sky-300 bg-sky-50 text-sky-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function statusLabel(status: "draft" | "published" | "archived" | null) {
  if (status === "published") {
    return "Publie";
  }

  if (status === "archived") {
    return "Archive";
  }

  if (status === "draft") {
    return "Brouillon";
  }

  return "Aucun";
}

function statusClass(status: "draft" | "published" | "archived" | null) {
  if (status === "published") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (status === "archived") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  if (status === "draft") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-white text-slate-500";
}

export function WeeklyWorkScheduleBoard({
  agencyName,
  services,
  users,
  posts,
  initialServiceId,
  initialWeekStart,
  editable = true,
  enforcePlanningWindow = true,
}: WeeklyWorkScheduleBoardProps) {
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [status, setStatus] = useState<WeeklyStatus>("draft");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [matrix, setMatrix] = useState<WeeklyAssignmentsByDate>(() =>
    buildEmptyMatrix(initialWeekStart)
  );
  const [dayStatuses, setDayStatuses] = useState<
    Record<string, "draft" | "published" | "archived" | null>
  >({});
  const [dialogState, setDialogState] = useState<{
    dateKey: string;
    postId: string;
  } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<
    "agent" | "leader" | "subleader"
  >("agent");
  const [copyFromDay, setCopyFromDay] = useState("");
  const [copyToDay, setCopyToDay] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const currentWeekStart = getCurrentWeekStartKey();
  const maxWeekStart = getMaxWeekStartKey();

  const userOptions = useMemo(() => {
    return users.map(user => ({
      value: user.id,
      label: user.fullName,
      keywords: [user.username],
    }));
  }, [users]);

  //   Print week schedule
  const onPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `planning-${services.find(s => s.id === serviceId)?.name || "service"}-${weekStart}`,
  });

  const normalizedCopyFromDay =
    weekDays.find(day => day.dateKey === copyFromDay)?.dateKey ||
    weekDays[0]?.dateKey ||
    "";
  const normalizedCopyToDay =
    weekDays.find(day => day.dateKey === copyToDay)?.dateKey ||
    weekDays[1]?.dateKey ||
    weekDays[0]?.dateKey ||
    "";

  function applyWeekStart(nextWeekStart: string) {
    const normalized = normalizeWeekStartKey(nextWeekStart);
    setWeekStart(normalized);
    setMatrix(buildEmptyMatrix(normalized));
    setDayStatuses({});
  }

  useEffect(() => {
    if (!serviceId || !weekStart) {
      return;
    }

    let mounted = true;

    async function loadWeek() {
      setLoading(true);

      const params = new URLSearchParams({
        serviceId,
        weekStart,
      });

      const response = await fetch(
        `/api/work-schedules/weekly?${params.toString()}`
      );
      const payload = (await response
        .json()
        .catch(() => null)) as WeeklyReadPayload | null;

      if (!mounted) {
        return;
      }

      if (!response.ok) {
        toast.error(payload?.error || "Impossible de charger la semaine.");
        setLoading(false);
        return;
      }

      const nextMatrix = buildEmptyMatrix(weekStart);
      const nextStatuses: Record<
        string,
        "draft" | "published" | "archived" | null
      > = {};

      for (const day of payload?.days || []) {
        nextStatuses[day.date] = day.schedule?.status ?? null;

        for (const assignment of day.schedule?.assignments || []) {
          const target = (nextMatrix[day.date] ||= {});
          const existing = target[assignment.postId] || [];
          target[assignment.postId] = [
            ...existing,
            {
              userId: assignment.userId,
              fullName: assignment.user.fullName,
              isLeader: assignment.isLeader,
              isSubleader: assignment.isSubleader,
            },
          ];
        }
      }

      setMatrix(nextMatrix);
      setDayStatuses(nextStatuses);
      setLoading(false);
    }

    void loadWeek();

    return () => {
      mounted = false;
    };
  }, [serviceId, weekStart]);

  function updateWeekByOffset(offset: number) {
    const monday = startOfMonday(parseDateKey(weekStart));
    const next = addDays(monday, offset * 7);
    const nextKey = toDateKey(next);

    if (enforcePlanningWindow) {
      if (nextKey < currentWeekStart || nextKey > maxWeekStart) {
        toast.error("La navigation est limitee a la fenetre de planification.");
        return;
      }
    }

    applyWeekStart(nextKey);
  }

  function openAddDialog(dateKey: string, postId: string) {
    setDialogState({ dateKey, postId });
    setSelectedUserId("");
    setSelectedRole("agent");
  }

  function removePerson(dateKey: string, postId: string, userId: string) {
    setMatrix(current => {
      const dayMap = current[dateKey] || {};
      const nextCell = (dayMap[postId] || []).filter(
        person => person.userId !== userId
      );

      return {
        ...current,
        [dateKey]: {
          ...dayMap,
          [postId]: nextCell,
        },
      };
    });
  }

  function duplicateDayAssignments() {
    if (!normalizedCopyFromDay || !normalizedCopyToDay) {
      toast.error("Selectionnez le jour source et le jour destination.");
      return;
    }

    if (normalizedCopyFromDay === normalizedCopyToDay) {
      toast.error("La destination doit etre differente du jour source.");
      return;
    }

    setMatrix(current => {
      const sourceDayMap = current[normalizedCopyFromDay] || {};
      const duplicatedDayMap: Record<string, WeeklyMatrixPerson[]> = {};

      for (const post of posts) {
        duplicatedDayMap[post.id] = (sourceDayMap[post.id] || []).map(
          person => ({
            ...person,
          })
        );
      }

      return {
        ...current,
        [normalizedCopyToDay]: duplicatedDayMap,
      };
    });

    toast.success("Affectations du jour dupliquees.");
  }

  function onConfirmAddPerson() {
    if (!dialogState) {
      return;
    }

    if (!selectedUserId) {
      toast.error("Selectionnez un personnel.");
      return;
    }

    const user = users.find(item => item.id === selectedUserId);
    if (!user) {
      toast.error("Personnel introuvable.");
      return;
    }

    const allPeopleForDay = Object.values(
      matrix[dialogState.dateKey] || {}
    ).flat();
    const alreadyAssigned = allPeopleForDay.some(
      person => person.userId === selectedUserId
    );

    if (alreadyAssigned) {
      toast.error("Ce personnel est deja affecte sur cette journee.");
      return;
    }

    const person: WeeklyMatrixPerson = {
      userId: user.id,
      fullName: user.fullName,
      isLeader: selectedRole === "leader",
      isSubleader: selectedRole === "subleader",
    };

    setMatrix(current => {
      const dayMap = current[dialogState.dateKey] || {};
      const nextCell = [...(dayMap[dialogState.postId] || []), person];

      return {
        ...current,
        [dialogState.dateKey]: {
          ...dayMap,
          [dialogState.postId]: nextCell,
        },
      };
    });

    setDialogState(null);
  }

  async function onSubmitWeekly() {
    if (!editable) {
      return;
    }

    if (!serviceId || !weekStart) {
      toast.error("Service et semaine obligatoires.");
      return;
    }

    setSaving(true);

    const assignmentsByDate: Record<
      string,
      Array<{
        userId: string;
        postId: string;
        isLeader: boolean;
        isSubleader: boolean;
      }>
    > = {};

    for (const day of weekDays) {
      const dayMap = matrix[day.dateKey] || {};
      assignmentsByDate[day.dateKey] = Object.entries(dayMap).flatMap(
        ([postId, people]) =>
          people.map(person => ({
            userId: person.userId,
            postId,
            isLeader: person.isLeader,
            isSubleader: person.isSubleader,
          }))
      );
    }

    const response = await fetch("/api/work-schedules/weekly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        weekStart,
        status,
        assignmentsByDate,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      result?: {
        createdDays: string[];
        updatedDays: string[];
        skippedDays: Array<{ date: string; reason: string }>;
      };
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible d'enregistrer la semaine.");
      setSaving(false);
      return;
    }

    const created = payload?.result?.createdDays.length ?? 0;
    const updated = payload?.result?.updatedDays.length ?? 0;
    const skipped = payload?.result?.skippedDays.length ?? 0;

    toast.success(
      `Semaine enregistree. Crees: ${created}, updates: ${updated}, ignores: ${skipped}.`
    );

    setSaving(false);

    if (serviceId && weekStart) {
      const params = new URLSearchParams({
        serviceId,
        weekStart,
      });
      const refresh = await fetch(
        `/api/work-schedules/weekly?${params.toString()}`
      );
      const refreshPayload = (await refresh
        .json()
        .catch(() => null)) as WeeklyReadPayload | null;

      if (refresh.ok) {
        const nextMatrix = buildEmptyMatrix(weekStart);
        const nextStatuses: Record<
          string,
          "draft" | "published" | "archived" | null
        > = {};

        for (const day of refreshPayload?.days || []) {
          nextStatuses[day.date] = day.schedule?.status ?? null;

          for (const assignment of day.schedule?.assignments || []) {
            const target = (nextMatrix[day.date] ||= {});
            const existing = target[assignment.postId] || [];
            target[assignment.postId] = [
              ...existing,
              {
                userId: assignment.userId,
                fullName: assignment.user.fullName,
                isLeader: assignment.isLeader,
                isSubleader: assignment.isSubleader,
              },
            ];
          }
        }

        setMatrix(nextMatrix);
        setDayStatuses(nextStatuses);
      }
    }
  }

  const selectedServiceName =
    services.find(service => service.id === serviceId)?.name || "Service";

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700 mr-2">Service</span>
            <select
              value={serviceId}
              onChange={event => setServiceId(event.target.value)}
              className="min-w-52 border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Selectionner</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700 mr-2">
              Debut de semaine
            </span>
            <input
              type="date"
              value={weekStart}
              min={enforcePlanningWindow ? currentWeekStart : undefined}
              max={enforcePlanningWindow ? maxWeekStart : undefined}
              onChange={event => applyWeekStart(event.target.value)}
              className="border border-slate-300 bg-white px-3 py-2"
            />
          </label>

          {editable ? (
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 mr-2">
                Statut a appliquer
              </span>
              <select
                value={status}
                onChange={event =>
                  setStatus(event.target.value as WeeklyStatus)
                }
                className="border border-slate-300 bg-white px-3 py-2"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publie</option>
              </select>
            </label>
          ) : null}

          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => updateWeekByOffset(-1)}
            >
              - 1 semaine
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => updateWeekByOffset(1)}
            >
              + 1 semaine
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void onPrint()}
            >
              <Printer className="mr-2 size-4" />
              Imprimer
            </Button>
          </div>
        </div>

        {editable ? (
          <div className="flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-slate-50 p-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Copier du jour</span>
              <select
                value={normalizedCopyFromDay}
                onChange={event => setCopyFromDay(event.target.value)}
                className="border border-slate-300 bg-white px-3 py-2"
              >
                {weekDays.map(day => (
                  <option key={`copy-from-${day.dateKey}`} value={day.dateKey}>
                    {day.label} {day.dateLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Vers le jour</span>
              <select
                value={normalizedCopyToDay}
                onChange={event => setCopyToDay(event.target.value)}
                className="border border-slate-300 bg-white px-3 py-2"
              >
                {weekDays.map(day => (
                  <option key={`copy-to-${day.dateKey}`} value={day.dateKey}>
                    {day.label} {day.dateLabel}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              variant="outline"
              onClick={duplicateDayAssignments}
            >
              Dupliquer la journee
            </Button>
          </div>
        ) : null}

        <p className="text-xs text-slate-500">
          Semaine de {weekDays[0]?.dateLabel} a {weekDays[6]?.dateLabel}. Les
          jours passes sont ignores a l'enregistrement.
        </p>
      </section>

      <section className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-270 border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Poste / Jour
              </th>
              {weekDays.map(day => (
                <th
                  key={day.dateKey}
                  className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {day.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {day.dateLabel}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${statusClass(
                      dayStatuses[day.dateKey] ?? null
                    )}`}
                  >
                    {statusLabel(dayStatuses[day.dateKey] ?? null)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="align-top">
                <td className="sticky left-0 z-10 min-w-56 border-r border-t border-slate-200 bg-white px-3 py-3">
                  <p className="font-semibold text-slate-900">{post.name}</p>
                  <p className="text-xs text-slate-500">{post.code}</p>
                </td>

                {weekDays.map(day => {
                  const people = matrix[day.dateKey]?.[post.id] || [];

                  return (
                    <td
                      key={`${post.id}-${day.dateKey}`}
                      className="border-t border-slate-200 p-2"
                    >
                      <div className="min-h-20 space-y-2 rounded border border-slate-100 bg-slate-50 p-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{people.length} personne(s)</span>
                          {editable ? (
                            <button
                              type="button"
                              onClick={() =>
                                openAddDialog(day.dateKey, post.id)
                              }
                              className="inline-flex items-center rounded border border-teal-300 bg-teal-50 p-1 text-teal-700 hover:bg-teal-100"
                              aria-label={`Ajouter un personnel pour ${post.name} ${day.label}`}
                            >
                              <Plus className="size-3.5" />
                            </button>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          {people.length === 0 ? (
                            <p className="text-[11px] text-slate-400">
                              Aucune affectation
                            </p>
                          ) : (
                            people.map(person => (
                              <div
                                key={`${day.dateKey}-${post.id}-${person.userId}`}
                                className={`flex items-center justify-between gap-1 rounded border px-2 py-1 text-[11px] ${getRoleBadgeClass(
                                  person
                                )}`}
                              >
                                <span
                                  className="truncate"
                                  title={person.fullName}
                                >
                                  {person.fullName}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  {person.isLeader ? (
                                    <Crown className="size-3" />
                                  ) : null}
                                  {person.isSubleader ? (
                                    <Shield className="size-3" />
                                  ) : null}
                                  <span className="hidden print:inline">
                                    {roleLabel(person)}
                                  </span>
                                  {editable ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removePerson(
                                          day.dateKey,
                                          post.id,
                                          person.userId
                                        )
                                      }
                                      className="rounded p-0.5 text-slate-500 hover:bg-white hover:text-rose-600 print:hidden"
                                      aria-label={`Retirer ${person.fullName}`}
                                    >
                                      <X className="size-3" />
                                    </button>
                                  ) : null}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {editable ? (
        <div className="flex justify-end print:hidden">
          <Button
            type="button"
            onClick={() => void onSubmitWeekly()}
            disabled={saving || loading}
          >
            {saving ? "Enregistrement..." : "Enregistrer la semaine"}
          </Button>
        </div>
      ) : null}

      <div className="fixed -left-25000 top-0 w-280" aria-hidden>
        <div ref={printRef}>
          <WeeklyWorkSchedulePrintable
            agencyName={agencyName}
            serviceName={selectedServiceName}
            weekDays={weekDays}
            posts={posts}
            matrix={matrix}
          />
        </div>
      </div>

      {dialogState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 print:hidden">
          <div className="w-full max-w-sm rounded border border-slate-300 bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-900">
              Ajouter un personnel
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Selectionnez la personne et son role pour cette case.
            </p>

            <div className="mt-3 space-y-3">
              <div className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Personnel</span>
                <SearchableSelect
                  options={userOptions}
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  placeholder="Selectionner"
                  searchPlaceholder="Rechercher un personnel..."
                />
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Role</span>
                <select
                  value={selectedRole}
                  onChange={event =>
                    setSelectedRole(
                      event.target.value as "agent" | "leader" | "subleader"
                    )
                  }
                  className="w-full border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="agent">Agent</option>
                  <option value="leader">Chef</option>
                  <option value="subleader">Adjoint</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogState(null)}
              >
                Annuler
              </Button>
              <Button type="button" onClick={onConfirmAddPerson}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
