import React from "react";
import type { QuizQuestion } from "../utils/normalizeQuestions";
import { isExactMatch, computePoints, type QuizResult } from "../utils/scoring";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import QuestionMedia from "../../../components/QuestionMedia";

interface SoloCorrectionViewProps {
  result: QuizResult;
  currentQuestion?: QuizQuestion;
  index: number;
  total: number;
  savedTime: number;
  onPrev: () => void;
  onNext: () => void;
}

const SoloCorrectionView: React.FC<SoloCorrectionViewProps> = ({
  result: r,
  currentQuestion,
  index,
  total,
  savedTime,
  onPrev,
  onNext,
}) => {
  const questionIsCorrect = isExactMatch(r.selected, r.correct);
  const pts = computePoints(questionIsCorrect, savedTime);

  return (
    <div className="container page-md mt-5">
      <div className="card p-4">
        <div className="mb-3 text-center" style={{ color: "#9ca3af" }}>
          Question {index + 1} / {total}
        </div>
        <h3 className="mb-4 text-center">{r.intitule}</h3>

        {/* Afficher le media si applicable */}
        {currentQuestion?.fileUrl && (
          <div className="mb-4 text-center">
            <QuestionMedia
              fileUrl={currentQuestion.fileUrl}
              type={currentQuestion.type}
            />
          </div>
        )}
        {/* Afficher les réponses */}
        <div className="mb-4">
          <h5 className="mb-3" style={{ color: "#d1d5db" }}>
            Réponses :
          </h5>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {r.options.map((opt) => {
              const isCorrect = r.correct.includes(opt);
              const isSelected = r.selected.includes(opt);
              const isMissed = isCorrect && !isSelected;
              const isWrong = isSelected && !isCorrect;
              let bgColor = "#23272f";
              let borderColor = "#333";
              let textColor = "#e0e0e0";
              if (isCorrect && isSelected) {
                bgColor = "#2d3a2e";
                borderColor = "#4ade80";
                textColor = "#d1fae5";
              } else if (isCorrect && !isSelected) {
                bgColor = "#353535";
                borderColor = "#a3a3a3";
                textColor = "#bdbdbd";
              } else if (isWrong) {
                bgColor = "#3a2323";
                borderColor = "#f87171";
                textColor = "#fca5a5";
              }
              return (
                <li
                  key={opt}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    marginBottom: 6,
                    background: bgColor,
                    color: textColor,
                    border: `2px solid ${borderColor}`,
                    fontWeight: isMissed ? 700 : undefined,
                  }}
                >
                  {opt}
                  {isCorrect && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: isMissed ? "#f87171" : "#4ade80",
                        fontWeight: 700,
                      }}
                    >
                      ✓ Bonne réponse
                    </span>
                  )}
                  {isSelected && (
                    <span style={{ marginLeft: 8, fontWeight: 700 }}>
                      (Votre choix)
                    </span>
                  )}
                  {isMissed && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "#f87171",
                        fontWeight: 700,
                        opacity: 0.8,
                      }}
                    >
                      (Non sélectionné)
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Afficher l'explication si elle existe */}
        {currentQuestion?.explication && (
          <Alert
            variant="info"
            className="mb-4"
            style={{ borderColor: "#3b82f6", backgroundColor: "#1e3a5f" }}
          >
            <strong style={{ color: "#60a5fa" }}>Explication :</strong>
            <p style={{ marginTop: 8, marginBottom: 0, color: "#bfdbfe" }}>
              {currentQuestion.explication}
            </p>
          </Alert>
        )}

        {/* Afficher les points et temps */}
        <div
          style={{
            fontSize: 15,
            marginBottom: 16,
            color: "#a3a3a3",
            padding: "12px",
            backgroundColor: "#1a1a1a",
            borderRadius: 6,
          }}
        >
          Points obtenus :{" "}
          <span style={{ color: "#4ade80", fontWeight: 600 }}>{pts}</span>{" "}
          &nbsp;|&nbsp; Temps de réponse :{" "}
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>
            {savedTime}s
          </span>
        </div>

        {/* Boutons de navigation */}
        <div className="d-flex justify-content-between">
          <Button
            variant="outline-secondary"
            onClick={onPrev}
            disabled={index === 0}
          >
            ← Précédent
          </Button>
          <Button onClick={onNext}>
            {index === total - 1 ? "Voir le récapitulatif" : "Suivant →"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SoloCorrectionView;
