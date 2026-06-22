import type { DashboardData, Zone } from "@/lib/types";

export const zones: Zone[] = [
  {
    id: "cal1",
    name: "CAL1",
    line: "Conditionnement",
    score: 86,
    openActions: 3,
    lastAudit: "18 juin 2026",
    status: "A surveiller",
  },
  {
    id: "cal2",
    name: "CAL2",
    line: "Conditionnement",
    score: 91,
    openActions: 1,
    lastAudit: "17 juin 2026",
    status: "Conforme",
  },
  {
    id: "m1",
    name: "M1",
    line: "Production",
    score: 78,
    openActions: 5,
    lastAudit: "16 juin 2026",
    status: "A surveiller",
  },
  {
    id: "m2",
    name: "M2",
    line: "Production",
    score: 88,
    openActions: 2,
    lastAudit: "14 juin 2026",
    status: "Conforme",
  },
  {
    id: "m3",
    name: "M3",
    line: "Production",
    score: 72,
    openActions: 7,
    lastAudit: "13 juin 2026",
    status: "Prioritaire",
  },
  {
    id: "stockage-palettes-box",
    name: "Stockage palettes & box",
    line: "Logistique",
    score: 81,
    openActions: 4,
    lastAudit: "12 juin 2026",
    status: "A surveiller",
  },
];

export const dashboardData: DashboardData = {
  kpis: [
    {
      label: "Score global",
      value: "83%",
      helper: "Moyenne des zones V1",
      tone: "blue",
    },
    {
      label: "CAL1",
      value: "86%",
      helper: "Dernier audit fictif",
      tone: "green",
    },
    {
      label: "CAL2",
      value: "91%",
      helper: "Dernier audit fictif",
      tone: "steel",
    },
    {
      label: "Actions ouvertes",
      value: "12",
      helper: "Fallback fictif",
      tone: "amber",
    },
  ],
  zones,
  auditTrend: [
    { label: "S-4", score: 78 },
    { label: "S-3", score: 80 },
    { label: "S-2", score: 82 },
    { label: "S-1", score: 83 },
    { label: "S", score: 85 },
  ],
  appwrite: {
    connected: false,
    source: "mock",
    message: "Données fictives",
  },
};
