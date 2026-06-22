import type { Standard } from "@/lib/types";

export const standardZones = [
  { id: "cal1", name: "CAL1" },
  { id: "cal2", name: "CAL2" },
  { id: "m1", name: "M1" },
  { id: "m2", name: "M2" },
  { id: "m3", name: "M3" },
  { id: "stockage-palettes-box", name: "Stockage palettes et box" },
];

export const mockStandards: Standard[] = standardZones.map((zone) => ({
  $id: `standard-${zone.id}`,
  id: `standard-${zone.id}`,
  zoneId: zone.id,
  title: `Standard 5S ${zone.name}`,
  description:
    "Référentiel attendu pour contrôler rapidement la conformité de la zone avant ou pendant l'audit.",
  rules: [
    "Palettes alignées",
    "Zone libre de circulation",
    "Aucun déchet au sol",
    "Consommables identifiés",
    "Palette non scannée interdite",
  ].join("\n"),
  active: true,
}));
