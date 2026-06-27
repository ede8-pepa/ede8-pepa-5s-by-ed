import { mockAuditAnswers, mockAudits } from "@/lib/mock-audits";
import {
  readAppwriteAudit,
  readAppwriteAllAuditAnswers,
  readAppwriteAuditAnswers,
  readAppwriteAudits,
} from "@/lib/data/appwrite-service";
import type { Audit, AuditAnswer } from "@/lib/types";

const APPWRITE_READ_TIMEOUT_MS = 3000;

console.log("[build-trace] audit-history-provider module loaded");

export async function getAuditHistory() {
  console.log("[build-trace] getAuditHistory start");
  try {
    const audits = await withTimeout(
      readAppwriteAudits(),
      APPWRITE_READ_TIMEOUT_MS,
    );

    return sortAudits(audits.length > 0 ? audits : mockAudits);
  } catch {
    console.log("[build-trace] getAuditHistory fallback");
    return sortAudits(mockAudits);
  }
}

export async function getAuditHistoryWithAnswers(): Promise<
  Array<Audit & { answers: AuditAnswer[] }>
> {
  console.log("[build-trace] getAuditHistoryWithAnswers start");
  try {
    const [audits, answers] = await withTimeout(
      Promise.all([readAppwriteAudits(), readAppwriteAllAuditAnswers()]),
      APPWRITE_READ_TIMEOUT_MS,
    );

    if (audits.length === 0) {
      console.log("[build-trace] getAuditHistoryWithAnswers mock empty");
      return buildAuditsWithAnswers(mockAudits, getMockAuditAnswers());
    }

    console.log("[build-trace] getAuditHistoryWithAnswers appwrite done");
    return buildAuditsWithAnswers(audits, answers);
  } catch {
    console.log("[build-trace] getAuditHistoryWithAnswers fallback");
    return buildAuditsWithAnswers(mockAudits, getMockAuditAnswers());
  }
}

export async function getAuditDetail(auditId: string): Promise<{
  audit: Audit | undefined;
  answers: AuditAnswer[];
  source: "appwrite";
}> {
  console.log("[build-trace] getAuditDetail start", auditId);
  let audit: Audit | undefined;

  try {
    audit = await withTimeout(
      readAppwriteAudit(auditId),
      APPWRITE_READ_TIMEOUT_MS,
    );
  } catch {
    console.log("[build-trace] getAuditDetail audit fallback", auditId);
    return {
      audit: undefined,
      answers: [],
      source: "appwrite",
    };
  }

  try {
    const answers = await withTimeout(
      readAppwriteAuditAnswers(auditId),
      APPWRITE_READ_TIMEOUT_MS,
    );

    console.log("[build-trace] getAuditDetail answers done", auditId);
    return {
      audit,
      answers,
      source: "appwrite",
    };
  } catch {
    console.log("[build-trace] getAuditDetail answers fallback", auditId);
    return {
      audit,
      answers: [],
      source: "appwrite",
    };
  }
}

export async function getAuditNavigation(auditId: string): Promise<{
  previousAudit: Audit | undefined;
  nextAudit: Audit | undefined;
}> {
  console.log("[build-trace] getAuditNavigation start", auditId);
  const audits = await getAuditHistory();
  const currentIndex = audits.findIndex((audit) => audit.$id === auditId);

  if (currentIndex === -1) {
    return {
      previousAudit: undefined,
      nextAudit: undefined,
    };
  }

  return {
    previousAudit: audits[currentIndex - 1],
    nextAudit: audits[currentIndex + 1],
  };
}

function sortAudits(audits: Audit[]) {
  return [...audits].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? "").getTime();
    const rightTime = new Date(right.createdAt ?? "").getTime();
    return rightTime - leftTime;
  });
}

function buildAuditsWithAnswers(audits: Audit[], answers: AuditAnswer[]) {
  const answersByAuditId = new Map<string, AuditAnswer[]>();

  answers.forEach((answer) => {
    const currentAnswers = answersByAuditId.get(answer.auditId) ?? [];
    currentAnswers.push(answer);
    answersByAuditId.set(answer.auditId, currentAnswers);
  });

  return sortAudits(audits).map((audit) => ({
    ...audit,
    answers: answersByAuditId.get(audit.$id) ?? [],
  }));
}

function getMockAuditAnswers() {
  return Object.values(mockAuditAnswers).flat();
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
