import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { canScheduleWork } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  formatScheduleDateKey,
  getMondayOfWeek,
  getSundayOfWeek,
} from "@/lib/work-schedules";
import { getServerSession } from "@/lib/session";

type WeeklyCard = {
  key: string;
  service: {
    id: string;
    name: string;
    code: string;
  };
  weekStart: string;
  weekEnd: string;
  coveredDays: number;
  totalAssignments: number;
  draftCount: number;
  publishedCount: number;
  archivedCount: number;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusSummary(card: WeeklyCard) {
  if (
    card.publishedCount > 0 &&
    card.draftCount === 0 &&
    card.archivedCount === 0
  ) {
    return "Publiee";
  }

  if (card.archivedCount === 7) {
    return "Archivee";
  }

  if (card.coveredDays === 0) {
    return "Vide";
  }

  return "Mixte";
}

export default async function WorkSchedulesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canScheduleWork(session)) {
    redirect("/");
  }

  const schedules = await prisma.workSchedule.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    take: 700,
    select: {
      id: true,
      workDate: true,
      status: true,
      service: {
        select: {
          id: true,
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
  });

  const grouped = new Map<string, WeeklyCard>();

  for (const schedule of schedules) {
    const monday = getMondayOfWeek(schedule.workDate);
    const sunday = getSundayOfWeek(schedule.workDate);
    const weekStart = formatScheduleDateKey(monday);
    const weekEnd = formatScheduleDateKey(sunday);
    const key = `${schedule.service.id}:${weekStart}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        service: schedule.service,
        weekStart,
        weekEnd,
        coveredDays: 0,
        totalAssignments: 0,
        draftCount: 0,
        publishedCount: 0,
        archivedCount: 0,
      });
    }

    const current = grouped.get(key)!;
    current.coveredDays += 1;
    current.totalAssignments += schedule._count.assignments;

    if (schedule.status === "published") {
      current.publishedCount += 1;
    } else if (schedule.status === "archived") {
      current.archivedCount += 1;
    } else {
      current.draftCount += 1;
    }
  }

  const weeklyCards = Array.from(grouped.values())
    .sort((a, b) => {
      if (a.weekStart !== b.weekStart) {
        return a.weekStart < b.weekStart ? 1 : -1;
      }

      return a.service.name.localeCompare(b.service.name, "fr-FR");
    })
    .slice(0, 80);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Plannings hebdomadaires
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Grille des semaines planifiees par service, avec acces direct a
            l'edition et a l'impression.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/work-schedules/new">Planifier une semaine</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/work-schedules/list">Vue journaliere</Link>
          </Button>
        </div>
      </section>

      {weeklyCards.length === 0 ? (
        <section className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Aucun planning hebdomadaire detecte. Commencez par planifier une
          semaine.
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weeklyCards.map(card => (
            <article
              key={card.key}
              className="rounded border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {card.service.code}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {card.service.name}
                  </h3>
                </div>

                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                  {statusSummary(card)}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-600">
                {formatDate(card.weekStart)} - {formatDate(card.weekEnd)}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border border-slate-200 bg-slate-50 p-2">
                  <p className="text-slate-500">Jours</p>
                  <p className="font-semibold text-slate-900">
                    {card.coveredDays}/7
                  </p>
                </div>
                <div className="rounded border border-slate-200 bg-slate-50 p-2">
                  <p className="text-slate-500">Affectations</p>
                  <p className="font-semibold text-slate-900">
                    {card.totalAssignments}
                  </p>
                </div>
                <div className="rounded border border-slate-200 bg-slate-50 p-2">
                  <p className="text-slate-500">Brouillons</p>
                  <p className="font-semibold text-slate-900">
                    {card.draftCount}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/work-schedules/weekly?serviceId=${card.service.id}&weekStart=${card.weekStart}`}
                  >
                    Voir / imprimer
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link
                    href={`/work-schedules/new?serviceId=${card.service.id}&weekStart=${card.weekStart}`}
                  >
                    Editer
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
