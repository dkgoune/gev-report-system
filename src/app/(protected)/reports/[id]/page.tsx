import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ReportMarkReadButton } from "@/components/reports/report-mark-read-button";
import { isAgencyAdmin } from "@/lib/authz";

type ReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const report = await prisma.generalReport.findFirst({
    where: {
      id,
      workSchedule: {
        agencyId: session.activeAgencyId,
      },
    },
    include: {
      reportedBy: {
        select: {
          fullName: true,
          username: true,
        },
      },
      readBy: {
        select: {
          fullName: true,
        },
      },
      workSchedule: {
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      },
      incidentEntries: {
        orderBy: [{ displayOrder: "asc" }],
      },
    },
  });

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-teal-700 uppercase">
            Rapport général
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Lecture du rapport du {formatDate(report.workSchedule.workDate)}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Détails du rapport général avec incidents liés pour cette journée.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/reports">Retour à la liste</Link>
          </Button>
          {isAgencyAdmin(session) && (
            <ReportMarkReadButton
              disabled={report.isRead}
              reportId={report.id}
            />
          )}
        </div>
      </div>

      <section className="grid gap-4 border border-slate-200 bg-slate-50 p-5 lg:grid-cols-4">
        <InfoCard
          label="Date du rapport"
          value={formatDate(report.workSchedule.workDate.toISOString())}
        />
        <InfoCard label="Service" value={report.workSchedule.service.name} />
        <InfoCard
          label="État de lecture"
          value={report.isRead ? "Lu" : "Non lu"}
        />
        <InfoCard label="Créé par" value={report.reportedBy.fullName} />
        <InfoCard
          label="Nom d'utilisateur"
          value={`@${report.reportedBy.username}`}
        />
        <InfoCard
          label="Date de création"
          value={formatDateTime(report.createdAt)}
        />
        <InfoCard
          label="Lu par"
          value={
            report.readBy?.fullName ??
            (report.isRead ? "Utilisateur inconnu" : "Pas encore lu")
          }
        />
      </section>

      <section className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">
            Contenu général
          </h2>
          <p className="text-sm text-slate-600">
            Informations consolidées du service pour cette journée.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="space-y-2 border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Ambiance générale
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {formatReportValue(report.ambianceGenerale)}
            </p>
          </article>
          <article className="space-y-2 border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Problèmes rencontrés
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {formatReportValue(report.problemesRencontres)}
            </p>
          </article>
          <article className="space-y-2 border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Etat général du service
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {formatReportValue(report.etatGeneralService)}
            </p>
          </article>
          <article className="space-y-2 border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Passation de service
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {formatReportValue(report.passationService)}
            </p>
          </article>
          <article className="space-y-2 border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Observation générale
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {formatReportValue(report.observationGeneral)}
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">
            Incidents liés
          </h2>
          <p className="text-sm text-slate-600">
            Incidents saisis selon les modèles configurés.
          </p>
        </div>

        {report.incidentEntries.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            Aucun incident lié pour ce rapport.
          </div>
        ) : (
          <div className="space-y-3">
            {report.incidentEntries.map(entry => (
              <article
                key={entry.id}
                className="space-y-2 border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {entry.templateNameSnapshot}
                </p>
                <pre className="overflow-x-auto text-xs text-slate-700">
                  {JSON.stringify(entry.valuesJson, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="space-y-1 border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </article>
  );
}

function formatReportValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "Non renseigné";
}

function formatDate(value: string | Date): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value?.toString();
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value: string | Date | null): string {
  if (!value) {
    return "Non renseigné";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value?.toString();
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
