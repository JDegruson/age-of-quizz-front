import React, { useRef } from "react";
import type { QuizQuestion } from "../utils/normalizeQuestions";
import type { LivePlayerScore } from "../hooks/useMultiplayerQuizSocket";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import QuestionMedia from "../../../components/QuestionMedia";

interface QuestionViewProps {
  question: QuizQuestion;
  index: number;
  total: number;
  timer: number;
  /** When true, `timer` is the elapsed time instead of the remaining time. */
  isUnlimitedTime?: boolean;
  selectedOptionIds: number[];
  onSelect: (optionText: string) => void;
  onNext: () => void;
  isSubmitting: boolean;
  isMultiplayer: boolean;
  isWaitingNextQuestion: boolean;
  waitingElapsedSeconds: number;
  liveScores: LivePlayerScore[];
  audioBlobUrl: string | null;
  onZoomImage: (imageUrl: string) => void;
}

const QuestionView: React.FC<QuestionViewProps> = ({
  question: q,
  index,
  total,
  timer,
  isUnlimitedTime = false,
  selectedOptionIds: selected,
  onSelect,
  onNext,
  isSubmitting,
  isMultiplayer,
  isWaitingNextQuestion,
  waitingElapsedSeconds,
  liveScores,
  audioBlobUrl,
  onZoomImage,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Render media if needed
  const media = q.fileUrl ? (
    <div className="mb-4 text-center">
      <QuestionMedia
        fileUrl={q.fileUrl}
        type={q.type}
        imageTitle="Cliquer pour zoomer"
        onImageClick={onZoomImage}
        audioRef={audioRef}
        audioAutoPlay
        audioSrcOverride={audioBlobUrl || undefined}
        audioMarginTop={8}
      />
    </div>
  ) : null;

  return (
    <div className="container page-fit page-md mt-5">
      <Card shadow={false}>
        <div className="mb-3 fw-bold fs-5 text-center">
          Question {index + 1} / {total}
        </div>
        <div
          className="mb-3 text-center"
          style={{
            fontSize: 20,
            color: !isUnlimitedTime && timer <= 5 ? "#dc2626" : "#2563eb",
            fontWeight: 700,
          }}
        >
          {isUnlimitedTime
            ? `Temps écoulé : ${timer}s`
            : `Temps restant : ${timer}s`}
        </div>
        <div className="mb-4 fs-4 text-center">{q.intitule}</div>
        <div className="mb-3 text-center" style={{ color: "#9ca3af" }}>
          Auteur : {q.authorName || "Inconnu"}
        </div>
        {media}
        {isMultiplayer && liveScores.length > 0 && (
          <div
            className="mb-3 p-3"
            style={{ backgroundColor: "#111827", borderRadius: 8 }}
          >
            <div className="mb-2" style={{ color: "#d1d5db", fontWeight: 600 }}>
              Classement live
            </div>
            <div style={{ color: "#9ca3af", fontSize: 14 }}>
              {liveScores
                .slice(0, 5)
                .map((player) => {
                  const rank =
                    typeof player.rank === "number" ? `#${player.rank}` : "#-";
                  const scoreText =
                    typeof player.score === "number"
                      ? `score ${player.score}`
                      : "score -";
                  const pointsText =
                    typeof player.points === "number"
                      ? `${player.points} pts`
                      : "- pts";
                  return `${rank} ${player.username}: ${scoreText}, ${pointsText}`;
                })
                .join(" | ")}
            </div>
          </div>
        )}
        <div className="mb-4">
          {isWaitingNextQuestion && (
            <Alert
              variant="info"
              style={{ backgroundColor: "#1e3a5f", borderColor: "#3b82f6" }}
            >
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
                style={{ marginRight: 8 }}
              />
              Reponse envoyee. En attente de la prochaine question... (
              {waitingElapsedSeconds}s)
            </Alert>
          )}
          {q.options.map((opt, idx) => {
            const optionId = q.optionIds[idx];
            return (
              <Button
                key={opt}
                variant={
                  selected.includes(optionId) ? "theme" : "outline-theme"
                }
                className="w-100 mb-2"
                style={{ fontWeight: 600, fontSize: 18 }}
                onClick={() => onSelect(opt)}
                disabled={isWaitingNextQuestion || isSubmitting}
              >
                {opt}
              </Button>
            );
          })}
        </div>
        <div className="text-end">
          {selected.length === 0 && !isWaitingNextQuestion && (
            <small className="me-3" style={{ color: "#9ca3af" }}>
              Sélectionne au moins une réponse
            </small>
          )}
          <Button
            onClick={onNext}
            // The countdown calls onNext directly on expiry, so an
            // unanswered question still moves on when time runs out.
            disabled={
              isSubmitting || isWaitingNextQuestion || selected.length === 0
            }
          >
            {isMultiplayer
              ? isSubmitting
                ? "Validation..."
                : isWaitingNextQuestion
                  ? "En attente de la prochaine question..."
                  : "Valider"
              : index === total - 1
                ? "Voir la correction"
                : "Question suivante"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuestionView;
