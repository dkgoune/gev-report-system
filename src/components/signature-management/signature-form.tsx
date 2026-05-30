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
} from "./types";

type SignatureFormProps = {
  signers: SignatureAgentOption[];
  initialState: SignatureFormState;
  mode: "create" | "edit";
  signatureId?: string;
};

export function SignatureForm({
  signers,
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
        label: `${signer.fullName} (@${signer.username})`,
        keywords: [signer.username, signer.fullName],
      })),
    [signers]
  );

  const [formState, setFormState] = useState<SignatureFormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    setSubmitting(false);
    
    // Redirect to list after create/edit
    router.push("/signatures");
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
    <section className="border border-slate-200 bg-slate-50 p-6 rounded-lg shadow-xs max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          {mode === "create" ? "Enregistrer une nouvelle signature" : "Modifier la signature"}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Indiquez le personnel ayant effectué des signatures de bordereaux opérationnels, le nombre exact réalisé et la date/heure de validation.
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 text-sm sm:col-span-2">
            <span className="font-semibold text-slate-700 block">Signataire *</span>
            <SearchableSelect
              value={formState.userId}
              options={signerOptions}
              placeholder="Sélectionner un signataire"
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

          <label className="space-y-2 text-sm block">
            <span className="font-semibold text-slate-700 block">Nombre de signatures *</span>
            <input
              type="number"
              min={1}
              value={formState.signatureCount}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  signatureCount: Number(event.target.value) || 1,
                }))
              }
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Ex. 5"
              required
            />
          </label>

          <div className="space-y-2 text-sm block">
            <span className="font-semibold text-slate-700 block">Date et heure *</span>
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
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          <Button type="submit" disabled={submitting || deleting}>
            {submitting
              ? "Enregistrement..."
              : mode === "create"
                ? "Enregistrer la signature"
                : "Enregistrer les modifications"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormState(defaultState)}
            disabled={submitting || deleting}
          >
            Réinitialiser
          </Button>

          <div className="flex-1 min-w-4" />

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
