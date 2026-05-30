import { redirect } from "next/navigation";
import { SignatureForm } from "@/components/signature-management/signature-form";
import type { SignatureFormState } from "@/components/signature-management/types";
import {
  getDefaultSignatureFormState,
  getSignatureLogFormOptions,
} from "@/lib/signature-logs";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export default async function NewSignaturePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "signature_create")) {
    redirect("/");
  }

  const payload = await getSignatureLogFormOptions(session);
  const initialState = getDefaultSignatureFormState() as SignatureFormState;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Enregistrer des signatures
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Enregistrez le nombre exact de signatures de bordereaux effectuées par un travailleur sur une date et heure spécifique.
        </p>
      </div>

      <SignatureForm
        signers={payload.signers}
        initialState={initialState}
        mode="create"
      />
    </div>
  );
}
