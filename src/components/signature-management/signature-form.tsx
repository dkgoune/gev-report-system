"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimeInput } from "@/components/ui/date-time-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel } from "@/components/user-management/constants";
import type { SignatureAgentOption, SignatureFormState } from "./types";

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
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === "create"
              ? "Ajouter une signature"
              : "Modifier la signature"}
          </h3>
          <p className="text-sm text-slate-600">
            Enregistrez un bordereau signé par un agent, un chef de service ou
            un administrateur, puis complétez l'arrivée du bus si elle est
            connue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/signatures">Voir la liste</Link>
          </Button>
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
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Signataire</span>
          <Select
            value={formState.userId}
            onValueChange={value =>
              setFormState(current => ({
                ...current,
                userId: value,
              }))
            }
          >
            <SelectTrigger className="w-full rounded-md bg-white text-sm">
              <SelectValue placeholder="Choisir un signataire" />
            </SelectTrigger>
            <SelectContent>
              {signers.map(signer => (
                <SelectItem key={signer.id} value={signer.id}>
                  {signer.fullName} ({roleLabel(signer.role)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>
      </form>
    </section>
  );
}
