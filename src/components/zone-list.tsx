import type { Zone } from "@/lib/types";
import { cx } from "@/lib/utils";

const statusClass: Record<Zone["status"], string> = {
  Conforme: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "A surveiller": "bg-amber-50 text-amber-700 ring-amber-200",
  Prioritaire: "bg-red-50 text-red-700 ring-red-200",
};

export function ZoneList({ zones }: { zones: Zone[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-black text-slate-950">Zones suivies</h2>
        <p className="mt-1 text-sm text-slate-500">
          Vue Sprint 1 des zones d&apos;audit disponibles.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {zones.map((zone) => (
          <article
            key={zone.id}
            className="grid min-w-0 gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-base font-black text-slate-950">
                  {zone.name}
                </h3>
                <span
                  className={cx(
                    "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                    statusClass[zone.status],
                  )}
                >
                  {zone.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{zone.line}</p>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[340px]">
              <Metric label="Score" value={`${zone.score}%`} />
              <Metric label="Actions" value={String(zone.openActions)} />
              <Metric label="Audit" value={zone.lastAudit} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-black text-slate-800">{value}</p>
    </div>
  );
}
