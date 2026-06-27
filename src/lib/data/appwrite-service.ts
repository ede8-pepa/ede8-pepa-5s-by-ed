import {
  appwriteConfig,
  createAppwriteHeaders,
  createCollectionUrl,
  createCollectionUrlWithParams,
  createDocumentUrl,
  createStorageFilePreviewUrl,
  createStorageFileUrl,
  createStorageFilesUrl,
  createStorageFileViewUrl,
} from "@/lib/appwrite";
import type {
  Audit,
  AuditAnswer,
  CorrectiveAction,
  CorrectiveActionStatus,
  CreateAuditAnswerInput,
  CreateAuditInput,
  CreateCorrectiveActionInput,
  CreatePhotoMetadataInput,
  PhotoMetadata,
  PhotoModuleType,
  Standard,
  Zone,
} from "@/lib/types";

type AppwriteDocument = {
  $id: string;
  [key: string]: unknown;
};

type ReadResult<T> = {
  documents: T[];
  hasDocuments: boolean;
};

const APPWRITE_READ_FETCH_TIMEOUT_MS = 3000;
const APPWRITE_WRITE_FETCH_TIMEOUT_MS = 30000;
const APPWRITE_STORAGE_FETCH_TIMEOUT_MS = 60000;
const APPWRITE_AUDITS_LIST_LIMIT = 100;
const APPWRITE_AUDIT_ANSWERS_LIST_LIMIT = 500;

export async function readAppwriteZones(): Promise<Zone[]> {
  const zones = await readCollection(appwriteConfig.collections.zones, mapZone);
  return zones.documents;
}

export async function readAppwriteAudits(): Promise<Audit[]> {
  const audits = await readCollection(
    appwriteConfig.collections.audits,
    mapAudit,
    {
      "queries[]": [
        createOrderDescQuery("$createdAt"),
        createLimitQuery(APPWRITE_AUDITS_LIST_LIMIT),
      ],
    },
    "no-store",
  );
  return audits.documents;
}

export async function readAppwriteAudit(auditId: string): Promise<Audit> {
  return readDocument(appwriteConfig.collections.audits, auditId, mapAudit);
}

export async function readAppwriteAuditAnswers(
  auditId: string,
): Promise<AuditAnswer[]> {
  const answers = await readCollection(
    appwriteConfig.collections.auditAnswers,
    mapAuditAnswer,
    {
      "queries[]": [
        createEqualQuery("audit_id", auditId),
        createLimitQuery(APPWRITE_AUDITS_LIST_LIMIT),
      ],
    },
    "no-store",
  );
  return answers.documents;
}

export async function readAppwriteAllAuditAnswers(): Promise<AuditAnswer[]> {
  const answers = await readCollection(
    appwriteConfig.collections.auditAnswers,
    mapAuditAnswer,
    {
      "queries[]": [createLimitQuery(APPWRITE_AUDIT_ANSWERS_LIST_LIMIT)],
    },
    "no-store",
  );
  return answers.documents;
}

export async function createAudit(input: CreateAuditInput): Promise<Audit> {
  console.log("[audit-debug][service] 3. createAudit() start", {
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.audits,
    input,
  });
  const document = await createDocument(appwriteConfig.collections.audits, {
    zone_id: input.zoneId,
    zone_name: input.zoneName,
    auditor_name: input.auditorName,
    shift: input.shift,
    score_percent: input.scorePercent,
    status: input.status,
  });
  console.log("[audit-debug][service] 4. reponse Appwrite audit", document);

  if (!document.$id) {
    throw new Error(
      "Réponse Appwrite invalide : aucun $id retourné pour l'audit créé.",
    );
  }

  const audit = mapAudit(document);
  console.log("[audit-debug][service] 5. ID retourne", { auditId: audit.$id });

  return audit;
}

export async function createAuditAnswers(
  answers: CreateAuditAnswerInput[],
): Promise<AuditAnswer[]> {
  const documents = await Promise.all(
    answers.map((answer) =>
      createDocument(appwriteConfig.collections.auditAnswers, {
        audit_id: answer.auditId,
        criterion_label: answer.criterionLabel,
        score: answer.score,
        comment: answer.comment,
        has_gap: answer.hasGap,
      }),
    ),
  );

  return documents.map(mapAuditAnswer);
}

export async function readAppwriteCorrectiveActions(): Promise<
  CorrectiveAction[]
> {
  const actions = await readCollection(
    appwriteConfig.collections.correctiveActions,
    mapCorrectiveAction,
    undefined,
    "no-store",
  );
  return actions.documents;
}

export async function readAppwriteCorrectiveAction(
  actionId: string,
): Promise<CorrectiveAction> {
  return readDocument(
    appwriteConfig.collections.correctiveActions,
    actionId,
    mapCorrectiveAction,
    "no-store",
  );
}

export async function createCorrectiveAction(
  input: CreateCorrectiveActionInput,
): Promise<CorrectiveAction> {
  const document = await createDocument(
    appwriteConfig.collections.correctiveActions,
    compactData({
      title: input.title,
      description: input.description,
      audit_id: input.auditId,
      audit_answer_id: input.auditAnswerId,
      responsable: input.responsable,
      due_date: input.dueDate,
      status: "OUVERTE",
    }),
  );

  return mapCorrectiveAction(document);
}

export async function readAppwriteStandards(): Promise<Standard[]> {
  const standards = await readCollection(
    appwriteConfig.collections.standards,
    mapStandard,
  );
  return standards.documents;
}

export async function readAppwriteStandardsByZone(
  zoneId: string,
): Promise<Standard[]> {
  const standards = await readCollection(
    appwriteConfig.collections.standards,
    mapStandard,
    { "queries[]": createEqualQuery("zone_id", zoneId) },
  );
  return standards.documents;
}

export async function updateCorrectiveActionStatus(
  actionId: string,
  status: Extract<CorrectiveActionStatus, "EN_COURS" | "CLOTUREE">,
): Promise<CorrectiveAction> {
  const document = await updateDocument(
    appwriteConfig.collections.correctiveActions,
    actionId,
    compactData({
      status,
      closed_at: status === "CLOTUREE" ? new Date().toISOString() : undefined,
    }),
  );

  return mapCorrectiveAction(document);
}

export async function readAppwritePhotos(
  moduleType: PhotoModuleType,
  entityId: string,
): Promise<PhotoMetadata[]> {
  try {
    const photos = await readCollection(
      appwriteConfig.collections.photos,
      mapPhotoMetadata,
      {
        "queries[]": [
          createEqualQuery("module_type", moduleType),
          createEqualQuery("entity_id", entityId),
        ],
      },
      "no-store",
    );

    return filterPhotosByContext(photos.documents, moduleType, entityId);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[photos] Appwrite filtered read failed", {
        moduleType,
        entityId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }

    const photos = await readCollection(
      appwriteConfig.collections.photos,
      mapPhotoMetadata,
      undefined,
      "no-store",
    );

    return filterPhotosByContext(photos.documents, moduleType, entityId);
  }
}

export async function readAppwritePhoto(photoId: string): Promise<PhotoMetadata> {
  return readDocument(
    appwriteConfig.collections.photos,
    photoId,
    mapPhotoMetadata,
    "no-store",
  );
}

export async function uploadAppwritePhotoFile(file: File): Promise<{
  fileId: string;
}> {
  const fileId = crypto.randomUUID();
  const formData = new FormData();
  formData.set("fileId", fileId);
  formData.set("file", file);

  const response = await fetchWithTimeout(
    createStorageFilesUrl(),
    {
      method: "POST",
      headers: createAppwriteHeaders(""),
      body: formData,
    },
    APPWRITE_STORAGE_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    const message = await readAppwriteError(response);
    throw new Error(message);
  }

  const payload = (await response.json()) as { $id?: string };

  return {
    fileId: stringFrom(payload.$id ?? fileId),
  };
}

export async function createPhotoMetadata(
  input: CreatePhotoMetadataInput,
): Promise<PhotoMetadata> {
  const document = await createDocument(
    appwriteConfig.collections.photos,
    compactData({
      file_id: input.fileId,
      module_type: input.moduleType,
      entity_id: input.entityId,
      company_id: input.companyId,
      site_id: input.siteId,
      zone_id: input.zoneId,
      uploaded_by: input.uploadedBy,
      file_name: input.fileName,
      file_size: input.fileSize,
      mime_type: input.mimeType,
      storage_path: input.storagePath,
    }),
  );

  return mapPhotoMetadata(document);
}

export async function deleteAppwritePhoto(photoId: string) {
  const photo = await readAppwritePhoto(photoId);

  await deleteStorageFile(photo.fileId);
  await deleteDocument(appwriteConfig.collections.photos, photoId);
}

export async function readPhotoFileResponse(
  fileId: string,
  variant: "thumb" | "full",
) {
  const url =
    variant === "thumb"
      ? `${createStorageFilePreviewUrl(fileId)}?width=360&height=360&gravity=center&quality=70`
      : createStorageFileViewUrl(fileId);
  const response = await fetchWithTimeout(
    url,
    {
      headers: createAppwriteHeaders(""),
      cache: "no-store",
    },
    APPWRITE_STORAGE_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    const message = await readAppwriteError(response);
    throw new Error(message);
  }

  return response;
}

async function readCollection<T>(
  collectionId: string,
  mapDocument: (document: AppwriteDocument) => T,
  params?: Record<string, string | string[]>,
  cacheMode: "revalidate" | "no-store" = "revalidate",
): Promise<ReadResult<T>> {
  const response = await fetchWithTimeout(
    params
      ? createCollectionUrlWithParams(collectionId, params)
      : createCollectionUrl(collectionId),
    {
      headers: createAppwriteHeaders(),
      ...(cacheMode === "no-store"
          ? { cache: "no-store" as const }
          : { next: { revalidate: 60 } }),
    },
    APPWRITE_READ_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`Appwrite read failed for ${collectionId}`);
  }

  const payload = (await response.json()) as { documents?: AppwriteDocument[] };
  const documents = (payload.documents ?? []).map((document) =>
    mapDocument(document as AppwriteDocument),
  );

  return {
    documents,
    hasDocuments: documents.length > 0,
  };
}

async function readDocument<T>(
  collectionId: string,
  documentId: string,
  mapDocument: (document: AppwriteDocument) => T,
  cacheMode: "revalidate" | "no-store" = "revalidate",
): Promise<T> {
  const response = await fetchWithTimeout(
    createDocumentUrl(collectionId, documentId),
    {
      headers: createAppwriteHeaders(),
      ...(cacheMode === "no-store"
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    },
    APPWRITE_READ_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`Appwrite read failed for ${collectionId}/${documentId}`);
  }

  return mapDocument((await response.json()) as AppwriteDocument);
}

async function createDocument(
  collectionId: string,
  data: Record<string, unknown>,
): Promise<AppwriteDocument> {
  console.log("[audit-debug][service] createDocument request", {
    collectionId,
    data,
  });
  const response = await fetchWithTimeout(
    createCollectionUrl(collectionId),
    {
      method: "POST",
      headers: createAppwriteHeaders(),
      body: JSON.stringify({
        documentId: "unique()",
        data,
      }),
    },
    APPWRITE_WRITE_FETCH_TIMEOUT_MS,
  );
  console.log("[audit-debug][service] createDocument response status", {
    collectionId,
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    const message = await readAppwriteError(response);
    console.error("[audit-debug][service] createDocument error", {
      collectionId,
      message,
    });
    throw new Error(message);
  }

  const payload = (await response.json()) as AppwriteDocument;
  console.log("[audit-debug][service] createDocument payload", {
    collectionId,
    id: payload.$id,
    payload,
  });

  return payload;
}

async function updateDocument(
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>,
): Promise<AppwriteDocument> {
  const response = await fetchWithTimeout(
    createDocumentUrl(collectionId, documentId),
    {
      method: "PATCH",
      headers: createAppwriteHeaders(),
      body: JSON.stringify({ data }),
    },
    APPWRITE_WRITE_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    const message = await readAppwriteError(response);
    throw new Error(message);
  }

  return (await response.json()) as AppwriteDocument;
}

async function deleteDocument(collectionId: string, documentId: string) {
  const response = await fetchWithTimeout(
    createDocumentUrl(collectionId, documentId),
    {
      method: "DELETE",
      headers: createAppwriteHeaders(),
    },
    APPWRITE_WRITE_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    const message = await readAppwriteError(response);
    throw new Error(message);
  }
}

async function deleteStorageFile(fileId: string) {
  const response = await fetchWithTimeout(
    createStorageFileUrl(fileId),
    {
      method: "DELETE",
      headers: createAppwriteHeaders(""),
    },
    APPWRITE_STORAGE_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    const message = await readAppwriteError(response);
    throw new Error(message);
  }
}

function mapZone(document: AppwriteDocument): Zone {
  const score = numberFrom(document.score, 0);
  const openActions = numberFrom(
    document.openActions ?? document.open_actions,
    0,
  );

  return {
    id: stringFrom(document.slug ?? document.code ?? document.$id),
    name: stringFrom(document.name ?? document.label ?? document.$id),
    line: stringFrom(document.line ?? document.area ?? "Atelier"),
    score,
    openActions,
    lastAudit: formatDate(document.lastAudit ?? document.last_audit),
    status: zoneStatusFrom(document.status, score, openActions),
  };
}

function mapAudit(document: AppwriteDocument): Audit {
  return {
    $id: document.$id,
    id: document.$id,
    zoneId: stringFrom(document.zone_id),
    zoneName: stringFrom(document.zone_name),
    auditorName: stringFrom(document.auditor_name),
    shift: stringFrom(document.shift),
    scorePercent: numberFrom(document.score_percent, 0),
    status: stringFrom(document.status),
    createdAt: optionalString(document.$createdAt),
  };
}

function mapAuditAnswer(document: AppwriteDocument): AuditAnswer {
  return {
    $id: document.$id,
    id: document.$id,
    auditId: stringFrom(document.audit_id),
    criterionLabel: stringFrom(document.criterion_label),
    score: numberFrom(document.score, 0),
    comment: optionalString(document.comment),
    hasGap: booleanFrom(document.has_gap),
  };
}

function mapCorrectiveAction(document: AppwriteDocument): CorrectiveAction {
  return {
    $id: document.$id,
    id: document.$id,
    title: stringFrom(document.title),
    description: optionalString(document.description),
    auditId: stringFrom(document.audit_id),
    auditAnswerId: optionalString(document.audit_answer_id),
    responsable: optionalString(document.responsable),
    dueDate: optionalString(document.due_date),
    status: correctiveActionStatusFrom(document.status),
    createdAt: optionalString(document.$createdAt),
    closedAt: optionalString(document.closed_at),
  };
}

function mapPhotoMetadata(document: AppwriteDocument): PhotoMetadata {
  return {
    $id: document.$id,
    id: document.$id,
    fileId: stringFrom(document.file_id),
    moduleType: photoModuleTypeFrom(document.module_type),
    entityId: stringFrom(document.entity_id),
    companyId: optionalString(document.company_id),
    siteId: optionalString(document.site_id),
    zoneId: optionalString(document.zone_id),
    uploadedBy: optionalString(document.uploaded_by),
    createdAt: optionalString(document.$createdAt),
    fileName: stringFrom(document.file_name),
    fileSize: numberFrom(document.file_size, 0),
    mimeType: stringFrom(document.mime_type),
    storagePath: optionalString(document.storage_path),
    deletedAt: optionalString(document.deleted_at),
  };
}

function mapStandard(document: AppwriteDocument): Standard {
  if (process.env.NODE_ENV === "development") {
    console.log("[5S standard]", {
      zone_id: document.zone_id,
      active: document.active,
      "typeof active": typeof document.active,
    });
  }

  return {
    $id: document.$id,
    id: document.$id,
    zoneId: stringFrom(document.zone_id),
    title: stringFrom(document.title),
    description: optionalString(document.description),
    rules: optionalString(document.rules),
    active: booleanFrom(document.active),
    createdAt: optionalString(document.$createdAt),
    updatedAt: optionalString(document.$updatedAt),
  };
}

function stringFrom(value: unknown) {
  return typeof value === "string" && value.trim() ? value : String(value ?? "");
}

function createEqualQuery(attribute: string, value: string) {
  return createAppwriteQuery("equal", attribute, [value]);
}

function createOrderDescQuery(attribute: string) {
  return createAppwriteQuery("orderDesc", attribute);
}

function createLimitQuery(limit: number) {
  return createAppwriteQuery("limit", undefined, [limit]);
}

function createAppwriteQuery(
  method: string,
  attribute?: string,
  values?: Array<string | number | boolean>,
) {
  return JSON.stringify({
    method,
    attribute,
    values,
  });
}

function filterPhotosByContext(
  photos: PhotoMetadata[],
  moduleType: PhotoModuleType,
  entityId: string,
) {
  return photos.filter(
    (photo) =>
      !photo.deletedAt &&
      photo.moduleType === moduleType &&
      photo.entityId === entityId,
  );
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberFrom(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function booleanFrom(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return false;
}

function correctiveActionStatusFrom(value: unknown): CorrectiveActionStatus {
  if (value === "EN_COURS" || value === "CLOTUREE") {
    return value;
  }

  return "OUVERTE";
}

function photoModuleTypeFrom(value: unknown): PhotoModuleType {
  return value === "correctiveAction" ? "correctiveAction" : "audit";
}

function compactData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Aucun audit";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR").format(date);
}

function zoneStatusFrom(
  value: unknown,
  score: number,
  openActions: number,
): Zone["status"] {
  if (
    value === "Conforme" ||
    value === "A surveiller" ||
    value === "Prioritaire"
  ) {
    return value;
  }

  if (score < 70 || openActions >= 8) {
    return "Prioritaire";
  }

  if (score < 85 || openActions >= 4) {
    return "A surveiller";
  }

  return "Conforme";
}

async function readAppwriteError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) {
      return payload.message;
    }
  } catch {
    // Keep the fallback below when Appwrite returns a non-JSON error page.
  }

  return `Appwrite a refuse la requete (${response.status})`;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Appwrite ne répond pas dans le délai attendu.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
