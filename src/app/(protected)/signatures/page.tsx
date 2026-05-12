import { redirect } from "next/navigation";
import { SignaturesList } from "@/components/signature-management/signatures-list";
import { listSignatureLogs } from "@/lib/signature-logs";
import { getServerSession } from "@/lib/session";

type SignaturesPageProps = {
  searchParams: Promise<{
    from?: string;
    groupId?: string;
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

  const payload = await listSignatureLogs(session, await searchParams);

  return (
    <SignaturesList
      signers={payload.signers}
      filters={payload.filters}
      groups={payload.groups}
      signatures={payload.signatures}
      summary={payload.summary}
      totalItems={payload.pagination.totalItems}
      totalPages={payload.pagination.totalPages}
    />
  );
}
