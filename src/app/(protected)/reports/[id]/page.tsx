import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getGeneralSubReportFields,
  getGeneralSubReportSections,
} from "@/lib/general-report-subreports";
import { getReportById } from "@/lib/report-records";
import { serviceLabel } from "@/lib/services";
import { getServerSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ReportMarkReadButton } from "@/components/reports/report-mark-read-button";

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
  const payload = await getReportById("general", id, session);

  if (!payload) {
    notFound();
  }

  const { report, reportType } = payload;
  const service = report.serviceContext;
  const sections = service ? getGeneralSubReportSections(service) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-teal-700 uppercase">
            Rapport général
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Lecture du rapport du {formatDate(report.reportDate)}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            {reportType.detailDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/reports">Retour à la liste</Link>
          </Button>
          {session.role == "admin" && (
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
          value={formatDate(report.reportDate)}
        />
        <InfoCard
          label="Service"
          value={service ? serviceLabel(service) : "Non précisé"}
        />
        <InfoCard label="Groupe" value={report.group?.name ?? "Aucun groupe"} />
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
          {reportType.fields.map(field => (
            <article
              key={field.key}
              className="space-y-2 border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {field.label}
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {formatReportValue(report[field.key])}
              </p>
            </article>
          ))}
        </div>
      </section>

      {service
        ? sections.map(section => {
            const entries = report.subReports?.[section.slug] ?? [];

            return (
              <section
                key={section.slug}
                className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {section.title}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {section.description}
                  </p>
                </div>

                {entries.length === 0 ? (
                  <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    {section.emptyLabel}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry, index) => (
                      <article
                        key={`${section.slug}-${index}`}
                        className="space-y-3 border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          Entrée {index + 1}
                        </p>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {getGeneralSubReportFields(section.slug, service).map(
                            field => (
                              <div key={field.key} className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  {field.label}
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                  {formatReportValue(entry[field.key])}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        : null}
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Non renseigné";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
