export type NotificationType =
  | "QUESTION_VALIDATED"
  | "QUESTION_REJECTED"
  | "QUESTION_MODIFIED"
  | "QUESTION_TO_REVIEW"
  | "QUESTION_RESUBMITTED"
  | "QUESTION_REPORTED";

/** Mirrors NotificationDTO on the back. */
export interface AppNotification {
  id: number;
  type: NotificationType;
  questionId: number;
  questionLibelle: string | null;
  actorName: string | null;
  createdAt: string;
  read: boolean;
}
