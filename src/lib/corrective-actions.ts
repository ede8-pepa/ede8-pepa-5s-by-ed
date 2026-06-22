import type {
  Audit,
  CorrectiveAction,
  CorrectiveActionStatus,
} from "@/lib/types";

export type CorrectiveActionNavigation<
  T extends { $id: string; createdAt?: string },
> = {
  previousAction: T | undefined;
  nextAction: T | undefined;
};

export function getCorrectiveActionStatusBadge(status: CorrectiveActionStatus) {
  if (status === "CLOTUREE") {
    return {
      label: "Clôturée",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (status === "EN_COURS") {
    return {
      label: "En cours",
      className: "bg-orange-50 text-orange-700 ring-orange-200",
    };
  }

  return {
    label: "Ouverte",
    className: "bg-red-50 text-red-700 ring-red-200",
  };
}

export function isCorrectiveActionOverdue(
  action: Pick<CorrectiveAction, "dueDate" | "status">,
  today = new Date(),
) {
  if (action.status === "CLOTUREE" || !action.dueDate) {
    return false;
  }

  const dueDate = new Date(action.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return startOfDay(dueDate).getTime() < startOfDay(today).getTime();
}

export function countOverdueCorrectiveActions(actions: CorrectiveAction[]) {
  return actions.filter((action) => isCorrectiveActionOverdue(action)).length;
}

export function getCorrectiveActionDueState(
  action: Pick<CorrectiveAction, "dueDate" | "status" | "closedAt">,
  today = new Date(),
) {
  if (action.status === "CLOTUREE") {
    return {
      label: action.closedAt
        ? `Clôturée le ${formatDate(action.closedAt)}`
        : "Clôturée",
      tone: "green" as const,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (!action.dueDate) {
    return {
      label: "Échéance non renseignée",
      tone: "neutral" as const,
      className: "bg-slate-50 text-slate-600 ring-slate-200",
    };
  }

  const dueDate = new Date(action.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return {
      label: action.dueDate,
      tone: "neutral" as const,
      className: "bg-slate-50 text-slate-600 ring-slate-200",
    };
  }

  const remainingDays = getDayDifference(today, dueDate);

  if (remainingDays < 0) {
    const overdueDays = Math.abs(remainingDays);

    return {
      label: `En retard de ${overdueDays} jour${overdueDays > 1 ? "s" : ""}`,
      tone: "red" as const,
      className: "bg-red-50 text-red-700 ring-red-200",
    };
  }

  if (remainingDays < 7) {
    return {
      label:
        remainingDays === 0
          ? "Échéance aujourd'hui"
          : `${remainingDays} jour${remainingDays > 1 ? "s" : ""} restant${remainingDays > 1 ? "s" : ""}`,
      tone: "orange" as const,
      className: "bg-orange-50 text-orange-700 ring-orange-200",
    };
  }

  return {
    label: `${remainingDays} jours restants`,
    tone: "green" as const,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
}

export function getTopResponsablesWithOpenActions(actions: CorrectiveAction[]) {
  return sortEntriesByCount(
    actions
      .filter((action) => action.status !== "CLOTUREE")
      .map((action) => action.responsable?.trim() || "Non renseigné"),
  );
}

export function getTopZonesWithOpenActions(
  actions: CorrectiveAction[],
  audits: Audit[],
) {
  const zoneByAuditId = new Map(
    audits.map((audit) => [audit.$id, audit.zoneName || "Zone inconnue"]),
  );

  return sortEntriesByCount(
    actions
      .filter((action) => action.status !== "CLOTUREE")
      .map((action) => zoneByAuditId.get(action.auditId) ?? "Zone inconnue"),
  );
}

export function sortCorrectiveActionsByDate<T extends { createdAt?: string }>(
  actions: T[],
) {
  return [...actions].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? "").getTime();
    const rightTime = new Date(right.createdAt ?? "").getTime();
    return rightTime - leftTime;
  });
}

export function getCorrectiveActionNavigation<
  T extends { $id: string; createdAt?: string },
>(actions: T[], actionId: string): CorrectiveActionNavigation<T> {
  const sortedActions = sortCorrectiveActionsByDate(actions);
  const currentIndex = sortedActions.findIndex(
    (action) => action.$id === actionId,
  );

  if (currentIndex === -1) {
    return {
      previousAction: undefined,
      nextAction: undefined,
    };
  }

  return {
    previousAction: sortedActions[currentIndex - 1],
    nextAction: sortedActions[currentIndex + 1],
  };
}

function getDayDifference(from: Date, to: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) /
      millisecondsPerDay,
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sortEntriesByCount(values: string[]) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label),
    );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR").format(date);
}
