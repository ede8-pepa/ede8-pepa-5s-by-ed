"use client";

import { FormEvent, useState } from "react";
import { cx } from "@/lib/utils";

type SaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

export function CorrectiveActionForm({
  auditId,
  auditAnswerId,
  criterionLabel,
}: {
  auditId: string;
  auditAnswerId: string;
  criterionLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<SaveState>({
    status: "idle",
    message: "",
  });
  const [title, setTitle] = useState(`Corriger ${criterionLabel}`);
  const [description, setDescription] = useState("");
  const [responsable, setResponsable] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setState({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/corrective-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          auditId,
          auditAnswerId,
          responsable,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(
          payload.message ?? "Impossible de créer l'action corrective.",
        );
      }

      setState({
        status: "success",
        message: payload.message ?? "Action corrective créée.",
      });
      setIsOpen(false);
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Appwrite est indisponible pour le moment.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex min-h-11 items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
      >
        Créer une action corrective
      </button>

      {state.message ? (
        <p
          className={cx(
            "mt-3 rounded-lg border px-3 py-2 text-sm font-bold",
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {state.message}
        </p>
      ) : null}

      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <label className="block">
            <span className="text-xs font-black text-slate-600">Titre</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-black text-slate-600">
              Description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black text-slate-600">
                Responsable
              </span>
              <input
                type="text"
                value={responsable}
                onChange={(event) => setResponsable(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black text-slate-600">
                Date échéance
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 w-full rounded-lg bg-[#0f4c81] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0a365c] disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
