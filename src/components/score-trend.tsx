import type { DashboardData } from "@/lib/types";

export function ScoreTrend({ trend }: { trend: DashboardData["auditTrend"] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Tendance score</h2>
          <p className="mt-1 text-sm text-slate-500">
            Progression globale sur les derniers audits.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#0f4c81]">
          +11 pts
        </span>
      </div>

      <div className="mt-6 flex h-48 items-end gap-3">
        {trend.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end rounded-md bg-slate-100">
              <div
                className="w-full rounded-md bg-[#0f4c81]"
                style={{ height: `${item.score}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500">{item.label}</p>
              <p className="text-sm font-black text-slate-800">{item.score}%</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
