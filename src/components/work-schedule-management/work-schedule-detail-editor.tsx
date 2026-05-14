"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  WorkScheduleAssignmentRowState,
  WorkScheduleItem,
  WorkSchedulePostOption,
  WorkScheduleUserOption,
} from "./types";

type WorkScheduleDetailEditorProps = {
  schedule: WorkScheduleItem;
  users: WorkScheduleUserOption[];
  posts: WorkSchedulePostOption[];
};

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

function isPastSchedule(workDateIso: string) {
  const today = new Date().toISOString().slice(0, 10);
  return workDateIso.slice(0, 10) < today;
}

export function WorkScheduleDetailEditor({
  schedule,
  users,
  posts,
}: WorkScheduleDetailEditorProps) {
  const router = useRouter();
  const [assignmentRows, setAssignmentRows] = useState<
    WorkScheduleAssignmentRowState[]
  >(buildAssignmentRows(schedule.assignments));
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<
    WorkScheduleItem["status"] | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState(() => {
    const nextWeek = new Date(schedule.workDate);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    return nextWeek.toISOString().slice(0, 10);
  });

  const pastLocked = useMemo(
    () => isPastSchedule(schedule.workDate),
    [schedule.workDate]
  );

  const assignmentLocked = pastLocked || schedule.status === "archived";
  const todayIso = new Date().toISOString().slice(0, 10);
  const isFutureSchedule = schedule.workDate.slice(0, 10) > todayIso;

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

  async function onSaveAssignments() {
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
      `/api/work-schedules/${schedule.id}/assignments`,
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
    router.refresh();
  }

  async function onChangeStatus(status: WorkScheduleItem["status"]) {
    setUpdatingStatus(status);

    const response = await fetch(`/api/work-schedules/${schedule.id}`, {
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
    router.refresh();
  }

  async function onDuplicateSchedule() {
    if (!duplicateDate) {
      toast.error("Choisissez une nouvelle date pour la duplication.");
      return;
    }

    setDuplicating(true);

    const response = await fetch(
      `/api/work-schedules/${schedule.id}/duplicate`,
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

    if (payload?.schedule?.id) {
      router.push(`/work-schedules/${payload.schedule.id}`);
      return;
    }

    router.refresh();
  }

  async function onDeleteSchedule() {
    if (!isFutureSchedule) {
      toast.error("Seuls les plannings futurs peuvent etre supprimes.");
      return;
    }

    const confirmed = window.confirm(
      "Supprimer ce planning futur ? Cette action est irreversible."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const response = await fetch(`/api/work-schedules/${schedule.id}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de supprimer le planning.");
      setDeleting(false);
      return;
    }

    toast.success("Planning supprime.");
    router.push("/work-schedules/list");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {schedule.service.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {formatDate(schedule.workDate)} - {statusLabel(schedule.status)}
          </p>
          {pastLocked ? (
            <p className="mt-2 text-sm font-medium text-rose-700">
              Cette date est passee, le planning est en lecture seule.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {schedule.status !== "published" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void onChangeStatus("published")}
              disabled={
                updatingStatus === "published" || pastLocked || duplicating
              }
            >
              {updatingStatus === "published" ? "Publication..." : "Publier"}
            </Button>
          ) : null}

          {schedule.status !== "archived" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void onChangeStatus("archived")}
              disabled={
                updatingStatus === "archived" || pastLocked || duplicating
              }
            >
              {updatingStatus === "archived" ? "Archivage..." : "Archiver"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => void onChangeStatus("draft")}
            disabled={
              updatingStatus === "draft" ||
              pastLocked ||
              duplicating ||
              deleting
            }
          >
            {updatingStatus === "draft" ? "Retour..." : "Remettre en brouillon"}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => void onDeleteSchedule()}
            disabled={!isFutureSchedule || deleting || duplicating}
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>

      <section className="border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-900">Dupliquer ce planning</h3>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="space-y-1 text-sm md:min-w-52">
            <span className="font-medium text-slate-700">Nouvelle date</span>
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
          <h3 className="font-semibold text-slate-900">Affectations</h3>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setAssignmentRows(current => [...current, emptyRow()])
            }
            disabled={assignmentLocked}
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
                className="grid gap-3 border border-slate-200 bg-white p-3 lg:grid-cols-[1.4fr_1.2fr_0.7fr_0.7fr_0.7fr_auto] items-end"
              >
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Personnel</span>
                  <select
                    value={row.userId}
                    onChange={event =>
                      updateAssignmentRow(index, "userId", event.target.value)
                    }
                    className="w-full border border-slate-300 bg-white px-3 py-2"
                    disabled={assignmentLocked}
                  >
                    <option value="">Selectionner</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Poste</span>
                  <select
                    value={row.postId}
                    onChange={event =>
                      updateAssignmentRow(index, "postId", event.target.value)
                    }
                    className="w-full border border-slate-300 bg-white px-3 py-2"
                    disabled={assignmentLocked}
                  >
                    <option value="">Selectionner</option>
                    {posts.map(post => (
                      <option key={post.id} value={post.id}>
                        {post.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm border h-fit px-3 py-2 border-slate-300">
                  <span className="font-medium text-slate-700">Chef</span>
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
                    disabled={assignmentLocked}
                  />
                </label>

                <label className="space-y-1 text-sm border h-fit px-3 py-2 border-slate-300">
                  <span className="font-medium text-slate-700">Adjoint</span>
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
                    disabled={assignmentLocked}
                  />
                </label>

                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setAssignmentRows(current =>
                        current.filter((_, rowIndex) => rowIndex !== index)
                      )
                    }
                    disabled={assignmentLocked}
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
            disabled={savingAssignments || assignmentLocked}
          >
            {savingAssignments
              ? "Enregistrement..."
              : "Enregistrer les affectations"}
          </Button>
        </div>
      </section>
    </div>
  );
}
