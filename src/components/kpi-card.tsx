import Link from "next/link";
import type { Kpi } from "@/lib/types";
import { cx } from "@/lib/utils";

const toneClass: Record<Kpi["tone"], string> = {
  blue: "border-blue-200 bg-blue-50 text-[#0f4c81]",
  steel: "border-slate-200 bg-slate-50 text-slate-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border-red-200 bg-red-50 text-red-700",
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-500">{kpi.label}</p>
        <span className={cx("h-3 w-3 rounded-full border", toneClass[kpi.tone])} />
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950 sm:mt-4 sm:text-4xl">
        {kpi.value}
      </p>
      <p className="mt-1.5 text-sm font-medium text-slate-500 sm:mt-2">
        {kpi.helper}
      </p>
      {kpi.href ? (
        <p className="mt-3 text-sm font-black text-[#0f4c81] sm:mt-4">
          Voir le détail →
        </p>
      ) : null}
    </>
  );

  const className = cx(
    "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition sm:p-5",
    kpi.href && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
    kpi.placeholder && "bg-slate-50/70",
  );

  if (kpi.href) {
    return (
      <Link href={kpi.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <article className={className} aria-disabled={kpi.placeholder}>
      {content}
    </article>
  );
}
