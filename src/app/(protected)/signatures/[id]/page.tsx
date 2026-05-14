import { notFound, redirect } from "next/navigation";
import { SignatureForm } from "@/components/signature-management/signature-form";
import type { SignatureFormState } from "@/components/signature-management/types";
import {
  formatSignatureDateTimeInput,
  getSignatureLogById,
} from "@/lib/signature-logs";
import { getServerSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type SignatureDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SignatureDetailPage({
  params,
}: SignatureDetailPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const payload = await getSignatureLogById(session, id);

  if (!payload) {
    notFound();
  }

  const initialState = {
    busArrivalTime: payload.signature.busArrivalTime
      ? formatSignatureDateTimeInput(payload.signature.busArrivalTime)
      : "",
    signedAt: formatSignatureDateTimeInput(payload.signature.signedAt),
    slipNumber: payload.signature.slipNumber,
    userId: payload.signature.user.id,
    workScheduleId: payload.signature.workSchedule.id,
  } satisfies SignatureFormState;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Modifier une signature de bordereau
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Ajustez le planning, le signataire affecté, la date réelle de
            signature si elle est connue, ou l'arrivée du bus, puis enregistrez
            vos modifications.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/signatures">Voir la liste</Link>
          </Button>
        </div>
      </div>

      <SignatureForm
        schedules={payload.schedules}
        signers={payload.signers}
        signersBySchedule={payload.signersBySchedule}
        initialState={initialState}
        mode="edit"
        signatureId={payload.signature.id}
      />
    </div>
  );
}
