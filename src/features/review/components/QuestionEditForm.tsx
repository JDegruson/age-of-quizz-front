import React from "react";
import { BUILDING_OPTIONS } from "../../../data/buildings";
import { CIVILIZATIONS_MAP } from "../../../data/civilizations";
import {
  getThemeLabel,
  QUESTION_THEME_OPTIONS,
} from "../../../utils/questionLabels";
import type { EditQuestionForm } from "../utils/editForm";
import Button from "../../../components/ui/Button";

interface QuestionEditFormProps {
  form: EditQuestionForm;
  saving: boolean;
  onLibelleChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onCivilisationChange: (value: string) => void;
  onBuildingChange: (value: string) => void;
  onAnswerValueChange: (index: number, value: string) => void;
  onToggleAnswerCorrect: (index: number) => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

const QuestionEditForm: React.FC<QuestionEditFormProps> = ({
  form,
  saving,
  onLibelleChange,
  onThemeChange,
  onCivilisationChange,
  onBuildingChange,
  onAnswerValueChange,
  onToggleAnswerCorrect,
  onAddAnswer,
  onRemoveAnswer,
  onSave,
  onCancel,
}) => {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      style={{
        marginBottom: "20px",
        padding: "16px",
        backgroundColor: "#0f172a",
        borderRadius: "8px",
        border: "1px solid #1f2937",
      }}
    >
      <h4
        style={{
          fontSize: "16px",
          fontWeight: "600",
          marginBottom: "16px",
          color: "#e5e7eb",
        }}
      >
        Modifier la question
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label className="form-label">Libelle</label>
          <input
            type="text"
            value={form.libelle}
            onChange={(event) => onLibelleChange(event.target.value)}
            className="form-control"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <label className="form-label">Theme</label>
            <select
              value={form.theme}
              onChange={(event) => onThemeChange(event.target.value)}
              className="form-select"
            >
              {QUESTION_THEME_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {getThemeLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Civilisation</label>
            <select
              value={form.civilisation}
              onChange={(event) => onCivilisationChange(event.target.value)}
              className="form-select"
            >
              <option value="NONE">Aucune civilisation</option>
              {Object.entries(CIVILIZATIONS_MAP).map(([label, value]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Batiment</label>
            <select
              value={form.building}
              onChange={(event) => onBuildingChange(event.target.value)}
              className="form-select"
            >
              {BUILDING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div
            style={{ color: "#9ca3af", fontWeight: "600", marginBottom: "8px" }}
          >
            Reponses
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {form.answers.map((answer, index) => (
              <div
                key={`${form.id}-answer-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={answer.value}
                  onChange={(event) =>
                    onAnswerValueChange(index, event.target.value)
                  }
                  className="form-control"
                />
                <Button
                  type="button"
                  variant={answer.correct ? "success" : "outline-secondary"}
                  onClick={() => onToggleAnswerCorrect(index)}
                >
                  {answer.correct ? "Correct" : "Marquer"}
                </Button>
                {form.type !== "TRUE_FALSE" && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => onRemoveAnswer(index)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            ))}
          </div>
          {form.type !== "TRUE_FALSE" && (
            <Button
              type="button"
              variant="outline-secondary"
              className="mt-2"
              onClick={onAddAnswer}
            >
              Ajouter une reponse
            </Button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <Button
              type="button"
              variant="success"
              onClick={onSave}
              disabled={saving}
              loading={saving}
              loadingLabel="Enregistrement..."
            >
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditForm;
