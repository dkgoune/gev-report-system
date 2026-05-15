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

  if (!initialState.workScheduleId && payload.schedules.length > 0) {
    initialState.workScheduleId = payload.schedules[0].id;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Ajouter une signature de bordereau
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sélectionnez le planning, puis le signataire affecté, saisissez le
          numéro de bordereau, la date de signature si elle est connue et, si
          besoin, l'arrivée du bus.
        </p>
      </div>

      <SignatureForm
        schedules={payload.schedules}
        signers={payload.signers}
        signersBySchedule={payload.signersBySchedule}
        initialState={initialState}
        mode="create"
      />
    </div>
  );
}
