import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getStandardDetail } from "@/lib/data/standards-provider";
import type { Standard } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StandardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ zoneId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { zoneId } = await params;
  const resolvedSearchParams = await searchParams;
  const { zone, standards } = await getStandardDetail(zoneId);
  const title = zone?.name ?? standards[0]?.title ?? "Zone inconnue";
  const returnToAudit = resolvedSearchParams?.returnTo === "/nouvel-audit";

  return (
    <AppShell activePath="/standards">
      <PageHeader
        eyebrow="STANDARD 5S"
        title={title}
        description="Référentiel attendu pour préparer et conduire l'audit terrain."
        action={<BackLink returnToAudit={returnToAudit} />}
      />

      {standards.length > 0 ? (
        <div className="grid gap-4">
          {standards.map((standard) => (
            <StandardCard key={standard.$id} standard={standard} />
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Aucun standard défini pour cette zone.
          </p>
        </section>
      )}
    </AppShell>
  );
}

function StandardCard({ standard }: { standard: Standard }) {
  const rules = parseRules(standard.rules);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-black text-slate-950 sm:text-2xl">
            {standard.title}
          </h2>
        </div>
        <span
          className={
            standard.active
              ? "rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200"
              : "rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200"
          }
        >
          {standard.active ? "Actif" : "Inactif"}
        </span>
      </div>

      {standard.description ? (
        <section className="mt-5 rounded-lg bg-slate-50 p-4">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
            Description
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {standard.description}
          </p>
        </section>
      ) : null}

      <section className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
          Règles du standard
        </h3>
        {rules.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {rules.map((rule) => (
              <li
                key={rule}
                className="flex min-w-0 gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-700"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                  ✓
                </span>
                <span className="min-w-0 break-words">{rule}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm font-bold text-slate-500">
            Aucune règle définie.
          </p>
        )}
      </section>
    </article>
  );
}

function BackLink({ returnToAudit }: { returnToAudit: boolean }) {
  return (
    <Link
      href={returnToAudit ? "/nouvel-audit" : "/standards"}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {returnToAudit ? "Retour audit" : "Retour standards"}
    </Link>
  );
}

function parseRules(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|(?:^|\s)-\s+/)
    .map((rule) => rule.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}
