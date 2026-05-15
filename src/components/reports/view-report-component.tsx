"use client";

import { useRef } from "react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ReportMarkReadButton } from "@/components/reports/report-mark-read-button";
import { ReportPublishButton } from "@/components/reports/report-publish-button";
import { ReportIncidentsSection } from "@/components/reports/report-incidents-section";

type ReportAttendanceItem = {
  status: "present" | "absent";
  user: {
    id: string;
    fullName: string;
    username: string;
  };
};

type ViewReport = {
  id: string;
  workScheduleId: string;
  status: "draft" | "published";
  isRead: boolean;
  createdAt: string | Date;
  publishedAt: string | Date | null;
  readBy: {
    fullName: string;
  } | null;
  reportedBy: {
    fullName: string;
    username: string;
  };
  workSchedule: {
    workDate: string | Date;
    service: {
      name: string;
    };
  };
  attendances: ReportAttendanceItem[];
  ambianceGenerale: string | null;
  problemesRencontres: string | null;
  etatGeneralService: string | null;
  passationService: string | null;
  observationGeneral: string | null;
  incidentEntries: Array<{
    id: string;
    templateNameSnapshot: string;
    valuesJson: unknown;
    schemaSnapshotJson: unknown;
  }>;
};

type ViewReportComponentProps = {
  report: ViewReport;
  canUpdate: boolean;
  canMarkRead: boolean;
};

export default function ViewReportComponent({
  report,
  canUpdate,
  canMarkRead,
}: ViewReportComponentProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `rapport-general-${report.id}`,
  });

  return (
    <div ref={printableRef} className="space-y-6">
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

        <div className="flex flex-wrap gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link href="/reports">Retour à la liste</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="print:hidden"
            onClick={handlePrint}
          >
            Imprimer
          </Button>
          {report.status === "draft" && canUpdate ? (
            <>
              <Button asChild variant="outline">
                <Link
                  href={`/reports/new?workScheduleId=${report.workScheduleId}`}
                >
                  Continuer la rédaction
                </Link>
              </Button>
              <ReportPublishButton reportId={report.id} />
            </>
          ) : null}
          {report.status === "published" && canMarkRead ? (
            <ReportMarkReadButton
              disabled={report.isRead}
              reportId={report.id}
            />
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 border border-slate-200 bg-slate-50 p-5 lg:grid-cols-4">
        <InfoCard
          label="Date du rapport"
          value={formatDate(report.workSchedule.workDate)}
        />
        <InfoCard label="Service" value={report.workSchedule.service.name} />
        <InfoCard
          label="Statut"
          value={report.status === "published" ? "Publié" : "Brouillon"}
        />
        <InfoCard
          label="État de lecture"
          value={
            report.status === "published"
              ? report.isRead
                ? "Lu"
                : "Non lu"
              : "Non disponible"
          }
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
        {report.status === "published" && report.publishedAt && (
          <InfoCard
            label="Date de publication"
            value={formatDateTime(report.publishedAt)}
          />
        )}
        {report.isRead && report.readBy && (
          <InfoCard
            label="Lu par"
            value={
              report.status !== "published"
                ? "Non disponible"
                : (report.readBy?.fullName ??
                  (report.isRead ? "Utilisateur inconnu" : "Pas encore lu"))
            }
          />
        )}
      </section>

      <section className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Présences</h2>
          <p className="text-sm text-slate-600">
            Personnel marqué présent ou absent sur ce rapport.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="space-y-2 border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Présents</h3>
            {report.attendances.filter(item => item.status === "present")
              .length > 0 ? (
              <ul className="space-y-1 text-sm text-slate-700">
                {report.attendances
                  .filter(item => item.status === "present")
                  .map(item => (
                    <li key={`present-${item.user.id}`}>
                      {item.user.fullName}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">Aucun personnel présent.</p>
            )}
          </article>

          <article className="space-y-2 border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Absents</h3>
            {report.attendances.filter(item => item.status === "absent")
              .length > 0 ? (
              <ul className="space-y-1 text-sm text-slate-700">
                {report.attendances
                  .filter(item => item.status === "absent")
                  .map(item => (
                    <li key={`absent-${item.user.id}`}>{item.user.fullName}</li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">Aucun personnel absent.</p>
            )}
          </article>
        </div>
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

      <ReportIncidentsSection incidentEntries={report.incidentEntries} />
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
