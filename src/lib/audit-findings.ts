import type { AuditAnswer } from "@/lib/types";

export type AuditFindingCategory =
  | "conforme"
  | "observation"
  | "ecartMineur"
  | "ecartMajeur"
  | "ecartCritique";

export type AuditFindingStatus = {
  category: AuditFindingCategory;
  label: string;
  className: string;
};

export type AuditFindingCounts = {
  conformes: number;
  observations: number;
  ecartsMineurs: number;
  ecartsMajeurs: number;
  ecartsCritiques: number;
};

const findingStatuses: Record<AuditFindingCategory, AuditFindingStatus> = {
  conforme: {
    category: "conforme",
    label: "Conforme",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  observation: {
    category: "observation",
    label: "Observation",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  ecartMineur: {
    category: "ecartMineur",
    label: "Écart mineur",
    className: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  ecartMajeur: {
    category: "ecartMajeur",
    label: "Écart majeur",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  ecartCritique: {
    category: "ecartCritique",
    label: "Écart critique",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

export function getAuditFindingStatus(score: number): AuditFindingStatus {
  if (score === 5) {
    return findingStatuses.conforme;
  }

  if (score === 4) {
    return findingStatuses.observation;
  }

  if (score === 3) {
    return findingStatuses.ecartMineur;
  }

  if (score === 2) {
    return findingStatuses.ecartMajeur;
  }

  return findingStatuses.ecartCritique;
}

export function countAuditFindings(
  answers: Pick<AuditAnswer, "score">[],
): AuditFindingCounts {
  return answers.reduce<AuditFindingCounts>(
    (counts, answer) => {
      if (answer.score === 5) {
        counts.conformes += 1;
      } else if (answer.score === 4) {
        counts.observations += 1;
      } else if (answer.score === 3) {
        counts.ecartsMineurs += 1;
      } else if (answer.score === 2) {
        counts.ecartsMajeurs += 1;
      } else if (answer.score === 1) {
        counts.ecartsCritiques += 1;
      }

      return counts;
    },
    {
      conformes: 0,
      observations: 0,
      ecartsMineurs: 0,
      ecartsMajeurs: 0,
      ecartsCritiques: 0,
    },
  );
}
