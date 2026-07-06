import { redirect } from "next/navigation";
import { SignaturesList } from "@/components/signature-management/signatures-list";
import { getServerSession } from "@/lib/session";
import { listSignatureLogs } from "@/lib/signature-logs";
import { hasPermission } from "@/lib/permissions";

type SignaturesPageProps = {
  searchParams: Promise<{
    from?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    to?: string;
    userId?: string;
  }>;
};

export default async function SignaturesPage({
  searchParams,
  }: SignaturesPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "signature_read")) {
    redirect("/");
  }

  const payload = await listSignatureLogs(session, await searchParams);
  const canUpdate = hasPermission(session, "signature_update");

  return (
    <SignaturesList
      filters={payload.filters}
      signers={payload.signers}
      signatures={payload.signatures}
      summary={payload.summary}
      totalItems={payload.pagination.totalItems}
      totalPages={payload.pagination.totalPages}
      canUpdate={canUpdate}
    />
  );
}
