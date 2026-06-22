import { mockStandards, standardZones } from "@/lib/mock-standards";
import {
  readAppwriteStandards,
  readAppwriteStandardsByZone,
} from "@/lib/data/appwrite-service";
import type { Standard } from "@/lib/types";

const APPWRITE_READ_TIMEOUT_MS = 3000;

export async function getStandardsOverview() {
  const standards = await readStandardsWithFallback();

  return standardZones.map((zone) => ({
    ...zone,
    standards: standards.filter(
      (standard) => normalizeZoneId(standard.zoneId) === zone.id,
    ),
  }));
}

export async function getStandardDetail(zoneId: string): Promise<{
  zone: { id: string; name: string } | undefined;
  standards: Standard[];
}> {
  const normalizedZoneId = normalizeZoneId(zoneId);
  const zone = standardZones.find((item) => item.id === normalizedZoneId);

  try {
    const appwriteStandardsByZone = await withTimeout(
      readAppwriteStandardsByZone(zoneId),
      APPWRITE_READ_TIMEOUT_MS,
    );
    let matchingStandards = appwriteStandardsByZone.filter(
      (standard) => normalizeZoneId(standard.zoneId) === normalizedZoneId,
    );

    if (matchingStandards.length === 0) {
      const allStandards = await withTimeout(
        readAppwriteStandards(),
        APPWRITE_READ_TIMEOUT_MS,
      );
      matchingStandards = allStandards.filter(
        (standard) => normalizeZoneId(standard.zoneId) === normalizedZoneId,
      );
    }

    return {
      zone,
      standards: matchingStandards.length > 0 ? matchingStandards : [],
    };
  } catch {
    return {
      zone,
      standards: mockStandards.filter(
        (standard) => normalizeZoneId(standard.zoneId) === normalizedZoneId,
      ),
    };
  }
}

async function readStandardsWithFallback() {
  try {
    const standards = await withTimeout(
      readAppwriteStandards(),
      APPWRITE_READ_TIMEOUT_MS,
    );

    return standards.length > 0 ? standards : mockStandards;
  } catch {
    return mockStandards;
  }
}

function normalizeZoneId(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
