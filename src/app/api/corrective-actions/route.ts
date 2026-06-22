import { NextResponse } from "next/server";
import { createCorrectiveAction } from "@/lib/data/appwrite-service";

type CorrectiveActionRequestBody = {
  title?: string;
  description?: string;
  auditId?: string;
  auditAnswerId?: string;
  responsable?: string;
  dueDate?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CorrectiveActionRequestBody;
    const action = await createCorrectiveAction({
      title: requiredString(body.title, "titre"),
      description: optionalString(body.description),
      auditId: requiredString(body.auditId, "audit"),
      auditAnswerId: optionalString(body.auditAnswerId),
      responsable: optionalString(body.responsable),
      dueDate: optionalString(body.dueDate),
    });

    return NextResponse.json({
      actionId: action.$id,
      message: "Action corrective créée.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible de créer l'action corrective.",
      },
      { status: 400 },
    );
  }
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
