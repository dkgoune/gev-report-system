import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ChartColumn,
  ClipboardList,
  Signature,
  TriangleAlert,
  Trophy,
} from "lucide-react";
import { roleLabel } from "@/components/user-management/constants";
import { Button } from "@/components/ui/button";
import { type AnalyticsSnapshot } from "../../lib/analytics";
import { buildRangeSearchParams } from "@/lib/analytics-range";
import { AnalyticsRangeFilter } from "./analytics-range-filter";
import { BreakdownBarChart, TrendChart } from "./analytics-charts";

type SurfaceProps = {
  snapshot: AnalyticsSnapshot;
};

function formatInteger(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatSigned(value: number) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);

  return value > 0 ? `+${formatted}` : formatted;
}

function buildHref(snapshot: AnalyticsSnapshot, hash?: string) {
  const params = buildRangeSearchParams({
    preset: snapshot.range.preset,
    from: snapshot.range.from,
    to: snapshot.range.to,
  }).toString();

  return `/analytics${params ? `?${params}` : ""}${hash || ""}`;
}

function MetricCard({
  title,
  value,
  description,
  href,
  icon: Icon,
}: {
  description: string;
  href: string;
  icon: typeof ClipboardList;
  title: string;
  value: string;
}) {
  return (
    <article className=" border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white p-2 text-slate-700">
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-4">
        <Button asChild size="sm" variant="outline">
          <Link href={href}>
            Explorer
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function SectionFrame({
  id,
  title,
  description,
  children,
}: {
  children: ReactNode;
  description: string;
  id: string;
  title: string;
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function DashboardSurface({ snapshot }: SurfaceProps) {
  const incidentBreakdown = snapshot.incidentTypeBreakdown
    .filter(item => item.total > 0)
    .slice(0, 6)
    .map(item => ({ label: item.title, value: item.total }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="text-sm text-slate-600">
          Vue de synthèse des rapports, incidents, signatures et évaluations.
        </p>
      </div>

      <AnalyticsRangeFilter range={snapshot.range} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Rapports"
          value={formatInteger(snapshot.summary.reports)}
          description="Tous les rapports saisis sur la période sélectionnée."
          href={buildHref(snapshot, "#reporting")}
          icon={ClipboardList}
        />
        <MetricCard
          title="Incidents"
          value={formatInteger(snapshot.summary.incidents)}
          description="Signalements opérationnels hors rapports généraux."
          href={buildHref(snapshot, "#operations")}
          icon={TriangleAlert}
        />
        <MetricCard
          title="Rapports non lus"
          value={formatInteger(snapshot.summary.unreadReports)}
          description="Éléments encore en attente de lecture sur la période."
          href={buildHref(snapshot, "#reporting")}
          icon={ChartColumn}
        />
        <MetricCard
          title="Signatures"
          value={formatInteger(snapshot.summary.signatures)}
          description="Signatures enregistrées sur la période sélectionnée."
          href={buildHref(snapshot, "#performance")}
          icon={Signature}
        />
        <MetricCard
          title="Score net"
          value={formatSigned(snapshot.summary.netEvaluationScore)}
          description="Somme des poids d'évaluation appliqués sur la période."
          href={buildHref(snapshot, "#performance")}
          icon={Trophy}
        />
        <MetricCard
          title="Évaluations positives"
          value={formatInteger(snapshot.summary.positiveEvaluations)}
          description="Occurrences positives enregistrées sur la période."
          href={buildHref(snapshot, "#performance")}
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className=" border border-slate-200 bg-white p-4">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Dynamique journalière
            </h3>
            <p className="text-sm text-slate-600">
              Rapports, incidents et signatures par jour.
            </p>
          </div>
          <TrendChart data={snapshot.trend} />
        </article>

        <article className=" border border-slate-200 bg-white p-4">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Incidents dominants
            </h3>
            <p className="text-sm text-slate-600">
              Types d'incidents les plus fréquents sur la période.
            </p>
          </div>
          <BreakdownBarChart
            data={incidentBreakdown}
            dataKey="value"
            labelKey="label"
            label="Incidents"
          />
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className=" border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Pression par service
            </h3>
            <p className="text-sm text-slate-600">
              Volume de rapports et d'incidents sur la période.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {snapshot.serviceBreakdown.map(item => (
              <div
                key={item.service}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {formatInteger(item.incidentCount)}
                </p>
                <p className="mt-1 text-sm text-slate-600">incidents</p>
                <p className="mt-3 text-xs text-slate-500">
                  {formatInteger(item.reportCount)} rapports saisis
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className=" border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Meilleurs signataires
            </h3>
            <p className="text-sm text-slate-600">
              Les utilisateurs les plus actifs sur la période.
            </p>
          </div>
          <div className="space-y-3">
            {snapshot.topSigners.length === 0 ? (
              <p className="text-sm text-slate-600">
                Aucune signature enregistrée sur cette période.
              </p>
            ) : (
              snapshot.topSigners.map(item => (
                <div
                  key={item.userId}
                  className="flex items-center justify-between border border-slate-200 bg-white px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {roleLabel(item.role)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatInteger(item.count)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export function AnalyticsSurface({ snapshot }: SurfaceProps) {
  const reportBreakdown = snapshot.reportTypeBreakdown
    .filter(item => item.total > 0)
    .map(item => ({ label: item.title, value: item.total }));
  const incidentBreakdown = snapshot.incidentTypeBreakdown
    .filter(item => item.total > 0)
    .map(item => ({ label: item.title, value: item.total }));
  const criteriaBreakdown = snapshot.criteriaUsage.map(item => ({
    label: item.name,
    value: item.count,
  }));
  const incidentTrend = snapshot.trend.map(item => ({
    ...item,
    reports: 0,
    signatures: 0,
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Analyse</h2>
        <p className="text-sm text-slate-600">
          Lecture détaillée des tendances d'exploitation et de performance.
        </p>
      </div>

      <AnalyticsRangeFilter range={snapshot.range} />

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="#operations">Opérations</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="#performance">Performance</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="#reporting">Rapports</Link>
        </Button>
      </div>

      <SectionFrame
        id="operations"
        title="Opérations"
        description="Volume d'incidents, services les plus exposés et évolution journalière."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Total incidents
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatInteger(snapshot.summary.incidents)}
            </p>
          </div>
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Services suivis
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatInteger(snapshot.serviceBreakdown.length)}
            </p>
          </div>
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Types actifs
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatInteger(
                snapshot.incidentTypeBreakdown.filter(item => item.total > 0)
                  .length
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <article className=" border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Tendance des incidents
            </h3>
            <TrendChart data={incidentTrend} />
          </article>

          <article className=" border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Répartition par type
            </h3>
            <BreakdownBarChart
              data={incidentBreakdown}
              dataKey="value"
              labelKey="label"
              label="Incidents"
            />
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {snapshot.serviceBreakdown.map(item => (
            <article
              key={item.service}
              className=" border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatInteger(item.incidentCount)}
              </p>
              <p className="mt-1 text-sm text-slate-600">incidents</p>
              <p className="mt-3 text-xs text-slate-500">
                {formatInteger(item.reportCount)} rapports saisis
              </p>
            </article>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame
        id="performance"
        title="Performance"
        description="Signatures, équilibre des évaluations et personnels les plus marquants."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Signatures
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatInteger(snapshot.summary.signatures)}
            </p>
          </div>
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Évaluations positives
            </p>
            <p className="mt-3 text-3xl font-bold text-emerald-700">
              {formatInteger(snapshot.evaluationSummary.positiveCount)}
            </p>
          </div>
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Évaluations négatives
            </p>
            <p className="mt-3 text-3xl font-bold text-amber-700">
              {formatInteger(snapshot.evaluationSummary.negativeCount)}
            </p>
          </div>
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Score net
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatSigned(snapshot.evaluationSummary.netScore)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <article className=" border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Signataires les plus actifs
            </h3>
            <div className="space-y-3">
              {snapshot.topSigners.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Aucune signature sur cette période.
                </p>
              ) : (
                snapshot.topSigners.map(item => (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {roleLabel(item.role)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatInteger(item.count)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className=" border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Meilleurs scores
            </h3>
            <div className="space-y-3">
              {snapshot.leaderboard.top.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Aucune évaluation sur cette période.
                </p>
              ) : (
                snapshot.leaderboard.top.map(item => (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {roleLabel(item.role)} · {item.count} év.
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-emerald-700">
                      {formatSigned(item.score)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className=" border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Critères les plus utilisés
            </h3>
            <BreakdownBarChart
              data={criteriaBreakdown}
              dataKey="value"
              labelKey="label"
              label="Utilisations"
            />
          </article>
        </div>
      </SectionFrame>

      <SectionFrame
        id="reporting"
        title="Rapports"
        description="Volume global, types de rapports et suivi des éléments non lus."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Rapports saisis
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatInteger(snapshot.summary.reports)}
            </p>
          </div>
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Non lus
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatInteger(snapshot.summary.unreadReports)}
            </p>
          </div>
          <div className=" border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Types actifs
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatInteger(
                snapshot.reportTypeBreakdown.filter(item => item.total > 0)
                  .length
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className=" border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Répartition par type de rapport
            </h3>
            <BreakdownBarChart
              data={reportBreakdown}
              dataKey="value"
              labelKey="label"
              label="Rapports"
            />
          </article>

          <article className=" border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Suivi des non lus
            </h3>
            <div className="space-y-3">
              {snapshot.reportTypeBreakdown
                .filter(item => item.unread > 0)
                .sort((left, right) => right.unread - left.unread)
                .map(item => (
                  <div
                    key={item.slug}
                    className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatInteger(item.total)} au total
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatInteger(item.unread)}
                    </p>
                  </div>
                ))}
            </div>
          </article>
        </div>
      </SectionFrame>
    </div>
  );
}
