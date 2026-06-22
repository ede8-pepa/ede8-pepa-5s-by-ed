import type { Audit, AuditAnswer, DashboardInsights } from "@/lib/types";

const expectedZones = [
  "CAL1",
  "CAL2",
  "M1",
  "M2",
  "M3",
  "Stockage palettes et box",
];

const expectedCriteria = [
  "Trier",
  "Ranger",
  "Nettoyer",
  "Standardiser",
  "Maintenir",
];

export function buildDashboardInsights(
  audits: Audit[],
  answers: AuditAnswer[],
): DashboardInsights {
  const zoneScores = buildZoneScores(audits);
  const zonesWithScores = zoneScores.filter(
    (zone): zone is DashboardInsights["zoneScores"][number] & { score: number } =>
      typeof zone.score === "number",
  );

  return {
    criticalFindings: countAnswersByScore(answers, 1),
    majorFindings: countAnswersByScore(answers, 2),
    topFindings: buildTopFindings(answers),
    zoneScores,
    weakestZone: getRankedZone(zonesWithScores, "weakest"),
    strongestZone: getRankedZone(zonesWithScores, "strongest"),
  };
}

function countAnswersByScore(answers: AuditAnswer[], score: number) {
  return answers.filter((answer) => answer.score === score).length;
}

function buildTopFindings(answers: AuditAnswer[]) {
  const counts = new Map(expectedCriteria.map((criterion) => [criterion, 0]));

  answers
    .filter((answer) => answer.score <= 3)
    .forEach((answer) => {
      const criterion = normalizeCriterion(answer.criterionLabel);
      counts.set(criterion, (counts.get(criterion) ?? 0) + 1);
    });

  return [...counts.entries()]
    .map(([criterion, count]) => ({
      criterion,
      count,
      href: `/historique?criterion=${encodeURIComponent(criterion)}`,
    }))
    .filter((finding) => finding.count > 0)
    .sort(
      (left, right) =>
        right.count - left.count || left.criterion.localeCompare(right.criterion),
    );
}

function buildZoneScores(audits: Audit[]) {
  return expectedZones.map((zoneName) => {
    const matchingAudits = audits.filter(
      (audit) => normalizeZoneName(audit.zoneName) === normalizeZoneName(zoneName),
    );
    const score =
      matchingAudits.length > 0
        ? Math.round(
            matchingAudits.reduce(
              (sum, audit) => sum + audit.scorePercent,
              0,
            ) / matchingAudits.length,
          )
        : undefined;

    return {
      zoneName,
      score,
      auditCount: matchingAudits.length,
      href: `/historique?zone=${encodeURIComponent(zoneName)}`,
    };
  });
}

function getRankedZone(
  zones: Array<{ zoneName: string; score: number; href: string }>,
  rank: "weakest" | "strongest",
) {
  const sortedZones = [...zones].sort((left, right) =>
    rank === "weakest" ? left.score - right.score : right.score - left.score,
  );
  const zone = sortedZones[0];

  if (!zone) {
    return undefined;
  }

  return {
    zoneName: zone.zoneName,
    score: zone.score,
    href: zone.href,
  };
}

function normalizeCriterion(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return (
    expectedCriteria.find(
      (criterion) => criterion.toLowerCase() === normalizedValue,
    ) ?? value.trim()
  );
}

function normalizeZoneName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "et")
    .replace(/[^a-z0-9]+/g, "");
}
