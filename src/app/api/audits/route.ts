import { NextResponse } from "next/server";
import {
  createAudit,
  createAuditAnswers,
} from "@/lib/data/appwrite-service";
import type { CreateAuditAnswerInput } from "@/lib/types";

type AuditRequestBody = {
  zoneId?: string;
  zoneName?: string;
  auditorName?: string;
  shift?: string;
  answers?: Array<{
    criterionLabel?: string;
    score?: number;
    comment?: string;
  }>;
};

export async function POST(request: Request) {
  console.log("[audit-debug][api] POST /api/audits start");
  try {
    const body = (await request.json()) as AuditRequestBody;
    console.log("[audit-debug][api] body recu", body);
    const zoneId = requiredString(body.zoneId, "zone");
    const zoneName = requiredString(body.zoneName, "zone");
    const auditorName = requiredString(body.auditorName, "auditeur");
    const shift = requiredShift(body.shift);
    const answers = buildAnswers(body.answers);
    const scorePercent = calculateScorePercent(answers);
    const status = scorePercent >= 80 ? "conforme" : "a_surveiller";

    console.log("[audit-debug][api] 3. appel createAudit()", {
      zoneId,
      zoneName,
      auditorName,
      shift,
      scorePercent,
      status,
      answersCount: answers.length,
    });
    const audit = await createAudit({
      zoneId,
      zoneName,
      auditorName,
      shift,
      scorePercent,
      status,
    });
    console.log("[audit-debug][api] 5. createAudit retourne", {
      auditId: audit.$id,
      audit,
    });

    if (!audit.$id) {
      throw new Error(
        "Appwrite n'a pas retourné d'identifiant après création de l'audit.",
      );
    }

    console.log("[audit-debug][api] appel createAuditAnswers()", {
      auditId: audit.$id,
      answersCount: answers.length,
    });
    const createdAnswers = await createAuditAnswers(
      answers.map((answer) => ({
        ...answer,
        auditId: audit.$id,
      })),
    );
    console.log("[audit-debug][api] createAuditAnswers retourne", {
      auditId: audit.$id,
      createdAnswersCount: createdAnswers.length,
    });

    if (createdAnswers.length !== answers.length) {
      throw new Error(
        "L'audit a ete cree, mais toutes les reponses n'ont pas ete enregistrees dans Appwrite.",
      );
    }

    console.log("[audit-debug][api] 7. retour api success", {
      auditId: audit.$id,
      answersCount: createdAnswers.length,
    });
    return NextResponse.json({
      auditId: audit.$id,
      answersCount: createdAnswers.length,
      message: `Audit enregistre pour ${zoneName} avec ${createdAnswers.length} reponses et un score de ${scorePercent}%.`,
      scorePercent,
    });
  } catch (error) {
    console.error("[audit-debug][api] 6. catch api", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer l'audit dans Appwrite.",
      },
      { status: 400 },
    );
  }
}

function buildAnswers(
  answers: AuditRequestBody["answers"],
): Omit<CreateAuditAnswerInput, "auditId">[] {
  if (!answers || answers.length === 0) {
    throw new Error("La grille d'audit est vide.");
  }

  return answers.map((answer) => {
    const score = numberFrom(answer.score);

    return {
      criterionLabel: requiredString(answer.criterionLabel, "critere"),
      score,
      comment: answer.comment?.trim() ?? "",
      hasGap: score < 4,
    };
  });
}

function calculateScorePercent(
  answers: Array<Pick<CreateAuditAnswerInput, "score">>,
) {
  const maxScore = answers.length * 5;
  const score = answers.reduce((total, answer) => total + answer.score, 0);

  return Math.round((score / maxScore) * 100);
}

function requiredString(value: unknown, label: string) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new Error(`Le champ ${label} est obligatoire.`);
  }

  return normalized;
}

function requiredShift(value: unknown) {
  const shift = requiredString(value, "poste");

  if (shift !== "Matin" && shift !== "Soir") {
    throw new Error("Le poste doit etre Matin ou Soir.");
  }

  return shift;
}

function numberFrom(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(5, Math.max(0, parsed));
}
