import Link from "next/link";
import { redirect } from "next/navigation";
import { WeeklyWorkScheduleBoard } from "@/components/work-schedule-management/weekly-work-schedule-board";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { listScopedUsers } from "@/lib/user-scope";
import { formatScheduleDateKey, getMondayOfWeek } from "@/lib/work-schedules";
import { hasPermission } from "@/lib/permissions";

type NewWorkSchedulePageProps = {
  searchParams: Promise<{
    serviceId?: string;
    weekStart?: string;
  }>;
};

export default async function NewWorkSchedulePage({
  searchParams,
}: NewWorkSchedulePageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasPermission(session, "work_schedule_create")) {
    redirect("/");
  }

  const query = await searchParams;

  const [agency, services, users, posts] = await Promise.all([
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
    listScopedUsers(session),
    prisma.workPost.findMany({
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
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Planification hebdomadaire
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Grille hebdomadaire par poste et par jour pour assigner les equipes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/work-schedules">Vue d'ensemble</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/work-schedules/list">Liste</Link>
          </Button>
        </div>
      </section>

      <section className="">
        <WeeklyWorkScheduleBoard
          agencyName={agency?.name || "Agence"}
          services={services}
          users={users}
          posts={posts}
          initialServiceId={initialServiceId}
          initialWeekStart={initialWeekStart}
          editable
          enforcePlanningWindow
        />
      </section>
    </div>
  );
}
