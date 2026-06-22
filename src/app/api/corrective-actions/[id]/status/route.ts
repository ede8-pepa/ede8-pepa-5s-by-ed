import { NextResponse } from "next/server";
import {
  readAppwriteCorrectiveAction,
  updateCorrectiveActionStatus,
} from "@/lib/data/appwrite-service";
import type { CorrectiveActionStatus } from "@/lib/types";

type StatusRequestBody = {
  status?: CorrectiveActionStatus;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as StatusRequestBody;

    if (body.status !== "EN_COURS" && body.status !== "CLOTUREE") {
      throw new Error("Statut cible invalide.");
    }

    const currentAction = await readAppwriteCorrectiveAction(id);

    if (body.status === "EN_COURS" && currentAction.status !== "OUVERTE") {
      throw new Error("Seule une action ouverte peut passer en cours.");
    }

    if (body.status === "CLOTUREE" && currentAction.status !== "EN_COURS") {
      throw new Error("Seule une action en cours peut être clôturée.");
    }

    const action = await updateCorrectiveActionStatus(id, body.status);

    return NextResponse.json({
      actionId: action.$id,
      status: action.status,
      message: "Statut de l'action mis à jour.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour l'action corrective.",
      },
      { status: 400 },
    );
  }
}
