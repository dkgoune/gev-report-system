import Link from "next/link";
import { redirect } from "next/navigation";
import { WeeklyWorkScheduleBoard } from "@/components/work-schedule-management/weekly-work-schedule-board";
import { Button } from "@/components/ui/button";
import { canScheduleWork } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { formatScheduleDateKey, getMondayOfWeek } from "@/lib/work-schedules";

type WeeklyViewPageProps = {
  searchParams: Promise<{
    serviceId?: string;
    weekStart?: string;
  }>;
};

export default async function WeeklyViewPage({
  searchParams,
}: WeeklyViewPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canScheduleWork(session)) {
    redirect("/");
  }

  const query = await searchParams;

  const [agency, services, posts] = await Promise.all([
    prisma.agency.findUnique({
      where: {
        id: session.activeAgencyId,
      },
      select: {
        name: true,
      },
    }),
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
    prisma.workPost.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      orderBy: [{ isActive: "desc" }, { order: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
  ]);

  const initialServiceId =
    services.find(service => service.id === query.serviceId)?.id ||
    services[0]?.id ||
    "";

  const initialWeekStart =
    query.weekStart && /^\d{4}-\d{2}-\d{2}$/.test(query.weekStart)
      ? formatScheduleDateKey(
          getMondayOfWeek(new Date(`${query.weekStart}T00:00:00.000Z`))
        )
      : formatScheduleDateKey(getMondayOfWeek(new Date()));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Vue hebdomadaire
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Matrice imprimable par poste (lignes) et jours de la semaine
            (colonnes).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/work-schedules">Semaines</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/work-schedules/new">Editer une semaine</Link>
          </Button>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <WeeklyWorkScheduleBoard
          agencyName={agency?.name || "Agence"}
          services={services}
          users={[]}
          posts={posts}
          initialServiceId={initialServiceId}
          initialWeekStart={initialWeekStart}
          editable={false}
          enforcePlanningWindow={false}
        />
      </section>
    </div>
  );
}
