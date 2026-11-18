import React, { useEffect, useState } from "react";
import axios from "axios";
import { reportQuestion } from "../services/questionsApi";
import {
  REPORT_COMMENT_MAX_LENGTH,
  REPORT_REASONS,
  type QuestionReportReason,
} from "../types/questionReport";
import Button from "./ui/Button";
import styles from "./ReportQuestionModal.module.css";

interface ReportQuestionModalProps {
  questionId: number;
  questionText: string;
  jwt: string;
  onClose: () => void;
  /** Called once the report has been saved by the back. */
  onReported: () => void;
}

/**
 * Lets a player report a question: a predefined reason plus an optional free
 * comment (mandatory for "Autre").
 */
const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  questionId,
  questionText,
  jwt,
  onClose,
  onReported,
}) => {
  const [reason, setReason] = useState<QuestionReportReason | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, sending]);

  const trimmedComment = comment.trim();
  const commentRequired = reason === "OTHER";
  const canSubmit =
    !!reason && (!commentRequired || trimmedComment.length > 0) && !sending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason || !canSubmit) return;
    try {
      setSending(true);
      setError(null);
      await reportQuestion(questionId, reason, trimmedComment || null, jwt);
      onReported();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(message || "Impossible d'envoyer le signalement, réessayez.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={() => !sending && onClose()}
      role="presentation"
    >
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-question-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="report-question-title" className={styles.title}>
          <i className="bi bi-flag-fill me-2" aria-hidden="true"></i>
          Signaler la question
        </h2>
        <p className={styles.questionText}>{questionText}</p>

        <fieldset className={styles.reasons}>
          <legend className="visually-hidden">Motif du signalement</legend>
          {REPORT_REASONS.map((option) => (
            <label
              key={option.value}
              className={`${styles.reason} ${reason === option.value ? styles.reasonSelected : ""}`}
            >
              <input
                type="radio"
                name="report-reason"
                value={option.value}
                checked={reason === option.value}
                onChange={() => setReason(option.value)}
              />
              <span>
                <span className={styles.reasonLabel}>{option.label}</span>
                <span className={styles.reasonHint}>{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <label htmlFor="report-comment" className={styles.commentLabel}>
          Précisions {commentRequired ? "(obligatoire)" : "(facultatif)"}
        </label>
        <textarea
          id="report-comment"
          className="form-control"
          rows={3}
          maxLength={REPORT_COMMENT_MAX_LENGTH}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Ex. : depuis le patch 13.x, le coût est passé à 150 or"
        />
        <div className={styles.counter}>
          {comment.length}/{REPORT_COMMENT_MAX_LENGTH}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={sending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            loading={sending}
            loadingLabel="Envoi..."
          >
            Signaler
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReportQuestionModal;
