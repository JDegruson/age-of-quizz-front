/**
 * Human-readable (French) labels for the question domain enums (status,
 * type, theme). Extracted from ReviewQuestionsPage so this metadata can be
 * shared with the question-authoring pages later on, instead of only
 * living inside the review screen.
 */

export const QUESTION_STATUS_LABELS: { [key: string]: string } = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
  CREATED_REVIEW: "En révision",
  CLAIMED_REVIEW: "Prise en charge",
  VALIDATED: "Validée",
  DRAFT: "Brouillon",
};

export const getStatusLabel = (status?: string): string =>
  QUESTION_STATUS_LABELS[status || "PENDING"] || status || "En attente";

export const QUESTION_TYPE_LABELS: { [key: string]: string } = {
  MULTIPLE: "Choix multiple",
  TRUE_FALSE: "Vrai/Faux",
  SOUND: "Question audio",
  IMAGE: "Question image",
  TEXT: "Question texte",
};

export const getTypeLabel = (type?: string): string =>
  QUESTION_TYPE_LABELS[type || ""] || type || "N/A";

export const QUESTION_THEME_LABELS: { [key: string]: string } = {
  TECH_TREE: "Arbre des technologies",
  IMAGE: "Image",
  UNIT_STATS: "Statistiques des unités",
  SOUND: "Son",
  CULTURE: "Culture et histoire",
  SHORTCUTS: "Raccourcis",
};

export const getThemeLabel = (theme?: string): string =>
  QUESTION_THEME_LABELS[theme || ""] || theme || "N/A";

export const QUESTION_THEME_OPTIONS = Object.keys(QUESTION_THEME_LABELS);
