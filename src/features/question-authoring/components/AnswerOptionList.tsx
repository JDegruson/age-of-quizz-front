import React from "react";
import Button from "../../../components/ui/Button";

interface AnswerOptionListProps {
  answers: string[];
  correctIndices: number[];
  onAnswerChange: (index: number, value: string) => void;
  onToggleCorrect: (index: number) => void;
}

const AnswerOptionList: React.FC<AnswerOptionListProps> = ({
  answers,
  correctIndices,
  onAnswerChange,
  onToggleCorrect,
}) => {
  return (
    <>
      <h5 className="mt-4 mb-3">Réponses (cochez les bonnes réponses)</h5>
      {answers.map((ans, i) => {
        const isCorrect = correctIndices.includes(i);
        return (
          <div
            key={i}
            className={`card mb-3 ${isCorrect ? "border-success" : ""}`}
            style={{
              padding: "15px",
              backgroundColor: isCorrect ? "#1e4d2b" : "#2d2d2d",
            }}
          >
            <div className="row align-items-center">
              <div className="col-md-8">
                <label className="form-label fw-semibold">
                  Réponse {i + 1}
                </label>
                <input
                  type="text"
                  value={ans}
                  onChange={(e) => onAnswerChange(i, e.target.value)}
                  className="form-control form-control-lg"
                  placeholder={`Réponse ${i + 1}`}
                />
              </div>

              <div className="col-md-4 text-center">
                <Button
                  type="button"
                  aria-pressed={isCorrect}
                  onClick={() => onToggleCorrect(i)}
                  variant={isCorrect ? "theme" : "outline-secondary"}
                  className="btn-lg w-100"
                  style={{ fontWeight: "600" }}
                >
                  <span style={{ fontSize: 18 }}>{isCorrect ? "✓" : "○"}</span>{" "}
                  {isCorrect ? "Bonne réponse" : "Marquer comme correcte"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default AnswerOptionList;
