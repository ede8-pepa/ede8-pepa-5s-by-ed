import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getStandardsOverview } from "@/lib/data/standards-provider";

export const dynamic = "force-dynamic";

export default async function StandardsPage() {
  const zones = await getStandardsOverview();
  const standardsCount = zones.reduce(
    (total, zone) => total + zone.standards.length,
    0,
  );

  return (
    <AppShell activePath="/standards">
      <PageHeader
        eyebrow="Référentiel terrain"
        title="Standards 5S"
        description="Consultez le standard attendu par zone avant ou pendant un audit."
      />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-black text-slate-950">
            Standards disponibles : {standardsCount}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sélectionnez une zone pour consulter le référentiel 5S attendu.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {zones.map((zone) => {
            const hasActiveStandard = zone.standards.some(
              (standard) => standard.active,
            );

            return (
              <article
                key={zone.id}
                className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
              >
                <div>
                  <Link
                    href={`/standards/${zone.id}`}
                    className="inline-flex min-h-11 items-center text-base font-black text-slate-950 transition hover:text-[#0f4c81] hover:underline"
                  >
                    {zone.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {zone.standards.length > 0
                      ? `${zone.standards.length} standard disponible`
                      : "Aucun standard défini pour cette zone."}
                  </p>
                </div>

                <span
                  className={
                    hasActiveStandard
                      ? "rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200"
                      : "rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200"
                  }
                >
                  {hasActiveStandard ? "Actif" : "Inactif"}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
