"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CorrectiveActionStatus } from "@/lib/types";

export function CorrectiveActionStatusActions({
  actionId,
  status,
}: {
  actionId: string;
  status: CorrectiveActionStatus;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function updateStatus(nextStatus: "EN_COURS" | "CLOTUREE") {
    setIsPending(true);
    setMessage("");

    try {
      const response = await fetch(`/api/corrective-actions/${actionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(
          payload.message ?? "Impossible de mettre à jour le statut.",
        );
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Appwrite est indisponible pour le moment.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={status !== "OUVERTE" || isPending}
        onClick={() => updateStatus("EN_COURS")}
        className="min-h-11 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Passer en cours
      </button>
      <button
        type="button"
        disabled={status !== "EN_COURS" || isPending}
        onClick={() => updateStatus("CLOTUREE")}
        className="min-h-11 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Clôturer
      </button>
      {message ? <p className="text-sm font-bold text-red-700">{message}</p> : null}
    </div>
  );
}
