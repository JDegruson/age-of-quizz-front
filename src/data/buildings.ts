export const BUILDING_OPTIONS = [
  { value: "NONE", label: "Aucun bâtiment" },
  { value: "TOWN_CENTER", label: "Forum" },
  { value: "MILL", label: "Moulin" },
  { value: "LUMBER_CAMP", label: "Camp de bûcherons" },
  { value: "MINING_CAMP", label: "Camp de mineurs" },
  { value: "DOCK", label: "Port" },
  { value: "MARKET", label: "Marché" },
  { value: "BLACKSMITH", label: "Forge" },
  { value: "BARRACKS", label: "Casernes" },
  { value: "ARCHERY_RANGE", label: "Camp de tir à l'arc" },
  { value: "STABLE", label: "Écurie" },
  { value: "SIEGE_WORKSHOP", label: "Atelier de siège" },
  { value: "MONASTERY", label: "Monastère" },
  { value: "UNIVERSITY", label: "Université" },
  { value: "CASTLE", label: "Château" },
  { value: "TOWER", label: "Tour de guet" },
];

export const BUILDING_LABELS: Record<string, string> = BUILDING_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<string, string>,
);

export const getBuildingLabel = (value?: string) => {
  if (!value) return BUILDING_LABELS.NONE || "Aucun bâtiment";
  if (value === "None") return BUILDING_LABELS.NONE || "Aucun bâtiment";
  return BUILDING_LABELS[value] || value;
};
