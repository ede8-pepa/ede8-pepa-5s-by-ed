import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AppwriteStatus } from "@/components/appwrite-status";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { ScoreTrend } from "@/components/score-trend";
import { ZoneList } from "@/components/zone-list";
import { auditProvider } from "@/lib/data/audit-provider";
import type { DashboardData } from "@/lib/types";

console.log("[build-trace] src/app/page.tsx module loaded");

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  console.log("[build-trace] DashboardPage start");
  const data = await auditProvider.getDashboardData();
  console.log("[build-trace] DashboardPage data loaded");
  const orderedKpis = orderDashboardKpis(data.kpis);

  return (
    <AppShell activePath="/">
      <PageHeader
        eyebrow="Pilotage atelier"
        title="Dashboard 5S"
        description="Suivez les scores, les zones sensibles et les actions ouvertes avec une vue claire pour les routines terrain."
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AppwriteStatus status={data.appwrite} />
            <Link
              href="/nouvel-audit"
              className="inline-flex items-center justify-center rounded-lg bg-[#0f4c81] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#0a365c]"
            >
              + Nouvel audit
            </Link>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {orderedKpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      {data.insights ? <DashboardInsightsPanel insights={data.insights} /> : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <ZoneList zones={data.zones} />
        <ScoreTrend trend={data.auditTrend} />
      </section>
    </AppShell>
  );
}

function orderDashboardKpis(kpis: DashboardData["kpis"]) {
  const order = [
    "Score global",
    "Dernier audit",
    "Audits réalisés",
    "Actions ouvertes",
    "Actions en cours",
    "Actions clôturées",
    "Actions en retard",
    "Écarts majeurs",
    "Écarts critiques",
  ];

  return [...kpis].sort((left, right) => {
    const leftIndex = order.indexOf(left.label);
    const rightIndex = order.indexOf(right.label);

    return (
      (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
      (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
    );
  });
}

function DashboardInsightsPanel({
  insights,
}: {
  insights: NonNullable<DashboardData["insights"]>;
}) {
  return (
    <section className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_360px]">
      <TopFindingsCard insights={insights} />
      <ZoneScoresCard insights={insights} />
      <ZoneExtremesCard insights={insights} />
    </section>
  );
}

function TopFindingsCard({
  insights,
}: {
  insights: NonNullable<DashboardData["insights"]>;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-lg font-black text-slate-950">
          Top écarts observés
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Occurrences par critère sur les audits disponibles.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {insights.topFindings.length > 0 ? (
          insights.topFindings.map((finding) => (
            <InsightRow
              key={finding.criterion}
              href={finding.href}
              label={finding.criterion}
              value={String(finding.count)}
              helper="Voir le détail →"
            />
          ))
        ) : (
          <EmptyInsight message="Aucun écart observé pour le moment." />
        )}
      </div>
    </article>
  );
}

function ZoneScoresCard({
  insights,
}: {
  insights: NonNullable<DashboardData["insights"]>;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-lg font-black text-slate-950">
          Score moyen par zone
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Moyenne calculée depuis les audits enregistrés.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {insights.zoneScores.map((zone) =>
          typeof zone.score === "number" ? (
            <InsightRow
              key={zone.zoneName}
              href={zone.href}
              label={zone.zoneName}
              value={`${zone.score}%`}
              helper={`${zone.auditCount} audit${zone.auditCount > 1 ? "s" : ""}`}
            />
          ) : (
            <div
              key={zone.zoneName}
              className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5 sm:py-4"
            >
              <p className="font-black text-slate-700">{zone.zoneName}</p>
              <p className="text-sm font-bold text-slate-400">
                Aucune donnée
              </p>
            </div>
          ),
        )}
      </div>
    </article>
  );
}

function ZoneExtremesCard({
  insights,
}: {
  insights: NonNullable<DashboardData["insights"]>;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-lg font-black text-slate-950">Zones à piloter</h2>
        <p className="mt-1 text-sm text-slate-500">
          Points d’entrée directs vers les audits concernés.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {insights.weakestZone ? (
          <InsightRow
            href={insights.weakestZone.href}
            label="Zone la plus dégradée"
            value={`${insights.weakestZone.score}%`}
            helper={`${insights.weakestZone.zoneName} · Voir le détail →`}
          />
        ) : (
          <EmptyInsight message="Aucune zone dégradée identifiée." />
        )}
        {insights.strongestZone ? (
          <InsightRow
            href={insights.strongestZone.href}
            label="Zone la plus performante"
            value={`${insights.strongestZone.score}%`}
            helper={`${insights.strongestZone.zoneName} · Voir le détail →`}
          />
        ) : (
          <EmptyInsight message="Aucune zone performante identifiée." />
        )}
      </div>
    </article>
  );
}

function InsightRow({
  href,
  label,
  value,
  helper,
}: {
  href: string;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-11 gap-2 px-4 py-3 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 sm:py-4"
    >
      <div>
        <p className="break-words font-black text-slate-950">{label}</p>
        <p className="mt-1 text-sm font-bold text-[#0f4c81]">{helper}</p>
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
    </Link>
  );
}

function EmptyInsight({ message }: { message: string }) {
  return (
    <p className="px-4 py-3 text-sm font-bold text-slate-500 sm:px-5 sm:py-4">
      {message}
    </p>
  );
}
