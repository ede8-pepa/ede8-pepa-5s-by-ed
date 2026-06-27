import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import {
  getCorrectiveActionDueState,
  getCorrectiveActionStatusBadge,
  isCorrectiveActionOverdue,
  sortCorrectiveActionsByDate,
} from "@/lib/corrective-actions";
import { readAppwriteCorrectiveActions } from "@/lib/data/appwrite-service";
import type { CorrectiveAction, CorrectiveActionStatus } from "@/lib/types";

console.log("[build-trace] src/app/actions/page.tsx module loaded");

export const dynamic = "force-dynamic";

type CorrectiveActionFilter = CorrectiveActionStatus | "RETARD";

export default async function CorrectiveActionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  console.log("[build-trace] CorrectiveActionsPage start");
  const resolvedSearchParams = await searchParams;
  const selectedFilter = normalizeFilter(resolvedSearchParams?.status);
  const actions = await getCorrectiveActions(selectedFilter);
  console.log("[build-trace] CorrectiveActionsPage actions loaded", actions.length);

  return (
    <AppShell activePath="/actions">
      <PageHeader
        eyebrow="Suivi des écarts"
        title="Actions correctives"
        description="Suivez les actions ouvertes, en cours et clôturées issues des constats d'audit."
      />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-lg font-black text-slate-950">
            Liste des actions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {actions.length} action{actions.length > 1 ? "s" : ""} corrective
            {actions.length > 1 ? "s" : ""}.
          </p>
          <ActionFilters selectedFilter={selectedFilter} />
        </div>

        {actions.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {actions.map((action) => (
                <ActionCard key={action.$id} action={action} />
              ))}
            </div>
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Titre</th>
                  <th className="px-5 py-3">Responsable</th>
                  <th className="px-5 py-3">Échéance</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Audit associé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actions.map((action) => (
                  <ActionRow key={action.$id} action={action} />
                ))}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <p className="px-5 py-4 text-sm font-bold text-slate-500">
            Aucune action corrective enregistrée.
          </p>
        )}
      </section>
    </AppShell>
  );
}

function ActionRow({ action }: { action: CorrectiveAction }) {
  const status = getCorrectiveActionStatusBadge(action.status);
  const dueState = getCorrectiveActionDueState(action);

  return (
    <tr className="align-top">
      <td className="px-5 py-4">
        <Link
          href={`/actions/${action.$id}`}
          className="font-black text-slate-950 transition hover:text-[#0f4c81] hover:underline"
        >
          {action.title}
        </Link>
      </td>
      <td className="px-5 py-4 font-bold text-slate-700">
        {action.responsable || "Non renseigné"}
      </td>
      <td className="px-5 py-4 text-slate-600">
        <div className="grid gap-2">
          <span>{formatDate(action.dueDate)}</span>
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ring-1 ${dueState.className}`}
          >
            {dueState.label}
          </span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${status.className}`}
        >
          {status.label}
        </span>
      </td>
      <td className="px-5 py-4">
        <Link
          href={`/historique/${action.auditId}`}
          className="font-bold text-[#0f4c81] hover:underline"
        >
          Voir audit
        </Link>
      </td>
    </tr>
  );
}

function ActionCard({ action }: { action: CorrectiveAction }) {
  const status = getCorrectiveActionStatusBadge(action.status);
  const dueState = getCorrectiveActionDueState(action);

  return (
    <article className="grid gap-3 px-4 py-3">
      <div className="grid gap-2">
        <Link
          href={`/actions/${action.$id}`}
          className="text-base font-black text-slate-950 transition hover:text-[#0f4c81] hover:underline"
        >
          {action.title}
        </Link>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${status.className}`}
          >
            {status.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${dueState.className}`}
          >
            {dueState.label}
          </span>
        </div>
      </div>
      <dl className="grid gap-3 text-sm">
        <MobileDetail label="Responsable" value={action.responsable || "Non renseigné"} />
        <MobileDetail label="Échéance" value={formatDate(action.dueDate)} />
      </dl>
      <Link
        href={`/actions/${action.$id}`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Voir détail
      </Link>
    </article>
  );
}

function MobileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-black text-slate-800">{value}</dd>
    </div>
  );
}

function ActionFilters({
  selectedFilter,
}: {
  selectedFilter: CorrectiveActionFilter | undefined;
}) {
  const filters: Array<{
    label: string;
    href: string;
    value?: CorrectiveActionFilter;
  }> = [
    { label: "Toutes", href: "/actions" },
    { label: "Ouvertes", href: "/actions?status=OUVERTE", value: "OUVERTE" },
    { label: "En cours", href: "/actions?status=EN_COURS", value: "EN_COURS" },
    { label: "Clôturées", href: "/actions?status=CLOTUREE", value: "CLOTUREE" },
    { label: "En retard", href: "/actions?status=RETARD", value: "RETARD" },
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = filter.value
          ? selectedFilter === filter.value
          : !selectedFilter;

        return (
          <Link
            key={filter.href}
            href={filter.href}
            className={`inline-flex min-h-11 items-center rounded-lg border px-3 py-2 text-sm font-black transition ${
              isActive
                ? "border-[#0f4c81] bg-blue-50 text-[#0f4c81]"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}

async function getCorrectiveActions(
  filter: CorrectiveActionFilter | undefined,
) {
  try {
    const actions = await readAppwriteCorrectiveActions();
    const filteredActions =
      filter === "RETARD"
        ? actions.filter((action) => isCorrectiveActionOverdue(action))
        : filter
          ? actions.filter((action) => action.status === filter)
          : actions;

    return sortCorrectiveActionsByDate(filteredActions);
  } catch {
    return [];
  }
}

function normalizeFilter(value: string | undefined) {
  if (
    value === "OUVERTE" ||
    value === "EN_COURS" ||
    value === "CLOTUREE" ||
    value === "RETARD"
  ) {
    return value;
  }

  return undefined;
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR").format(date);
}
