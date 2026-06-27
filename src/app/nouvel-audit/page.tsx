import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { NewAuditForm } from "@/components/new-audit-form";
import { PageHeader } from "@/components/page-header";
import { auditProvider } from "@/lib/data/audit-provider";

console.log("[build-trace] src/app/nouvel-audit/page.tsx module loaded");

export const dynamic = "force-dynamic";

export default async function NewAuditPage() {
  console.log("[build-trace] NewAuditPage start");
  const zones = await auditProvider.getZones();
  console.log("[build-trace] NewAuditPage zones loaded", zones.length);

  return (
    <AppShell activePath="/nouvel-audit">
      <PageHeader
        eyebrow="Saisie terrain"
        title="Nouvel audit"
        description="Preparez une saisie 5S simple avec zone, date, auditeur et notes par critere. La sauvegarde sera branchee avec Appwrite dans un sprint suivant."
        action={
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Retour dashboard
          </Link>
        }
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <NewAuditForm zones={zones} />

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Zones</h2>
            <div className="mt-4 grid gap-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3"
                >
                  <span className="break-words font-bold text-slate-800">
                    {zone.name}
                  </span>
                  <span className="text-sm font-black text-[#0f4c81]">
                    {zone.score}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f4c81]">
              Sprint 1
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Cette V1 enregistre l&apos;audit et les reponses dans Appwrite.
              Auth, photos, exports et actions automatiques restent hors scope.
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
