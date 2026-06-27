import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CorrectiveActionForm } from "@/components/corrective-action-form";
import { PageHeader } from "@/components/page-header";
import { PhotoManager } from "@/components/photo-tools";
import {
  countAuditFindings,
  getAuditFindingStatus,
} from "@/lib/audit-findings";
import { getAuditScoreStatus } from "@/lib/audit-status";
import {
  getAuditDetail,
  getAuditNavigation,
} from "@/lib/data/audit-history-provider";
import { readAppwritePhotos } from "@/lib/data/appwrite-service";
import type { PhotoMetadata } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { audit, answers } = await getAuditDetail(id);
  const navigation = await getAuditNavigation(id);
  const status = audit ? getAuditScoreStatus(audit.scorePercent) : undefined;
  const findingCounts = countAuditFindings(answers);
  const photos = audit ? await readPhotosSafely("audit", audit.$id) : [];

  if (!audit) {
    return (
      <AppShell activePath="/historique">
        <PageHeader
          eyebrow="Detail audit"
          title="Audit introuvable"
          description="L'audit demande est introuvable dans Appwrite avec cet identifiant systeme."
          action={<BackLink />}
        />
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/historique">
      <PageHeader
        eyebrow="Detail audit"
        title={audit.zoneName || "Audit"}
        description={`${formatDate(audit.createdAt)} - ${audit.auditorName || "Auditeur inconnu"} - ${audit.shift || "Poste non renseigne"}`}
      />

      <AuditNavigation navigation={navigation} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Score" value={`${audit.scorePercent}%`} />
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-bold text-slate-500">Statut</p>
          <p
            className={`mt-3 inline-flex rounded-full px-3 py-2 text-sm font-black ring-1 ${status?.className}`}
          >
            {status?.label}
          </p>
        </div>
        <FindingsSummary counts={findingCounts} />
      </section>

      <PhotoManager
        moduleType="audit"
        entityId={audit.$id}
        zoneId={audit.zoneId}
        initialPhotos={photos}
        title="Photos de l'audit"
        emptyLabel="Aucune photo enregistrée pour cet audit."
      />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-black text-slate-950">
            Reponses de l&apos;audit
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {answers.length} critere{answers.length > 1 ? "s" : ""} renseigne
            {answers.length > 1 ? "s" : ""}.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {answers.length > 0 ? (
            answers.map((answer) => (
              <AnswerRow key={answer.id} answer={answer} auditId={audit.$id} />
            ))
          ) : (
            <p className="px-5 py-4 text-sm font-bold text-slate-500">
              Aucune réponse enregistrée pour cet audit.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

async function readPhotosSafely(
  moduleType: "audit",
  entityId: string,
): Promise<PhotoMetadata[]> {
  try {
    return await readAppwritePhotos(moduleType, entityId);
  } catch {
    return [];
  }
}

function AuditNavigation({
  navigation,
}: {
  navigation: Awaited<ReturnType<typeof getAuditNavigation>>;
}) {
  return (
    <nav className="mb-4 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <AuditNavigationLink auditId={navigation.previousAudit?.$id}>
        ← Précédent
      </AuditNavigationLink>
      <BackLink compact />
      <AuditNavigationLink auditId={navigation.nextAudit?.$id}>
        Suivant →
      </AuditNavigationLink>
    </nav>
  );
}

function AuditNavigationLink({
  auditId,
  children,
}: {
  auditId: string | undefined;
  children: string;
}) {
  const className =
    "inline-flex min-h-11 items-center justify-center px-2 py-2 text-center text-xs font-black text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:text-sm";

  if (!auditId) {
    return (
      <span
        aria-disabled="true"
        className={`${className} cursor-not-allowed opacity-45`}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={`/historique/${auditId}`} className={className}>
      {children}
    </Link>
  );
}

function AnswerRow({
  answer,
  auditId,
}: {
  answer: Awaited<ReturnType<typeof getAuditDetail>>["answers"][number];
  auditId: string;
}) {
  const status = getAuditFindingStatus(answer.score);

  return (
    <article className="grid min-w-0 gap-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_90px_130px] md:items-center">
      <div className="min-w-0">
        <h3 className="font-black text-slate-950">{answer.criterionLabel}</h3>
        <p className="mt-1 break-words text-sm text-slate-500">
          {answer.comment || "Aucun commentaire"}
        </p>
        {answer.score <= 3 ? (
          <CorrectiveActionForm
            auditId={auditId}
            auditAnswerId={answer.$id}
            criterionLabel={answer.criterionLabel}
          />
        ) : null}
      </div>
      <span className="rounded-lg bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-800">
        {answer.score}/5
      </span>
      <span
        className={`rounded-full px-3 py-2 text-center text-xs font-black ring-1 ${status.className}`}
      >
        {status.label}
      </span>
    </article>
  );
}

function BackLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/historique"
      className={
        compact
          ? "inline-flex min-h-11 items-center justify-center border-x border-slate-200 px-2 py-2 text-center text-xs font-black text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:text-sm"
          : "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
      }
    >
      {compact ? "Historique" : "Retour historique"}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function FindingsSummary({
  counts,
}: {
  counts: ReturnType<typeof countAuditFindings>;
}) {
  const rows = [
    {
      label: "Conformes",
      value: counts.conformes,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    {
      label: "Observations",
      value: counts.observations,
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    {
      label: "Écarts mineurs",
      value: counts.ecartsMineurs,
      className: "bg-orange-50 text-orange-700 ring-orange-200",
    },
    {
      label: "Écarts majeurs",
      value: counts.ecartsMajeurs,
      className: "bg-red-50 text-red-700 ring-red-200",
    },
    {
      label: "Écarts critiques",
      value: counts.ecartsCritiques,
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    },
  ].filter((row) => row.value > 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">
        Répartition des constats
      </p>
      {rows.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <span
                className={`rounded-full px-2.5 py-1 font-black ring-1 ${row.className}`}
              >
                {row.label}
              </span>
              <span className="font-black text-slate-950">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm font-bold text-slate-500">
          Aucun constat disponible.
        </p>
      )}
    </div>
  );
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
