import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EvaluationsList } from "@/components/evaluation-management/evaluations-list";
import { getServerSession } from "@/lib/session";

type EvaluationsPageProps = {
  searchParams: Promise<{
    criteriaId?: string;
    from?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    to?: string;
  }>;
};

export default async function EvaluationsPage({
  searchParams,
}: EvaluationsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.role !== "admin") {
    redirect("/evaluations/new");
  }

  const params = await searchParams;
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "http";

  if (!host) {
    throw new Error("Host header is required to fetch evaluations.");
  }

  const apiParams = new URLSearchParams();

  if (params.q) {
    apiParams.set("q", params.q);
  }

  if (params.criteriaId) {
    apiParams.set("criteriaId", params.criteriaId);
  }

  if (params.from) {
    apiParams.set("from", params.from);
  }

  if (params.to) {
    apiParams.set("to", params.to);
  }

  if (params.page) {
    apiParams.set("page", params.page);
  }

  if (params.pageSize) {
    apiParams.set("pageSize", params.pageSize);
  }

  const response = await fetch(
    `${protocol}://${host}/api/evaluations${apiParams.size ? `?${apiParams.toString()}` : ""}`,
    {
      headers: {
        cookie: headerStore.get("cookie") || "",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les évaluations.");
  }

  const payload = (await response.json()) as {
    criteria: Array<{
      id: string;
      name: string;
      impact: "POSITIVE" | "NEGATIVE";
      defaultWeight: string;
    }>;
    evaluations: Array<{
      id: string;
      evaluationDate: string;
      weightOverride: string | null;
      notes: string | null;
      createdAt: string;
      user: {
        id: string;
        fullName: string;
        role:
          | "admin"
          | "leader_envoi"
          | "leader_piste"
          | "leader_retrait"
          | "agent"
          | "convoyeur";
        isActive: boolean;
      };
      criteria: {
        id: string;
        name: string;
        impact: "POSITIVE" | "NEGATIVE";
        defaultWeight: string;
        isActive: boolean;
      };
      recordedBy: {
        id: string;
        fullName: string;
        username: string;
      };
    }>;
    filters: {
      criteriaId: string;
      endDate: string;
      search: string;
      startDate: string;
    };
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };

  return (
    <EvaluationsList
      criteriaOptions={payload.criteria}
      evaluations={payload.evaluations}
      filters={{
        criteriaId: payload.filters.criteriaId,
        endDate: payload.filters.endDate,
        page: payload.pagination.page,
        pageSize: payload.pagination.pageSize,
        search: payload.filters.search,
        startDate: payload.filters.startDate,
      }}
      totalItems={payload.pagination.totalItems}
      totalPages={payload.pagination.totalPages}
    />
  );
}
