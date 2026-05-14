import { redirect } from "next/navigation";
import { SignaturesList } from "@/components/signature-management/signatures-list";
import { getServerSession } from "@/lib/session";
import { listSignatureLogs } from "@/lib/signature-logs";

type SignaturesPageProps = {
  searchParams: Promise<{
    from?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    to?: string;
    userId?: string;
    workScheduleId?: string;
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
      schedules={payload.schedules}
      signatures={payload.signatures}
      summary={payload.summary}
      totalItems={payload.pagination.totalItems}
      totalPages={payload.pagination.totalPages}
    />
  );
}
