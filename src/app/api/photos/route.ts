import { NextResponse } from "next/server";
import {
  createPhotoMetadata,
  readAppwritePhotos,
  uploadAppwritePhotoFile,
} from "@/lib/data/appwrite-service";
import type { PhotoMetadata, PhotoModuleType } from "@/lib/types";

console.log("[build-trace] src/app/api/photos/route.ts module loaded");

const maxPhotoSizeBytes = 10 * 1024 * 1024;
const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function GET(request: Request) {
  console.log("[build-trace] photos API GET start");
  try {
    const url = new URL(request.url);
    const moduleType = requiredModuleType(url.searchParams.get("moduleType"));
    const entityId = requiredString(url.searchParams.get("entityId"), "entityId");
    const photos = await readAppwritePhotos(moduleType, entityId);

    return NextResponse.json({ photos });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible de charger les photos.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  console.log("[build-trace] photos API POST start");
  try {
    const formData = await request.formData();
    const moduleType = requiredModuleType(formData.get("moduleType"));
    const entityId = requiredString(formData.get("entityId"), "entityId");
    const companyId = optionalString(formData.get("companyId"));
    const siteId = optionalString(formData.get("siteId"));
    const zoneId = optionalString(formData.get("zoneId"));
    const uploadedBy = optionalString(formData.get("uploadedBy"));
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      throw new Error("Aucune photo sélectionnée.");
    }

    const photos: PhotoMetadata[] = [];

    for (const file of files) {
      validatePhotoFile(file);
      const { fileId } = await uploadAppwritePhotoFile(file);
      const storagePath = buildStoragePath({
        moduleType,
        entityId,
        companyId,
        siteId,
        zoneId,
        fileName: file.name,
      });

      photos.push(
        await createPhotoMetadata({
          fileId,
          moduleType,
          entityId,
          companyId,
          siteId,
          zoneId,
          uploadedBy,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          storagePath,
        }),
      );
    }

    return NextResponse.json({
      photos,
      message: `${photos.length} photo${photos.length > 1 ? "s" : ""} ajoutée${photos.length > 1 ? "s" : ""}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Upload photo impossible.",
      },
      { status: 400 },
    );
  }
}

function validatePhotoFile(file: File) {
  if (!supportedMimeTypes.has(file.type)) {
    throw new Error(
      "Format non supporté. Utilisez une image JPEG, PNG, WebP, HEIC ou HEIF.",
    );
  }

  if (file.size > maxPhotoSizeBytes) {
    throw new Error("Photo trop volumineuse. Taille maximale : 10 Mo.");
  }
}

function buildStoragePath({
  moduleType,
  entityId,
  companyId,
  siteId,
  zoneId,
  fileName,
}: {
  moduleType: PhotoModuleType;
  entityId: string;
  companyId?: string;
  siteId?: string;
  zoneId?: string;
  fileName: string;
}) {
  const year = new Date().getFullYear();

  return [
    normalizeSegment(companyId ?? "default-company"),
    normalizeSegment(siteId ?? "default-site"),
    moduleType,
    String(year),
    normalizeSegment(zoneId ?? "no-zone"),
    normalizeSegment(entityId),
    normalizeSegment(fileName),
  ].join("/");
}

function requiredModuleType(value: unknown): PhotoModuleType {
  if (value === "audit" || value === "correctiveAction") {
    return value;
  }

  throw new Error("Contexte photo invalide.");
}

function requiredString(value: unknown, label: string) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new Error(`Le champ ${label} est obligatoire.`);
  }

  return normalized;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeSegment(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-|-$/g, "");
}
