export type QuestionReportReason =
  | "OUTDATED"
  | "WRONG_ANSWER"
  | "WORDING"
  | "MEDIA"
  | "OTHER";

/** Mirrors QuestionReportDTO on the back. */
export interface QuestionReport {
  id: number;
  questionId: number;
  reason: QuestionReportReason;
  comment: string | null;
  reporterName: string | null;
  createdAt: string;
}

/** Same limit as QuestionReport.COMMENT_MAX_LENGTH on the back. */
export const REPORT_COMMENT_MAX_LENGTH = 500;

export const REPORT_REASONS: {
  value: QuestionReportReason;
  label: string;
  hint: string;
}[] = [
  {
    value: "OUTDATED",
    label: "Question plus à jour",
    hint: "Un patch ou un équilibrage a changé la réponse",
  },
  {
    value: "WRONG_ANSWER",
    label: "Réponse incorrecte",
    hint: "La bonne réponse indiquée est fausse",
  },
  {
    value: "WORDING",
    label: "Faute ou formulation ambiguë",
    hint: "Orthographe, question mal posée",
  },
  {
    value: "MEDIA",
    label: "Problème d'image ou de son",
    hint: "Absent, illisible ou sans rapport",
  },
  { value: "OTHER", label: "Autre", hint: "Précisez le problème" },
];

export const getReportReasonLabel = (reason: QuestionReportReason) =>
  REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
