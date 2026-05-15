"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type {
  SignatureAgentOption,
  SignatureFormState,
  SignatureScheduleOption,
} from "./types";

type SignatureFormProps = {
  schedules: SignatureScheduleOption[];
  signers: SignatureAgentOption[];
  signersBySchedule: Record<string, SignatureAgentOption[]>;
  initialState: SignatureFormState;
  mode: "create" | "edit";
  signatureId?: string;
};

export function SignatureForm({
  schedules,
  signers,
  signersBySchedule,
  initialState,
  mode,
  signatureId,
}: SignatureFormProps) {
  const router = useRouter();
  const defaultState = useMemo(() => initialState, [initialState]);
  const signerOptions = useMemo(
    () =>
      signers.map(signer => ({
        value: signer.id,
        label: `${signer.fullName}})`,
        keywords: [signer.username],
      })),
    [signers]
  );
  const scheduleOptions = useMemo(
    () =>
      schedules.map(schedule => ({
        value: schedule.id,
        label: `${new Date(schedule.workDate).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })} - ${schedule.serviceName}`,
        keywords: [schedule.serviceName, schedule.workDate],
      })),
    [schedules]
  );
  const [formState, setFormState] = useState<SignatureFormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const availableSignerOptions = useMemo(
    () =>
      (signersBySchedule[formState.workScheduleId] ?? []).map(signer => ({
        value: signer.id,
        label: `${signer.fullName}`,
        keywords: [signer.username],
      })),
    [formState.workScheduleId, signersBySchedule]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch(
      mode === "create" ? "/api/signatures" : `/api/signatures/${signatureId}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      signature?: { id: string };
    } | null;

    if (!response.ok || !payload?.signature) {
      toast.error(payload?.error || "Impossible d'enregistrer la signature.");
      setSubmitting(false);
      return;
    }

    toast.success(
      mode === "create" ? "Signature enregistrée." : "Signature mise à jour."
    );

    if (mode === "edit") {
      setSubmitting(false);
      router.refresh();
      return;
    }

    router.push(`/signatures/${payload.signature.id}`);
    router.refresh();
  }

  async function onDelete() {
    if (!signatureId) {
      return;
    }

    setDeleting(true);

    const response = await fetch(`/api/signatures/${signatureId}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de supprimer la signature.");
      setDeleting(false);
      return;
    }

    toast.success("Signature supprimée.");
    router.push("/signatures");
    router.refresh();
  }

  return (
    <section className="border border-slate-200 bg-slate-50 p-4">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Planning</span>
          <SearchableSelect
            value={formState.workScheduleId}
            options={scheduleOptions}
            placeholder="Choisir un planning"
            searchPlaceholder="Rechercher un planning"
            emptyMessage="Aucun planning correspondant."
            onValueChange={value =>
              setFormState(current => ({
                ...current,
                workScheduleId: value,
                userId: (signersBySchedule[value] ?? []).some(
                  signer => signer.id === current.userId
                )
                  ? current.userId
                  : "",
              }))
            }
          />
        </div>

        <div className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Signataire</span>
          <SearchableSelect
            value={formState.userId}
            options={
              formState.workScheduleId ? availableSignerOptions : signerOptions
            }
            placeholder="Choisir un signataire"
            searchPlaceholder="Rechercher un signataire"
            emptyMessage="Aucun signataire correspondant."
            onValueChange={value =>
              setFormState(current => ({
                ...current,
                userId: value,
              }))
            }
          />
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">
            Numéro de bordereau
          </span>
          <input
            type="text"
            value={formState.slipNumber}
            onChange={event =>
              setFormState(current => ({
                ...current,
                slipNumber: event.target.value,
              }))
            }
            className="w-full border border-slate-300 bg-white px-3 py-2"
            placeholder="Ex. BRD-2026-001"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">
            Date et heure de signature (optionnel)
          </span>
          <DateTimeInput
            value={formState.signedAt}
            onChange={value =>
              setFormState(current => ({
                ...current,
                signedAt: value,
              }))
            }
            placeholder="Sélectionner une date et une heure"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">
            Arrivée du bus (optionnel)
          </span>
          <DateTimeInput
            value={formState.busArrivalTime}
            onChange={value =>
              setFormState(current => ({
                ...current,
                busArrivalTime: value,
              }))
            }
            placeholder="Sélectionner une date et une heure"
          />
        </label>

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" disabled={submitting || deleting}>
            {submitting
              ? "Enregistrement..."
              : mode === "create"
                ? "Enregistrer la signature"
                : "Mettre à jour la signature"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormState(defaultState)}
            disabled={submitting || deleting}
          >
            Réinitialiser
          </Button>

          <div className="flex-1 flex-wrap gap-2" />

          {mode === "edit" ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={deleting || submitting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
