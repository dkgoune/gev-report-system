import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { dailyReportFields } from "@/components/daily-report-management/constants";
import { MarkReportReadButton } from "@/components/daily-report-management/mark-report-read-button";
import { getServiceForRole, serviceLabel } from "@/lib/services";
import { getServerSession } from "@/lib/session";

type GeneralReportReadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GeneralReportReadPage({
  params,
}: GeneralReportReadPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const report = await prisma.dailyGeneralReport.findUnique({
    where: { id },
    select: {
      id: true,
      reportDate: true,
      service: true,
      isRead: true,
      readAt: true,
      personnelPresent: true,
      personnelAbsent: true,
      ambianceGenerale: true,
      problemesRencontres: true,
      etatGeneralService: true,
      passationService: true,
      observationGeneral: true,
      createdAt: true,
      reportedBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      readBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  const leaderService = getServiceForRole(session.role);

  if (session.role !== "admin" && report.service !== leaderService) {
    notFound();
  }

  const isAdmin = session.role === "admin";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">
              Lire le rapport général
            </h2>
            <span
              className={
                report.isRead
                  ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  : "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
              }
            >
              {report.isRead ? "Lu" : "Non lu"}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Consultez le détail du rapport journalier et marquez-le comme lu si
            nécessaire.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/reports/general">Retour à la liste</Link>
          </Button>
          {isAdmin && !report.isRead ? (
            <MarkReportReadButton reportId={report.id} />
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Service</p>
          <p className="mt-1 text-sm text-slate-900">
            {serviceLabel(report.service)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Date</p>
          <p className="mt-1 text-sm text-slate-900">
            {formatDate(report.reportDate).toString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Saisi par</p>
          <p className="mt-1 text-sm text-slate-900">
            {report.reportedBy.fullName}
          </p>
          <p className="text-xs text-slate-500">
            @{report.reportedBy.username}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Lu par</p>
          {report.readBy ? (
            <>
              <p className="mt-1 text-sm text-slate-900">
                {report.readBy.fullName}
              </p>
              <p className="text-xs text-slate-500">
                @{report.readBy.username}
              </p>
              <p className="text-xs text-slate-500">
                {report.readAt
                  ? formatDateTime(report.readAt).toString()
                  : "Date de lecture indisponible"}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Pas encore lu.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {dailyReportFields.map((field) => (
          <article
            key={field.key}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              {field.label}
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {report[field.key] || "Aucune information renseignée."}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}

function formatDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
