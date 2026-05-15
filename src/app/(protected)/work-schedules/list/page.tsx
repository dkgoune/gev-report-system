import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkSchedulesListFilters } from "@/components/work-schedule-management/work-schedules-list-filters";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type WorkSchedulesListPageProps = {
  searchParams: Promise<{
    from?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    serviceId?: string;
    status?: string;
    to?: string;
  }>;
};

function normalizePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(value: string | undefined) {
  const allowed = new Set([10, 20, 50]);
  const parsed = Number(value);
  return allowed.has(parsed) ? parsed : 20;
}

function toDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(value: Date) {
  return value.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildQueryString(
  filters: {
    q: string;
    serviceId: string;
    status: string;
    from: string;
    to: string;
    pageSize: number;
  },
  page: number
) {
  const query = new URLSearchParams();

  if (filters.q) {
    query.set("q", filters.q);
  }
  if (filters.serviceId) {
    query.set("serviceId", filters.serviceId);
  }
  if (filters.status) {
    query.set("status", filters.status);
  }
  if (filters.from) {
    query.set("from", filters.from);
  }
  if (filters.to) {
    query.set("to", filters.to);
  }

  query.set("pageSize", String(filters.pageSize));
  query.set("page", String(page));

  return query.toString();
}

export default async function WorkSchedulesListPage({
  searchParams,
}: WorkSchedulesListPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (
    !hasPermission(
      session,
      "work_schedule_read",
      "work_schedule_create",
      "work_schedule_update",
      "work_schedule_delete"
    )
  ) {
    redirect("/");
  }

  const query = await searchParams;
  const filters = {
    q: (query.q || "").trim(),
    serviceId: (query.serviceId || "").trim(),
    status:
      query.status === "draft" ||
      query.status === "published" ||
      query.status === "archived"
        ? query.status
        : "",
    from: query.from || "",
    to: query.to || "",
    pageSize: normalizePageSize(query.pageSize),
  };

  const where: Record<string, unknown> = {
    agencyId: session.activeAgencyId,
    ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const fromDate = toDate(filters.from);
  const toDateValue = toDate(filters.to);

  if (fromDate || toDateValue) {
    where.workDate = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDateValue ? { lte: toDateValue } : {}),
    };
  }

  if (filters.q) {
    where.OR = [
      { service: { name: { contains: filters.q, mode: "insensitive" } } },
      { service: { code: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  const [totalItems, services] = await Promise.all([
    prisma.workSchedule.count({ where: where as never }),
    prisma.serviceDefinition.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / filters.pageSize), 1);
  const page = Math.min(normalizePage(query.page), totalPages);

  const schedules =
    totalItems > 0
      ? await prisma.workSchedule.findMany({
          where: where as never,
          orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * filters.pageSize,
          take: filters.pageSize,
          select: {
            id: true,
            workDate: true,
            status: true,
            service: {
              select: {
                name: true,
                code: true,
              },
            },
            _count: {
              select: {
                assignments: true,
              },
            },
          },
        })
      : [];

  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Liste des plannings
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Recherche avancee, filtres et pagination pour toutes les dates de
            travail.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/work-schedules/new">Nouveau</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/work-schedules">Vue hebdomadaire</Link>
          </Button>
        </div>
      </section>

      <WorkSchedulesListFilters>
        <input type="hidden" name="page" defaultValue={String(page)} />
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Recherche</span>
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Nom ou code service"
            className="w-full border border-slate-300 bg-white px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Service</span>
          <select
            name="serviceId"
            defaultValue={filters.serviceId}
            className="w-full border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Tous</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.code})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Statut</span>
          <select
            name="status"
            defaultValue={filters.status}
            className="w-full border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Tous</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publie</option>
            <option value="archived">Archive</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Du</span>
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            className="w-full border border-slate-300 bg-white px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Au</span>
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            className="w-full border border-slate-300 bg-white px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Par page</span>
          <select
            name="pageSize"
            defaultValue={String(filters.pageSize)}
            className="w-full border border-slate-300 bg-white px-3 py-2"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </WorkSchedulesListFilters>

      <section className="overflow-hidden rounded border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
          {totalItems} resultat(s) - page {page}/{totalPages}
        </div>

        {schedules.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-600">
            Aucun planning trouve.
          </p>
        ) : (
          <div className="divide-y divide-slate-200">
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {schedule.service.name} ({schedule.service.code})
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatDate(schedule.workDate)} - {schedule.status} -{" "}
                    {schedule._count.assignments} affectation(s)
                  </p>
                </div>

                <Button asChild variant="outline">
                  <Link href={`/work-schedules/${schedule.id}`}>Ouvrir</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex items-center justify-between">
        <div>
          {previousPage ? (
            <Button asChild variant="outline">
              <Link
                href={`/work-schedules/list?${buildQueryString(filters, previousPage)}`}
              >
                Page precedente
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              Page precedente
            </Button>
          )}
        </div>

        <div>
          {nextPage ? (
            <Button asChild variant="outline">
              <Link
                href={`/work-schedules/list?${buildQueryString(filters, nextPage)}`}
              >
                Page suivante
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              Page suivante
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
