"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  WorkScheduleAssignmentRowState,
  WorkScheduleFormState,
  WorkScheduleItem,
  WorkSchedulePostOption,
  WorkScheduleServiceOption,
  WorkScheduleUserOption,
} from "./types";

type WorkSchedulesManagerProps = {
  initialSchedules: WorkScheduleItem[];
  initialServices: WorkScheduleServiceOption[];
  initialUsers: WorkScheduleUserOption[];
  initialPosts: WorkSchedulePostOption[];
};

const ATTENDANCE_OPTIONS: Array<
  WorkScheduleAssignmentRowState["attendanceStatus"]
> = ["scheduled", "present", "absent", "excused"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: WorkScheduleItem["status"]) {
  if (status === "published") {
    return "Publie";
  }

  if (status === "archived") {
    return "Archive";
  }

  return "Brouillon";
}

function statusClasses(status: WorkScheduleItem["status"]) {
  if (status === "published") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "archived") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-amber-100 text-amber-700";
}

function buildAssignmentRows(
  assignments: WorkScheduleItem["assignments"]
): WorkScheduleAssignmentRowState[] {
  return assignments.map(assignment => ({
    userId: assignment.userId,
    postId: assignment.postId,
    isLeader: assignment.isLeader,
    isSubleader: assignment.isSubleader,
    attendanceStatus: assignment.attendanceStatus,
  }));
}

function emptyRow(): WorkScheduleAssignmentRowState {
  return {
    userId: "",
    postId: "",
    isLeader: false,
    isSubleader: false,
    attendanceStatus: "scheduled",
  };
}

export function WorkSchedulesManager({
  initialSchedules,
  initialServices,
  initialUsers,
  initialPosts,
}: WorkSchedulesManagerProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    initialSchedules[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createState, setCreateState] = useState<WorkScheduleFormState>({
    serviceId: initialServices[0]?.id ?? "",
    workDate: "",
    status: "draft",
  });
  const [duplicateDate, setDuplicateDate] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<
    WorkScheduleItem["status"] | null
  >(null);
  const [duplicating, setDuplicating] = useState(false);
  const [assignmentRows, setAssignmentRows] = useState<
    WorkScheduleAssignmentRowState[]
  >(buildAssignmentRows(initialSchedules[0]?.assignments ?? []));

  const selectedSchedule = useMemo(() => {
    return (
      schedules.find(schedule => schedule.id === selectedScheduleId) ?? null
    );
  }, [schedules, selectedScheduleId]);

  useEffect(() => {
    function callback() {
      if (!selectedSchedule && schedules.length > 0) {
        setSelectedScheduleId(schedules[0].id);
        return;
      }

      if (selectedSchedule) {
        setAssignmentRows(buildAssignmentRows(selectedSchedule.assignments));
        setDuplicateDate(selectedSchedule.workDate.slice(0, 10));
      } else {
        setAssignmentRows([]);
        setDuplicateDate("");
      }
    }

    callback();
  }, [schedules, selectedSchedule]);

  async function loadSchedules(nextSelectedId?: string) {
    setLoadingSchedules(true);

    const response = await fetch("/api/work-schedules", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      schedules?: WorkScheduleItem[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les plannings.");
      setLoadingSchedules(false);
      return;
    }

    const nextSchedules = payload?.schedules || [];
    setSchedules(nextSchedules);

    if (nextSelectedId) {
      setSelectedScheduleId(nextSelectedId);
    } else if (nextSchedules[0]) {
      setSelectedScheduleId(nextSchedules[0].id);
    } else {
      setSelectedScheduleId("");
    }

    setLoadingSchedules(false);
  }

  const filteredSchedules = useMemo(() => {
    const term = search.trim().toLowerCase();

    return schedules.filter(schedule => {
      const matchesTerm =
        !term ||
        schedule.service.name.toLowerCase().includes(term) ||
        schedule.service.code.toLowerCase().includes(term) ||
        schedule.workDate.toLowerCase().includes(term);
      const matchesService =
        serviceFilter === "all" || schedule.service.id === serviceFilter;
      const matchesStatus =
        statusFilter === "all" || schedule.status === statusFilter;

      return matchesTerm && matchesService && matchesStatus;
    });
  }, [search, schedules, serviceFilter, statusFilter]);

  function onCreateChange(field: keyof WorkScheduleFormState, value: string) {
    setCreateState(current => ({
      ...current,
      [field]: value,
    }));
  }

  function updateAssignmentRow(
    index: number,
    field: keyof WorkScheduleAssignmentRowState,
    value: string | boolean
  ) {
    setAssignmentRows(current =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  async function onCreateSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);

    const response = await fetch("/api/work-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      schedule?: { id: string };
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de creer le planning.");
      setCreating(false);
      return;
    }

    toast.success("Planning cree.");
    setCreating(false);
    setCreateState(current => ({
      ...current,
      workDate: "",
      status: "draft",
    }));
    await loadSchedules(payload?.schedule?.id);
  }

  async function onSaveAssignments() {
    if (!selectedSchedule) {
      return;
    }

    const invalidRow = assignmentRows.find(
      row => Boolean(row.userId) !== Boolean(row.postId)
    );

    if (invalidRow) {
      toast.error(
        "Chaque affectation doit contenir un personnel et un poste complets."
      );
      return;
    }

    setSavingAssignments(true);

    const response = await fetch(
      `/api/work-schedules/${selectedSchedule.id}/assignments`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: assignmentRows.filter(row => row.userId && row.postId),
        }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error || "Impossible de mettre a jour les affectations."
      );
      setSavingAssignments(false);
      return;
    }

    toast.success("Affectations mises a jour.");
    setSavingAssignments(false);
    await loadSchedules(selectedSchedule.id);
  }

  async function onChangeStatus(status: WorkScheduleItem["status"]) {
    if (!selectedSchedule) {
      return;
    }

    setUpdatingStatus(status);

    const response = await fetch(`/api/work-schedules/${selectedSchedule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de mettre a jour le statut.");
      setUpdatingStatus(null);
      return;
    }

    toast.success("Statut du planning mis a jour.");
    setUpdatingStatus(null);
    await loadSchedules(selectedSchedule.id);
  }

  async function onDuplicateSchedule() {
    if (!selectedSchedule) {
      return;
    }

    if (!duplicateDate) {
      toast.error("Choisissez une nouvelle date pour la duplication.");
      return;
    }

    setDuplicating(true);

    const response = await fetch(
      `/api/work-schedules/${selectedSchedule.id}/duplicate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workDate: duplicateDate }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      schedule?: { id: string };
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de dupliquer le planning.");
      setDuplicating(false);
      return;
    }

    toast.success("Planning duplique.");
    setDuplicating(false);
    await loadSchedules(payload?.schedule?.id);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Planning des services
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Creez un planning, affectez les personnels et faites evoluer le
            statut du service depuis une seule vue.
          </p>
        </div>

        <div className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            {schedules.length} planning(s)
          </p>
          <p>Disponibles dans l'agence active.</p>
        </div>
      </div>

      <section className="grid gap-4 border border-slate-200 bg-slate-50 p-4 lg:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Recherche</span>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full border border-slate-300 bg-white px-3 py-2"
            placeholder="Service, code, date"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Service</span>
          <select
            value={serviceFilter}
            onChange={event => setServiceFilter(event.target.value)}
            className="w-full border border-slate-300 bg-white px-3 py-2"
          >
            <option value="all">Tous les services</option>
            {initialServices.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.code})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Statut</span>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className="w-full border border-slate-300 bg-white px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publie</option>
            <option value="archived">Archive</option>
          </select>
        </label>

        <div className="flex items-end justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadSchedules(selectedScheduleId || undefined)}
            disabled={loadingSchedules}
          >
            {loadingSchedules ? "Chargement..." : "Actualiser"}
          </Button>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Nouveau planning
            </h3>

            <form
              className="mt-4 grid gap-4 md:grid-cols-3"
              onSubmit={onCreateSchedule}
            >
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Service</span>
                <select
                  value={createState.serviceId}
                  onChange={event =>
                    onCreateChange("serviceId", event.target.value)
                  }
                  className="w-full border border-slate-300 bg-white px-3 py-2"
                  required
                >
                  <option value="">Selectionner un service</option>
                  {initialServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  Date de travail
                </span>
                <input
                  type="date"
                  value={createState.workDate}
                  onChange={event =>
                    onCreateChange("workDate", event.target.value)
                  }
                  className="w-full border border-slate-300 bg-white px-3 py-2"
                  required
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Statut</span>
                <select
                  value={createState.status}
                  onChange={event =>
                    onCreateChange("status", event.target.value)
                  }
                  className="w-full border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publie</option>
                </select>
              </label>

              <div className="md:col-span-3">
                <Button type="submit" disabled={creating}>
                  {creating ? "Creation..." : "Creer le planning"}
                </Button>
              </div>
            </form>
          </section>

          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Plannings existants
              </h3>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredSchedules.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-600">
                  Aucun planning trouve.
                </p>
              ) : (
                filteredSchedules.map(schedule => {
                  const isSelected = schedule.id === selectedScheduleId;
                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      className={`flex w-full flex-col gap-3 px-4 py-4 text-left transition ${
                        isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedScheduleId(schedule.id)}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {schedule.service.name}
                            <span className="text-slate-500">
                              {" "}
                              ({schedule.service.code})
                            </span>
                          </p>
                          <p className="text-sm text-slate-600">
                            {formatDate(schedule.workDate)} -{" "}
                            {schedule.assignments.length} affectation(s)
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses(schedule.status)}`}
                        >
                          {statusLabel(schedule.status)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="border border-slate-200 bg-white p-4">
          {selectedSchedule ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {selectedSchedule.service.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(selectedSchedule.workDate)} -{" "}
                    {statusLabel(selectedSchedule.status)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedSchedule.status !== "published" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void onChangeStatus("published")}
                      disabled={updatingStatus === "published" || duplicating}
                    >
                      {updatingStatus === "published"
                        ? "Publication..."
                        : "Publier"}
                    </Button>
                  ) : null}

                  {selectedSchedule.status !== "archived" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void onChangeStatus("archived")}
                      disabled={updatingStatus === "archived" || duplicating}
                    >
                      {updatingStatus === "archived"
                        ? "Archivage..."
                        : "Archiver"}
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onChangeStatus("draft")}
                    disabled={updatingStatus === "draft" || duplicating}
                  >
                    {updatingStatus === "draft"
                      ? "Retour..."
                      : "Remettre en brouillon"}
                  </Button>
                </div>
              </div>

              <section className="border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-semibold text-slate-900">
                  Dupliquer ce planning
                </h4>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
                  <label className="space-y-1 text-sm md:min-w-52">
                    <span className="font-medium text-slate-700">
                      Nouvelle date
                    </span>
                    <input
                      type="date"
                      value={duplicateDate}
                      onChange={event => setDuplicateDate(event.target.value)}
                      className="w-full border border-slate-300 bg-white px-3 py-2"
                    />
                  </label>

                  <Button
                    type="button"
                    onClick={() => void onDuplicateSchedule()}
                    disabled={duplicating}
                  >
                    {duplicating ? "Duplication..." : "Dupliquer"}
                  </Button>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Affectations</h4>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setAssignmentRows(current => [...current, emptyRow()])
                    }
                    disabled={selectedSchedule.status === "archived"}
                  >
                    Ajouter une ligne
                  </Button>
                </div>

                <div className="space-y-3">
                  {assignmentRows.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      Aucune affectation pour ce planning.
                    </p>
                  ) : (
                    assignmentRows.map((row, index) => (
                      <div
                        key={`${index}-${row.userId}-${row.postId}`}
                        className="grid gap-3 border border-slate-200 bg-white p-3 lg:grid-cols-[1.4fr_1.2fr_0.7fr_0.7fr_0.7fr_auto]"
                      >
                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">
                            Personnel
                          </span>
                          <select
                            value={row.userId}
                            onChange={event =>
                              updateAssignmentRow(
                                index,
                                "userId",
                                event.target.value
                              )
                            }
                            className="w-full border border-slate-300 bg-white px-3 py-2"
                            disabled={selectedSchedule.status === "archived"}
                          >
                            <option value="">Selectionner</option>
                            {initialUsers.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.fullName} ({user.username})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">
                            Poste
                          </span>
                          <select
                            value={row.postId}
                            onChange={event =>
                              updateAssignmentRow(
                                index,
                                "postId",
                                event.target.value
                              )
                            }
                            className="w-full border border-slate-300 bg-white px-3 py-2"
                            disabled={selectedSchedule.status === "archived"}
                          >
                            <option value="">Selectionner</option>
                            {initialPosts.map(post => (
                              <option key={post.id} value={post.id}>
                                {post.name} ({post.code})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">
                            Chef
                          </span>
                          <input
                            type="checkbox"
                            checked={row.isLeader}
                            onChange={event =>
                              updateAssignmentRow(
                                index,
                                "isLeader",
                                event.target.checked
                              )
                            }
                            className="ml-2 size-4"
                            disabled={selectedSchedule.status === "archived"}
                          />
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">
                            Adjoint
                          </span>
                          <input
                            type="checkbox"
                            checked={row.isSubleader}
                            onChange={event =>
                              updateAssignmentRow(
                                index,
                                "isSubleader",
                                event.target.checked
                              )
                            }
                            className="ml-2 size-4"
                            disabled={selectedSchedule.status === "archived"}
                          />
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">
                            Presence
                          </span>
                          <select
                            value={row.attendanceStatus}
                            onChange={event =>
                              updateAssignmentRow(
                                index,
                                "attendanceStatus",
                                event.target.value
                              )
                            }
                            className="w-full border border-slate-300 bg-white px-3 py-2"
                            disabled={selectedSchedule.status === "archived"}
                          >
                            {ATTENDANCE_OPTIONS.map(option => (
                              <option key={option} value={option}>
                                {option === "scheduled"
                                  ? "Planifie"
                                  : option === "present"
                                    ? "Present"
                                    : option === "absent"
                                      ? "Absent"
                                      : "Excuse"}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setAssignmentRows(current =>
                                current.filter(
                                  (_, rowIndex) => rowIndex !== index
                                )
                              )
                            }
                            disabled={selectedSchedule.status === "archived"}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => void onSaveAssignments()}
                    disabled={
                      savingAssignments ||
                      selectedSchedule.status === "archived"
                    }
                  >
                    {savingAssignments
                      ? "Enregistrement..."
                      : "Enregistrer les affectations"}
                  </Button>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex min-h-80 items-center justify-center text-sm text-slate-600">
              Selectionnez un planning pour gerer ses affectations.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
