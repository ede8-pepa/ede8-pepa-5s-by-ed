"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PendingPhotoSelector, uploadPhotos } from "@/components/photo-tools";
import type { Zone } from "@/lib/types";
import { cx } from "@/lib/utils";

const criteria = [
  "Trier",
  "Ranger",
  "Nettoyer",
  "Standardiser",
  "Maintenir",
];
const draftStorageKey = "5s-by-ed:new-audit-draft";
const preserveDraftStorageKey = "5s-by-ed:preserve-new-audit-draft";

type SaveState = {
  status: "idle" | "success" | "error";
  message: string;
  scorePercent?: number;
  auditStatus?: string;
  photoWarning?: string;
};

type AuditDraft = {
  selectedZoneId: string;
  auditorName: string;
  shift: "" | "Matin" | "Soir";
  scores: Record<string, number>;
  comments: Record<string, string>;
};

export function NewAuditForm({ zones }: { zones: Zone[] }) {
  const [state, setState] = useState<SaveState>({ status: "idle", message: "" });
  const [isPending, setIsPending] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const preserveDraftOnUnmountRef = useRef(false);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [auditorName, setAuditorName] = useState("");
  const [shift, setShift] = useState<"" | "Matin" | "Soir">("");
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(criteria.map((criterion) => [criterion, 3])),
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(criteria.map((criterion) => [criterion, ""])),
  );
  const [pendingPhotoFiles, setPendingPhotoFiles] = useState<File[]>([]);

  useEffect(() => {
    const shouldRestoreDraft = shouldRestoreAuditDraft();
    const draft = shouldRestoreDraft ? readAuditDraft() : undefined;

    if (draft) {
      setSelectedZoneId(draft.selectedZoneId);
      setAuditorName(draft.auditorName);
      setShift(draft.shift);
      setScores(normalizeScores(draft.scores));
      setComments(normalizeComments(draft.comments));
    }

    clearPreserveDraftFlag();

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }

      if (!preserveDraftOnUnmountRef.current) {
        clearAuditDraft();
      }
    };
  }, []);

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === selectedZoneId),
    [selectedZoneId, zones],
  );
  const scorePercent = useMemo(() => {
    const total = criteria.reduce(
      (sum, criterion) => sum + (scores[criterion] ?? 0),
      0,
    );

    return Math.round((total / (criteria.length * 5)) * 100);
  }, [scores]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("[audit-debug][ui] 1. debut submit");

    if (!selectedZone) {
      console.log("[audit-debug][ui] stop: zone manquante");
      setState({
        status: "error",
        message: "Sélectionnez une zone avant d'enregistrer l'audit.",
      });
      return;
    }

    if (shift !== "Matin" && shift !== "Soir") {
      console.log("[audit-debug][ui] stop: poste manquant", { shift });
      setState({
        status: "error",
        message: "Sélectionnez un poste avant d'enregistrer l'audit.",
      });
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    const submittedScorePercent = scorePercent;
    const submittedAuditStatus = getAuditStatusLabel(submittedScorePercent);

    setIsPending(true);
    setState({ status: "idle", message: "" });

    try {
      const auditPayload = {
        zoneId: selectedZone.id,
        zoneName: selectedZone.name,
        auditorName,
        shift,
        answers: criteria.map((criterion) => ({
          criterionLabel: criterion,
          score: scores[criterion] ?? 0,
          comment: comments[criterion] ?? "",
        })),
      };

      console.log("[audit-debug][ui] 2. donnees envoyees", auditPayload);
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auditPayload),
      });
      const payload = (await response.json()) as {
        auditId?: string;
        message?: string;
      };
      console.log("[audit-debug][ui] 7. retour api", {
        ok: response.ok,
        status: response.status,
        payload,
      });

      if (!response.ok) {
        throw new Error(
          payload.message ?? "Impossible d'enregistrer l'audit dans Appwrite.",
        );
      }

      if (!payload.auditId) {
        throw new Error(
          "Appwrite n'a pas retourné d'identifiant d'audit. L'audit n'est pas confirmé.",
        );
      }

      let photoWarning: string | undefined;

      if (pendingPhotoFiles.length > 0) {
        try {
          await uploadPhotos({
            files: pendingPhotoFiles,
            moduleType: "audit",
            entityId: payload.auditId,
            zoneId: selectedZone.id,
            uploadedBy: auditorName,
          });
        } catch (photoError) {
          photoWarning =
            photoError instanceof Error
              ? `Audit enregistré, mais les photos n'ont pas été ajoutées : ${photoError.message}`
              : "Audit enregistré, mais les photos n'ont pas été ajoutées.";
        }
      }

      setState({
        status: "success",
        message: "Audit enregistré avec succès",
        scorePercent: submittedScorePercent,
        auditStatus: submittedAuditStatus,
        photoWarning,
      });
      console.log("[audit-debug][ui] 7. retour UI success", {
        auditId: payload.auditId,
        photoWarning,
      });
      clearAuditDraft();
      resetTimerRef.current = setTimeout(() => {
        resetAfterSuccessfulAudit();
        setState({ status: "idle", message: "" });
      }, 4500);
    } catch (error) {
      console.error("[audit-debug][ui] 6. catch UI", error);
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

  function resetAuditGrid() {
    setScores(Object.fromEntries(criteria.map((criterion) => [criterion, 3])));
    setComments(
      Object.fromEntries(criteria.map((criterion) => [criterion, ""])),
    );
  }

  function resetAfterSuccessfulAudit() {
    setSelectedZoneId("");
    setPendingPhotoFiles([]);
    resetAuditGrid();
  }

  function resetFullAuditSession() {
    setSelectedZoneId("");
    setAuditorName("");
    setShift("");
    setPendingPhotoFiles([]);
    resetAuditGrid();
  }

  function persistCurrentDraft() {
    writeAuditDraft({
      selectedZoneId,
      auditorName,
      shift,
      scores,
      comments,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >

      {state.message ? (
        <div
          className={cx(
            "mb-5 rounded-lg border px-4 py-3 text-sm font-bold",
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          <p>{state.message}</p>
          {state.status === "success" ? (
            <div className="mt-2 grid gap-1 text-sm">
              <p>Score : {state.scorePercent} %</p>
              <p>Statut : {state.auditStatus}</p>
              {state.photoWarning ? (
                <p className="mt-2 text-amber-700">{state.photoWarning}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-black text-slate-700">Auditeur</span>
          <input
            type="text"
            value={auditorName}
            onChange={(event) => setAuditorName(event.target.value)}
            placeholder="Nom de l'auditeur"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-black text-slate-700">Zone</span>
            <select
              value={selectedZoneId}
              onChange={(event) => setSelectedZoneId(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
              required
            >
              <option value="">Sélectionner une zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">Poste</span>
            <select
              value={shift}
              onChange={(event) =>
                setShift(event.target.value as "" | "Matin" | "Soir")
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
              required
            >
              <option value="">Sélectionner un poste</option>
              <option value="Matin">Matin</option>
              <option value="Soir">Soir</option>
            </select>
          </label>
        </div>
      </div>

      {selectedZone ? (
        <div className="mt-4">
          <Link
            href={`/standards/${getStandardZoneId(selectedZone)}?returnTo=/nouvel-audit`}
            onClick={() => {
              persistCurrentDraft();
              preserveDraftOnUnmountRef.current = true;
              markDraftForStandardReturn();
            }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-[#0f4c81] transition hover:bg-blue-100 sm:w-auto"
          >
            Voir le standard de la zone
          </Link>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f4c81]">
            Score calcule
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Le score est calcule depuis les 5 criteres V1.
          </p>
        </div>
        <p className="text-4xl font-black text-slate-950">{scorePercent}%</p>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-black text-slate-950">Evaluation 5S</h2>
        <div className="mt-4 space-y-3">
          {criteria.map((criterion) => (
            <div
              key={criterion}
              className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4 lg:grid-cols-[150px_minmax(160px,1fr)_90px_minmax(180px,1.2fr)] lg:items-center"
            >
              <p className="font-black text-slate-900">{criterion}</p>
              <input
                type="range"
                min="0"
                max="5"
                value={scores[criterion]}
                onChange={(event) =>
                  setScores((currentScores) => ({
                    ...currentScores,
                    [criterion]: Number(event.target.value),
                  }))
                }
                className="h-11 w-full accent-[#0f4c81]"
                aria-label={`Note ${criterion}`}
              />
              <select
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-800 outline-none focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
                aria-label={`Score ${criterion}`}
                value={scores[criterion]}
                onChange={(event) =>
                  setScores((currentScores) => ({
                    ...currentScores,
                    [criterion]: Number(event.target.value),
                  }))
                }
              >
                {[0, 1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score}/5
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={comments[criterion]}
                onChange={(event) =>
                  setComments((currentComments) => ({
                    ...currentComments,
                    [criterion]: event.target.value,
                  }))
                }
                placeholder="Commentaire optionnel"
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f4c81] focus:ring-4 focus:ring-blue-100 sm:text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <PendingPhotoSelector
        files={pendingPhotoFiles}
        onFilesChange={setPendingPhotoFiles}
        disabled={isPending}
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (resetTimerRef.current) {
              clearTimeout(resetTimerRef.current);
            }
            resetFullAuditSession();
            clearAuditDraft();
            clearPreserveDraftFlag();
            setState({ status: "idle", message: "" });
          }}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Réinitialiser la saisie
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 rounded-lg bg-[#0f4c81] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#0a365c] disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "Enregistrement..." : "Enregistrer l'audit"}
        </button>
      </div>
    </form>
  );
}

function getAuditStatusLabel(scorePercent: number) {
  if (scorePercent >= 90) {
    return "Conforme";
  }

  if (scorePercent >= 80) {
    return "À surveiller";
  }

  return "Non conforme";
}

function getStandardZoneId(zone: Zone) {
  const normalizedName = zone.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const knownZones: Record<string, string> = {
    cal1: "cal1",
    cal2: "cal2",
    m1: "m1",
    m2: "m2",
    m3: "m3",
    "stockage-palettes-et-box": "stockage-palettes-box",
  };

  return knownZones[normalizedName] ?? zone.id;
}

function readAuditDraft(): AuditDraft | undefined {
  try {
    const rawDraft = window.sessionStorage.getItem(draftStorageKey);

    if (!rawDraft) {
      return undefined;
    }

    const draft = JSON.parse(rawDraft) as Partial<AuditDraft>;

    if (draft.shift !== "" && draft.shift !== "Matin" && draft.shift !== "Soir") {
      return undefined;
    }

    return {
      selectedZoneId:
        typeof draft.selectedZoneId === "string" ? draft.selectedZoneId : "",
      auditorName:
        typeof draft.auditorName === "string" ? draft.auditorName : "",
      shift: draft.shift,
      scores: normalizeScores(draft.scores),
      comments: normalizeComments(draft.comments),
    };
  } catch {
    return undefined;
  }
}

function writeAuditDraft(draft: AuditDraft) {
  window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
}

function clearAuditDraft() {
  window.sessionStorage.removeItem(draftStorageKey);
}

function markDraftForStandardReturn() {
  window.sessionStorage.setItem(preserveDraftStorageKey, "1");
}

function clearPreserveDraftFlag() {
  window.sessionStorage.removeItem(preserveDraftStorageKey);
}

function shouldRestoreAuditDraft() {
  return window.sessionStorage.getItem(preserveDraftStorageKey) === "1";
}

function normalizeScores(scores: unknown) {
  const source =
    scores && typeof scores === "object"
      ? (scores as Record<string, unknown>)
      : {};

  return Object.fromEntries(
    criteria.map((criterion) => {
      const score = Number(source[criterion]);
      return [
        criterion,
        Number.isFinite(score) ? Math.min(5, Math.max(0, score)) : 3,
      ];
    }),
  );
}

function normalizeComments(comments: unknown) {
  const source =
    comments && typeof comments === "object"
      ? (comments as Record<string, unknown>)
      : {};

  return Object.fromEntries(
    criteria.map((criterion) => [
      criterion,
      typeof source[criterion] === "string" ? source[criterion] : "",
    ]),
  );
}
