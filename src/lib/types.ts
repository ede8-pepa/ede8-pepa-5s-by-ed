export type ZoneId = string;

export type Zone = {
  id: ZoneId;
  name: string;
  line: string;
  score: number;
  openActions: number;
  lastAudit: string;
  status: "Conforme" | "A surveiller" | "Prioritaire";
};

export type Kpi = {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "steel" | "amber" | "green" | "red";
  href?: string;
  placeholder?: boolean;
};

export type DashboardData = {
  kpis: Kpi[];
  insights?: DashboardInsights;
  zones: Zone[];
  auditTrend: {
    label: string;
    score: number;
  }[];
  appwrite: AppwriteConnectionState;
};

export type DashboardInsights = {
  criticalFindings: number;
  majorFindings: number;
  topFindings: Array<{
    criterion: string;
    count: number;
    href: string;
  }>;
  zoneScores: Array<{
    zoneName: string;
    score: number | undefined;
    auditCount: number;
    href: string;
  }>;
  weakestZone:
    | {
        zoneName: string;
        score: number;
        href: string;
      }
    | undefined;
  strongestZone:
    | {
        zoneName: string;
        score: number;
        href: string;
      }
    | undefined;
};

export type AuditProvider = {
  getDashboardData: () => Promise<DashboardData>;
  getZones: () => Promise<Zone[]>;
};

export type AppwriteConnectionState = {
  connected: boolean;
  source: "appwrite" | "mock";
  message: string;
};

export type Audit = {
  $id: string;
  id: string;
  zoneId: string;
  zoneName: string;
  auditorName: string;
  shift: "Matin" | "Soir" | string;
  scorePercent: number;
  status: string;
  createdAt?: string;
};

export type AuditAnswer = {
  $id: string;
  id: string;
  auditId: string;
  criterionLabel: string;
  score: number;
  comment?: string;
  hasGap: boolean;
};

export type CorrectiveAction = {
  $id: string;
  id: string;
  title: string;
  description?: string;
  auditId: string;
  auditAnswerId?: string;
  responsable?: string;
  dueDate?: string;
  status: CorrectiveActionStatus;
  createdAt?: string;
  closedAt?: string;
};

export type CorrectiveActionStatus = "OUVERTE" | "EN_COURS" | "CLOTUREE";

export type PhotoModuleType = "audit" | "correctiveAction";

export type PhotoMetadata = {
  $id: string;
  id: string;
  fileId: string;
  moduleType: PhotoModuleType;
  entityId: string;
  companyId?: string;
  siteId?: string;
  zoneId?: string;
  uploadedBy?: string;
  createdAt?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  deletedAt?: string;
};

export type CreatePhotoMetadataInput = {
  fileId: string;
  moduleType: PhotoModuleType;
  entityId: string;
  companyId?: string;
  siteId?: string;
  zoneId?: string;
  uploadedBy?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
};

export type Standard = {
  $id: string;
  id: string;
  zoneId: string;
  title: string;
  description?: string;
  rules?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCorrectiveActionInput = {
  title: string;
  description?: string;
  auditId: string;
  auditAnswerId?: string;
  responsable?: string;
  dueDate?: string;
};

export type AppwriteTablesData = {
  zones: Zone[];
  audits: Audit[];
  auditAnswers: AuditAnswer[];
  correctiveActions: CorrectiveAction[];
  photos: PhotoMetadata[];
};

export type CreateAuditInput = {
  zoneId: string;
  zoneName: string;
  auditorName: string;
  shift: "Matin" | "Soir";
  scorePercent: number;
  status: string;
};

export type CreateAuditAnswerInput = {
  auditId: string;
  criterionLabel: string;
  score: number;
  comment: string;
  hasGap: boolean;
};
