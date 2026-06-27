import { dashboardData, zones } from "@/lib/mock-data";
import { countOverdueCorrectiveActions } from "@/lib/corrective-actions";
import { buildDashboardInsights } from "@/lib/dashboard-insights";
import { mockAuditAnswers, mockAudits } from "@/lib/mock-audits";
import {
  readAppwriteAllAuditAnswers,
  readAppwriteAudits,
  readAppwriteCorrectiveActions,
  readAppwriteZones,
} from "@/lib/data/appwrite-service";
import type {
  Audit,
  AuditProvider,
  CorrectiveAction,
  AuditAnswer,
  DashboardData,
  DashboardInsights,
  Zone,
} from "@/lib/types";

const APPWRITE_READ_TIMEOUT_MS = 3000;

export const auditProvider: AuditProvider = {
  async getDashboardData() {
    try {
      const [appwriteZones, appwriteAudits, correctiveActions] =
        await withTimeout(
          Promise.all([
            readAppwriteZones(),
            readAppwriteAudits(),
            readAppwriteCorrectiveActions(),
          ]),
        APPWRITE_READ_TIMEOUT_MS,
      );
      const auditAnswers = await readDashboardAuditAnswers(appwriteAudits);

      if (appwriteZones.length === 0) {
        const insights = buildDashboardInsights(
          appwriteAudits.length > 0 ? appwriteAudits : mockAudits,
          auditAnswers.length > 0 ? auditAnswers : getMockAuditAnswers(),
        );

        return {
          ...dashboardData,
          insights,
          kpis: addCorrectiveActionKpis(
            addRiskKpis(
              addAuditKpis(addDashboardKpiLinks(dashboardData.kpis), appwriteAudits),
              insights,
            ),
            correctiveActions,
          ),
          appwrite: {
            connected: true,
            source: "mock",
            message: "Appwrite connecte, tables vides",
          },
        };
      }

      return buildDashboardData(
        appwriteZones,
        appwriteAudits,
        correctiveActions,
        auditAnswers,
      );
    } catch {
      const insights = buildDashboardInsights(mockAudits, getMockAuditAnswers());

      return {
        ...dashboardData,
        insights,
        kpis: addCorrectiveActionKpis(
          addRiskKpis(
            addAuditKpis(addDashboardKpiLinks(dashboardData.kpis), []),
            insights,
          ),
          [],
        ),
        appwrite: {
          connected: false,
          source: "mock",
          message: "Appwrite non connecte",
        },
      };
    }
  },
  async getZones() {
    try {
      const appwriteZones = await withTimeout(
        readAppwriteZones(),
        APPWRITE_READ_TIMEOUT_MS,
      );
      return appwriteZones.length > 0 ? appwriteZones : zones;
    } catch {
      return zones;
    }
  },
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Appwrite read timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function addDashboardKpiLinks(kpis: DashboardData["kpis"]) {
  return kpis
    .filter((kpi) => kpi.label !== "CAL1" && kpi.label !== "CAL2")
    .map((kpi) =>
      kpi.label === "Score global" ? { ...kpi, href: "/historique" } : kpi,
    );
}

function buildDashboardData(
  appwriteZones: Zone[],
  appwriteAudits: Audit[],
  correctiveActions: CorrectiveAction[],
  auditAnswers: AuditAnswer[],
): DashboardData {
  const dashboardZones = appwriteZones;
  const globalScore = average(dashboardZones.map((zone) => zone.score));
  const baseKpis = [
    {
      label: "Score global",
      value: `${globalScore}%`,
      helper: "Zones lues depuis Appwrite",
      tone: "blue" as const,
      href: "/historique",
    },
  ];

  const insights = buildDashboardInsights(appwriteAudits, auditAnswers);

  return {
    insights,
    kpis: addCorrectiveActionKpis(
      addRiskKpis(addAuditKpis(baseKpis, appwriteAudits), insights),
      correctiveActions,
    ),
    zones: dashboardZones,
    auditTrend: dashboardData.auditTrend,
    appwrite: {
      connected: true,
      source: "appwrite",
      message: "Zones Appwrite connectees",
    },
  };
}

function addRiskKpis(
  kpis: DashboardData["kpis"],
  insights: DashboardInsights,
) {
  const withoutRiskPlaceholders = kpis.filter(
    (kpi) =>
      kpi.label !== "Écarts critiques" && kpi.label !== "Écarts majeurs",
  );

  return [
    ...withoutRiskPlaceholders,
    {
      label: "Écarts critiques",
      value: String(insights.criticalFindings),
      helper: "Notes 1/5",
      tone: "red" as const,
      href: "/historique?score=1",
    },
    {
      label: "Écarts majeurs",
      value: String(insights.majorFindings),
      helper: "Notes 2/5",
      tone: "amber" as const,
      href: "/historique?score=2",
    },
  ];
}

async function readDashboardAuditAnswers(audits: Audit[]) {
  if (audits.length === 0) {
    return [];
  }

  try {
    return await withTimeout(
      readAppwriteAllAuditAnswers(),
      APPWRITE_READ_TIMEOUT_MS,
    );
  } catch {
    return [];
  }
}

function getMockAuditAnswers() {
  return Object.values(mockAuditAnswers).flat();
}

function addCorrectiveActionKpis(
  kpis: DashboardData["kpis"],
  correctiveActions: CorrectiveAction[],
) {
  const withoutLegacyOpenActions = kpis.filter(
    (kpi) => kpi.label !== "Actions ouvertes",
  );
  const opened = correctiveActions.filter(
    (action) => action.status === "OUVERTE",
  ).length;
  const inProgress = correctiveActions.filter(
    (action) => action.status === "EN_COURS",
  ).length;
  const closed = correctiveActions.filter(
    (action) => action.status === "CLOTUREE",
  ).length;
  const overdue = countOverdueCorrectiveActions(correctiveActions);

  return [
    ...withoutLegacyOpenActions,
    {
      label: "Actions ouvertes",
      value: String(opened),
      helper: "Statut OUVERTE",
      tone: "red" as const,
      href: "/actions?status=OUVERTE",
    },
    {
      label: "Actions en cours",
      value: String(inProgress),
      helper: "Statut EN_COURS",
      tone: "amber" as const,
      href: "/actions?status=EN_COURS",
    },
    {
      label: "Actions clôturées",
      value: String(closed),
      helper: "Statut CLOTUREE",
      tone: "green" as const,
      href: "/actions?status=CLOTUREE",
    },
    {
      label: "Actions en retard",
      value: String(overdue),
      helper: "Échéance dépassée",
      tone: "red" as const,
      href: "/actions?status=RETARD",
    },
    ...buildPlaceholderKpis(),
  ];
}

function addAuditKpis(kpis: DashboardData["kpis"], audits: Audit[]) {
  const latestAudit = getLatestAudit(audits);

  return [
    ...kpis,
    {
      label: "Audits réalisés",
      value: String(audits.length),
      helper: audits.length > 0 ? "Depuis Appwrite" : "Aucun audit Appwrite",
      tone: "blue" as const,
      href: "/historique",
    },
    {
      label: "Dernier audit",
      value: latestAudit ? `${latestAudit.scorePercent}%` : "-",
      helper: latestAudit
        ? `${latestAudit.zoneName} - ${formatDate(latestAudit.createdAt)}`
        : "Aucun audit enregistre",
      tone: "steel" as const,
      href: latestAudit ? `/historique/${latestAudit.$id}` : undefined,
    },
  ];
}

function buildPlaceholderKpis(): DashboardData["kpis"] {
  return [];
}

function getLatestAudit(audits: Audit[]) {
  return [...audits].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? "").getTime();
    const rightTime = new Date(right.createdAt ?? "").getTime();
    return rightTime - leftTime;
  })[0];
}

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value));

  if (validValues.length === 0) {
    return 0;
  }

  return Math.round(
    validValues.reduce((sum, value) => sum + value, 0) / validValues.length,
  );
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "date inconnue";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR").format(date);
}
