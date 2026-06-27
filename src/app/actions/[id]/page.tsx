import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CorrectiveActionStatusActions } from "@/components/corrective-action-status-actions";
import { PageHeader } from "@/components/page-header";
import { PhotoManager } from "@/components/photo-tools";
import {
  type CorrectiveActionNavigation,
  getCorrectiveActionNavigation,
  getCorrectiveActionDueState,
  getCorrectiveActionStatusBadge,
} from "@/lib/corrective-actions";
import {
  readAppwriteAudit,
  readAppwriteCorrectiveAction,
  readAppwriteCorrectiveActions,
  readAppwritePhotos,
} from "@/lib/data/appwrite-service";
import type { Audit, CorrectiveAction, PhotoMetadata } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CorrectiveActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { action, audit, navigation, photos } =
    await getCorrectiveActionDetail(id);

  if (!action) {
    return (
      <AppShell activePath="/actions">
        <PageHeader
          eyebrow="Action corrective"
          title="Action introuvable"
          description="Cette action corrective est introuvable dans Appwrite."
          action={<BackLink />}
        />
      </AppShell>
    );
  }

  const status = getCorrectiveActionStatusBadge(action.status);
  const dueState = getCorrectiveActionDueState(action);

  return (
    <AppShell activePath="/actions">
      <PageHeader
        eyebrow="Action corrective"
        title={action.title}
        description="Pilotez l'action jusqu'à sa clôture."
      />

      <ActionNavigation navigation={navigation} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${status.className}`}
              >
                {status.label}
              </span>
              <span
                className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${dueState.className}`}
              >
                {dueState.label}
              </span>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Responsable" value={action.responsable} />
              <DetailItem label="Échéance">
                <span className="grid gap-1">
                  <span>{formatDate(action.dueDate)}</span>
                  <span className="text-sm text-slate-500">
                    {dueState.label}
                  </span>
                </span>
              </DetailItem>
              <DetailItem label="Audit associé">
                <Link
                  href={`/historique/${action.auditId}`}
                  className="font-black text-[#0f4c81] hover:underline"
                >
                  {audit ? audit.zoneName : action.auditId}
                </Link>
              </DetailItem>
              <DetailItem label="Statut" value={action.status} />
            </dl>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-black text-slate-500">
                Description
              </h2>
              <p className="mt-2 leading-7 text-slate-700">
                {action.description || "Aucune description renseignée."}
              </p>
            </div>
          </article>

          <PhotoManager
            moduleType="correctiveAction"
            entityId={action.$id}
            initialPhotos={photos}
            title="Photos de l'action"
            emptyLabel="Aucune photo enregistrée pour cette action."
          />
        </div>

        <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Avancement</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Une action ouverte peut passer en cours, puis être clôturée.
          </p>
          <div className="mt-5">
            <CorrectiveActionStatusActions
              actionId={action.$id}
              status={action.status}
            />
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function ActionNavigation({
  navigation,
}: {
  navigation: CorrectiveActionNavigation<CorrectiveAction>;
}) {
  return (
    <nav className="mb-6 grid gap-3 sm:grid-cols-3">
      <ActionNavigationLink actionId={navigation.previousAction?.$id}>
        Action précédente
      </ActionNavigationLink>
      <BackLink />
      <ActionNavigationLink actionId={navigation.nextAction?.$id}>
        Action suivante
      </ActionNavigationLink>
    </nav>
  );
}

function ActionNavigationLink({
  actionId,
  children,
}: {
  actionId: string | undefined;
  children: string;
}) {
  const className =
    "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50";

  if (!actionId) {
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
    <Link href={`/actions/${actionId}`} className={className}>
      {children}
    </Link>
  );
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 font-black text-slate-950">
        {children ?? value ?? "Non renseigné"}
      </dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/actions"
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      Retour actions
    </Link>
  );
}

async function getCorrectiveActionDetail(actionId: string): Promise<{
  action: CorrectiveAction | undefined;
  audit: Audit | undefined;
  navigation: CorrectiveActionNavigation<CorrectiveAction>;
  photos: PhotoMetadata[];
}> {
  try {
    const [action, actions] = await Promise.all([
      readAppwriteCorrectiveAction(actionId),
      readAppwriteCorrectiveActions(),
    ]);
    let audit: Audit | undefined;
    let photos: PhotoMetadata[] = [];

    try {
      audit = await readAppwriteAudit(action.auditId);
    } catch {
      audit = undefined;
    }

    try {
      photos = await readAppwritePhotos("correctiveAction", action.$id);
    } catch {
      photos = [];
    }

    return {
      action,
      audit,
      navigation: getCorrectiveActionNavigation(actions, actionId),
      photos,
    };
  } catch {
    return {
      action: undefined,
      audit: undefined,
      navigation: {
        previousAction: undefined,
        nextAction: undefined,
      },
      photos: [],
    };
  }
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
