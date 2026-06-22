import Link from "next/link";
import { cx } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", shortLabel: "Dashboard", href: "/", icon: "▦", mobileIcon: "🏠" },
  { label: "Nouvel audit", shortLabel: "Audit", href: "/nouvel-audit", icon: "+", mobileIcon: "➕" },
  { label: "Historique", shortLabel: "Historique", href: "/historique", icon: "▤", mobileIcon: "📋" },
  { label: "Écarts / Actions", shortLabel: "Actions", href: "/actions", icon: "!", mobileIcon: "⚠️" },
  { label: "Standards 5S", shortLabel: "Standards", href: "/standards", icon: "✓", mobileIcon: "✓" },
];

export function AppShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden lg:flex">
      <aside className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-center justify-between gap-3 lg:block">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#0f4c81] text-lg font-black text-white shadow-sm">
              5S
            </span>
            <span>
              <span className="block text-lg font-black text-slate-950">
                5S by ED
              </span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sprint 1
              </span>
            </span>
          </Link>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 lg:mt-5 lg:inline-block">
            Donnees fictives
          </span>
        </div>

        <nav className="mt-5 hidden gap-2 md:flex md:overflow-x-auto lg:mt-9 lg:block lg:space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} activePath={activePath} />
          ))}
        </nav>

        <div className="mt-8 hidden rounded-lg border border-slate-200 bg-slate-50 p-4 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Perimetre V1
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pilotage 5S, zones atelier, KPI et creation d&apos;audit sans auth,
            photos ni export PDF.
          </p>
        </div>
      </aside>

      <main className="industrial-grid min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-6 sm:pb-8 lg:ml-72 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        {navItems.map((item) => (
          <MobileNavLink key={item.href} item={item} activePath={activePath} />
        ))}
      </nav>
    </div>
  );
}

function NavLink({
  item,
  activePath,
}: {
  item: (typeof navItems)[number];
  activePath: string;
}) {
  const isActive =
    activePath === item.href ||
    (item.href !== "/" && activePath.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={cx(
        "flex min-h-11 min-w-fit items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition",
        isActive
          ? "bg-[#0f4c81] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      <span
        className={cx(
          "grid h-7 w-7 shrink-0 place-items-center rounded-md text-base",
          isActive ? "bg-white/16" : "bg-slate-100",
        )}
      >
        {item.icon}
      </span>
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

function MobileNavLink({
  item,
  activePath,
}: {
  item: (typeof navItems)[number];
  activePath: string;
}) {
  const isActive =
    activePath === item.href ||
    (item.href !== "/" && activePath.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={cx(
        "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[0.66rem] font-black leading-tight transition",
        isActive
          ? "bg-blue-50 text-[#0f4c81]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <span className="text-lg leading-none">{item.mobileIcon}</span>
      <span className="max-w-full truncate">{item.shortLabel}</span>
    </Link>
  );
}
