import Link from "next/link";
import {
  BarChart3,
  Gauge,
  ListChecks,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { MembershipRole } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { type EvaluationsAnalyticsSnapshot } from "@/lib/evaluations-analytics.types";
import { buildRangeSearchParams } from "@/lib/analytics-range";
import { AnalyticsRangeFilter } from "./analytics-range-filter";
import { BreakdownBarChart, EvaluationTrendChart } from "./analytics-charts";

type SurfaceProps = {
  snapshot: EvaluationsAnalyticsSnapshot;
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

function roleLabel(role: MembershipRole) {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "scheduler":
      return "Planificateur";
    case "reporter":
      return "Rapporteur";
    case "worker":
    default:
      return "Travailleur";
  }
}

function buildAnalyticsHref(
  snapshot: EvaluationsAnalyticsSnapshot,
  hash?: string
) {
  const params = buildRangeSearchParams({
    preset: snapshot.range.preset,
    from: snapshot.range.from,
    to: snapshot.range.to,
  }).toString();

  return `/evaluations-analytics${params ? `?${params}` : ""}${hash || ""}`;
}

function buildEvaluationsListHref(snapshot: EvaluationsAnalyticsSnapshot) {
  const params = new URLSearchParams();
  params.set("from", snapshot.range.from);
  params.set("to", snapshot.range.to);

  return `/evaluations?${params.toString()}`;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  description: string;
  icon: typeof BarChart3;
  title: string;
  value: string;
}) {
  return (
    <article className="border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <div className="border border-slate-200 bg-white p-2 text-slate-700">
          <Icon className="size-4" />
        </div>
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
  children: React.ReactNode;
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

export function EvaluationsAnalyticsSurface({ snapshot }: SurfaceProps) {
  const groupBreakdown = snapshot.groupStats
    .slice(0, 8)
    .map(item => ({ label: item.groupName, value: item.evaluationCount }));
  const criteriaBreakdown = snapshot.criteriaStats
    .slice(0, 8)
    .map(item => ({ label: item.name, value: item.evaluationCount }));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">
          Analyse des evaluations
        </h2>
        <p className="text-sm text-slate-600">
          Lecture detaillee des performances du personnel sur une periode
          donnee.
        </p>
      </div>

      <AnalyticsRangeFilter range={snapshot.range} />

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={buildAnalyticsHref(snapshot, "#workers")}>Personnel</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={buildAnalyticsHref(snapshot, "#posts")}>Postes</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={buildAnalyticsHref(snapshot, "#criteria")}>Criteres</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={buildAnalyticsHref(snapshot, "#evaluators")}>
            Evaluateurs
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={buildEvaluationsListHref(snapshot)}>Voir la liste</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Evaluations"
          value={formatInteger(snapshot.summary.totalEvaluations)}
          description="Nombre total d'evaluations enregistrees sur la periode."
          icon={ListChecks}
        />
        <MetricCard
          title="Score net"
          value={formatSigned(snapshot.summary.netScore)}
          description="Somme signee des poids positifs et negatifs appliques."
          icon={Gauge}
        />
        <MetricCard
          title="Agents evalues"
          value={formatInteger(snapshot.summary.activeWorkers)}
          description="Nombre de travailleurs distincts ayant recu au moins une evaluation."
          icon={Users}
        />
        <MetricCard
          title="Postes actifs"
          value={formatInteger(snapshot.summary.activeGroups)}
          description="Postes ayant au moins une evaluation sur l'intervalle."
          icon={Users}
        />
        <MetricCard
          title="Positives / negatives"
          value={`${formatInteger(snapshot.summary.positiveCount)} / ${formatInteger(snapshot.summary.negativeCount)}`}
          description="Repartition des occurrences positives et negatives."
          icon={Target}
        />
        <MetricCard
          title="Moyenne par agent"
          value={formatSigned(snapshot.summary.averageScorePerWorker)}
          description="Score net moyen par travailleur evalue sur la periode."
          icon={TrendingUp}
        />
      </div>

      <SectionFrame
        id="overview"
        title="Tendance"
        description="Evolution journaliere du volume d'evaluations et du score net."
      >
        <article className="border border-slate-200 bg-white p-4">
          <EvaluationTrendChart data={snapshot.trend} />
        </article>
      </SectionFrame>

      <SectionFrame
        id="workers"
        title="Personnel"
        description="Scores, classements et moyennes des travailleurs evalues."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Top 5</h3>
              <p className="text-sm text-slate-600">
                Meilleurs scores nets sur l'intervalle selectionne.
              </p>
            </div>
            <div className="space-y-3">
              {snapshot.leaderboards.topWorkers.map(worker => (
                <div
                  key={worker.userId}
                  className="flex items-center justify-between border border-slate-200 bg-white px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {worker.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {roleLabel(worker.role)} - {worker.groupName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900">
                      {formatSigned(worker.totalScore)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatInteger(worker.evaluationCount)} eval.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Bottom 5</h3>
              <p className="text-sm text-slate-600">
                Scores nets les plus faibles sur l'intervalle selectionne.
              </p>
            </div>
            <div className="space-y-3">
              {snapshot.leaderboards.bottomWorkers.map(worker => (
                <div
                  key={worker.userId}
                  className="flex items-center justify-between border border-slate-200 bg-white px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {worker.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {roleLabel(worker.role)} - {worker.groupName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900">
                      {formatSigned(worker.totalScore)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatSigned(worker.averageScore)} moyenne
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-lg font-semibold text-slate-900">
              Scores par travailleur
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Personnel
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Poste
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Evaluations
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Score total
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Moyenne
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {snapshot.workerStats.slice(0, 12).map(worker => (
                  <tr key={worker.userId}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-slate-900">
                        {worker.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {roleLabel(worker.role)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {worker.groupName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {formatInteger(worker.evaluationCount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {formatSigned(worker.totalScore)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {formatSigned(worker.averageScore)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </SectionFrame>

      <SectionFrame
        id="posts"
        title="Postes"
        description="Volume d'evaluations, couverture et score moyen par poste."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <article className="border border-slate-200 bg-white p-4">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">
                Evaluations par poste
              </h3>
              <p className="text-sm text-slate-600">
                Postes les plus evalues sur la periode selectionnee.
              </p>
            </div>
            <BreakdownBarChart
              data={groupBreakdown}
              dataKey="value"
              labelKey="label"
              label="Evaluations"
            />
          </article>

          <article className="border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">
                Resume par poste
              </h3>
              <p className="text-sm text-slate-600">
                Total, couverture et moyenne des scores par poste.
              </p>
            </div>
            <div className="space-y-3">
              {snapshot.groupStats.map(group => (
                <div
                  key={group.groupId ?? group.groupName}
                  className="border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {group.groupName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {group.service ? group.service : "Sans service"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatSigned(group.averageScore)} moy.
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                    <p>{formatInteger(group.evaluationCount)} evaluations</p>
                    <p>
                      {formatInteger(group.evaluatedWorkers)} agents couverts
                    </p>
                    <p>{formatSigned(group.totalScore)} score net</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </SectionFrame>

      <SectionFrame
        id="criteria"
        title="Criteres"
        description="Criteres les plus utilises et contribution aux scores."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <article className="border border-slate-200 bg-white p-4">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">
                Evaluations par critere
              </h3>
              <p className="text-sm text-slate-600">
                Frequence d'utilisation des criteres sur l'intervalle.
              </p>
            </div>
            <BreakdownBarChart
              data={criteriaBreakdown}
              dataKey="value"
              labelKey="label"
              label="Occurrences"
            />
          </article>

          <article className="border border-slate-200 bg-white p-4">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">
                Contribution par critere
              </h3>
            </div>
            <div className="space-y-3">
              {snapshot.criteriaStats.map(criteria => (
                <div
                  key={criteria.criteriaId}
                  className="flex items-center justify-between border border-slate-200 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {criteria.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {criteria.impact === "POSITIVE" ? "Positif" : "Negatif"} -{" "}
                      {formatInteger(criteria.evaluationCount)} eval.
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatSigned(criteria.scoreContribution)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </SectionFrame>

      <SectionFrame
        id="evaluators"
        title="Evaluateurs"
        description="Activite des evaluateurs et couverture des travailleurs."
      >
        <article className="border border-slate-200 bg-white p-4">
          <div className="space-y-3">
            {snapshot.evaluatorActivity.map(evaluator => (
              <div
                key={evaluator.userId}
                className="flex flex-col gap-2 border border-slate-200 px-3 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {evaluator.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {roleLabel(evaluator.role)}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3 md:text-right">
                  <p>{formatInteger(evaluator.evaluationCount)} evaluations</p>
                  <p>
                    {formatInteger(evaluator.distinctWorkers)} travailleurs
                    distincts
                  </p>
                  <p>{formatSigned(evaluator.totalScore)} score cumule</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </SectionFrame>
    </div>
  );
}
