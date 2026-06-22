export function getAuditScoreStatus(scorePercent: number) {
  if (scorePercent >= 90) {
    return {
      label: "Conforme",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (scorePercent >= 80) {
    return {
      label: "À surveiller",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }

  return {
    label: "Non conforme",
    className: "bg-red-50 text-red-700 ring-red-200",
  };
}
