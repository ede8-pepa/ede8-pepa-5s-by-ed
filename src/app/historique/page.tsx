import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getAuditScoreStatus } from "@/lib/audit-status";
import { getAuditHistoryWithAnswers } from "@/lib/data/audit-history-provider";
import { formatAuditDateTime } from "@/lib/date-format";

export const dynamic = "force-dynamic";

type AuditHistoryFilters = {
  score?: number;
  criterion?: string;
  zone?: string;
};

export default async function AuditHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    score?: string;
    criterion?: string;
    zone?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeFilters(resolvedSearchParams);
  const audits = filterAudits(await getAuditHistoryWithAnswers(), filters);

  return (
    <AppShell activePath="/historique">
      <PageHeader
        eyebrow="Suivi terrain"
        title="Historique des audits"
        description="Consultez les audits enregistres dans Appwrite, avec fallback fictif si la base est vide ou indisponible."
      />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-lg font-black text-slate-950">
            Audits enregistres
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {audits.length} audit{audits.length > 1 ? "s" : ""} disponible
            {audits.length > 1 ? "s" : ""}.
          </p>
          <ActiveFilters filters={filters} />
        </div>

        {audits.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {audits.map((audit) => (
              <AuditHistoryItem key={audit.$id} audit={audit} />
            ))}
          </div>
        ) : (
          <p className="px-5 py-4 text-sm font-bold text-slate-500">
            Aucun audit ne correspond à ce filtre.
          </p>
        )}
      </section>
    </AppShell>
  );
}

function AuditHistoryItem({
  audit,
}: {
  audit: Awaited<ReturnType<typeof getAuditHistoryWithAnswers>>[number];
}) {
  const status = getAuditScoreStatus(audit.scorePercent);
  const detailHref = `/historique/${audit.$id}`;

  return (
    <article className="grid gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={detailHref}
            className="text-base font-black text-slate-950 transition hover:text-[#0f4c81] hover:underline"
          >
            {audit.zoneName || "Zone non renseignee"}
          </Link>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0f4c81] ring-1 ring-blue-100">
            {audit.scorePercent}%
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatAuditDateTime(audit.createdAt)} - {audit.auditorName || "Auditeur inconnu"} -{" "}
          {audit.shift || "Poste non renseigne"}
        </p>
      </div>

      <Link
        href={detailHref}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Voir detail
      </Link>
    </article>
  );
}

function ActiveFilters({ filters }: { filters: AuditHistoryFilters }) {
  const activeFilters = [
    filters.score ? `Score ${filters.score}/5` : undefined,
    filters.criterion ? `Critère ${filters.criterion}` : undefined,
    filters.zone ? `Zone ${filters.zone}` : undefined,
  ].filter(Boolean);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {activeFilters.map((filter) => (
        <span
          key={filter}
          className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0f4c81] ring-1 ring-blue-100"
        >
          {filter}
        </span>
      ))}
      <Link
        href="/historique"
        className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
      >
        Voir tout l'historique
      </Link>
    </div>
  );
}

function filterAudits(
  audits: Awaited<ReturnType<typeof getAuditHistoryWithAnswers>>,
  filters: AuditHistoryFilters,
) {
  return audits.filter((audit) => {
    if (filters.zone && normalizeValue(audit.zoneName) !== normalizeValue(filters.zone)) {
      return false;
    }

    if (
      filters.criterion &&
      !audit.answers.some(
        (answer) =>
          normalizeValue(answer.criterionLabel) ===
            normalizeValue(filters.criterion ?? "") && answer.score <= 3,
      )
    ) {
      return false;
    }

    if (
      typeof filters.score === "number" &&
      !audit.answers.some((answer) => answer.score === filters.score)
    ) {
      return false;
    }

    return true;
  });
}

function normalizeFilters(
  searchParams:
    | {
        score?: string;
        criterion?: string;
        zone?: string;
      }
    | undefined,
): AuditHistoryFilters {
  const score = Number(searchParams?.score);

  return {
    score: Number.isFinite(score) && score >= 0 && score <= 5 ? score : undefined,
    criterion: searchParams?.criterion?.trim() || undefined,
    zone: searchParams?.zone?.trim() || undefined,
  };
}

function normalizeValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "et")
    .replace(/[^a-z0-9]+/g, "");
}
