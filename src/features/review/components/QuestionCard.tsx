import React from "react";
import type { Question } from "../../../types/question";
import { getBuildingLabel } from "../../../data/buildings";
import { getCivilisationLabel } from "../../../data/civilizations";
import { getThemeLabel, getTypeLabel } from "../../../utils/questionLabels";
import type { EditQuestionForm } from "../utils/editForm";
import StatusBadge from "./StatusBadge";
import QuestionEditForm from "./QuestionEditForm";
import QuestionDetails from "./QuestionDetails";
import Button from "../../../components/ui/Button";

interface QuestionCardProps {
  question: Question;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
  onStartEdit: () => void;
  onZoomImage: (imageUrl: string) => void;
  /** PUT /questions : ADMIN, ou AUTHOR sur ses propres questions. */
  canEdit: boolean;
  /** PUT /questions/{id}/{status} est réservé aux rôles REVIEWER / ADMIN. */
  canReview: boolean;
  /** Changement de statut en cours pour cette question. */
  isPending: boolean;
  editForm: EditQuestionForm | null;
  isSavingEdit: boolean;
  onEditLibelleChange: (value: string) => void;
  onEditExplicationChange: (value: string) => void;
  onEditThemeChange: (value: string) => void;
  onEditCivilisationChange: (value: string) => void;
  onEditBuildingChange: (value: string) => void;
  onEditAnswerValueChange: (index: number, value: string) => void;
  onEditToggleAnswerCorrect: (index: number) => void;
  onEditAddAnswer: () => void;
  onEditRemoveAnswer: (index: number) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
  onStartEdit,
  onZoomImage,
  canEdit,
  canReview,
  isPending,
  editForm,
  isSavingEdit,
  onEditLibelleChange,
  onEditExplicationChange,
  onEditThemeChange,
  onEditCivilisationChange,
  onEditBuildingChange,
  onEditAnswerValueChange,
  onEditToggleAnswerCorrect,
  onEditAddAnswer,
  onEditRemoveAnswer,
  onEditSave,
  onEditCancel,
}) => {
  const isEditingThisQuestion = editForm?.id === question.id;
  // Pas d'action qui ne changerait rien : approuver une question validée, rejeter une rejetée.
  const canApprove = canReview && question.status !== "VALIDATED";
  const canReject = canReview && question.status !== "REJECTED";

  return (
    <div
      style={{
        border: "1px solid #4b5563",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "#1f2937",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        cursor: "pointer",
      }}
      onClick={onToggleExpand}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "12px",
        }}
      >
        <div style={{ flex: 1, marginRight: "16px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#e5e7eb",
            }}
          >
            {question.libelle || "(Pas d'intitulé)"}
          </h3>
          {question.type && (
            <p style={{ fontSize: "14px", color: "#9ca3af" }}>
              Type: {getTypeLabel(question.type)}
            </p>
          )}
          {question.theme && (
            <p style={{ fontSize: "14px", color: "#9ca3af" }}>
              Thème: {getThemeLabel(question.theme)}
            </p>
          )}
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>
            Civilisation: {getCivilisationLabel(question.civilisation)}
          </p>
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>
            Bâtiment: {getBuildingLabel(question.building)}
          </p>
        </div>
        <StatusBadge status={question.status} />
      </div>

      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        {canApprove && (
          <Button
            variant="success"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
          >
            {question.status === "REJECTED" ? "Réapprouver" : "Approuver"}
          </Button>
        )}
        {canEdit && !isEditingThisQuestion && (
          <Button
            variant="primary"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
          >
            Modifier
          </Button>
        )}
        {canReject && (
          <Button
            variant="danger"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
          >
            Rejeter
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {isExpanded ? "Masquer" : "Détails"}
        </Button>
      </div>

      {/* Section des détails expandable */}
      {isExpanded && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            backgroundColor: "#111827",
            borderRadius: "8px",
            border: "1px solid #374151",
          }}
        >
          {isEditingThisQuestion && editForm && (
            <QuestionEditForm
              form={editForm}
              saving={isSavingEdit}
              onLibelleChange={onEditLibelleChange}
              onExplicationChange={onEditExplicationChange}
              onThemeChange={onEditThemeChange}
              onCivilisationChange={onEditCivilisationChange}
              onBuildingChange={onEditBuildingChange}
              onAnswerValueChange={onEditAnswerValueChange}
              onToggleAnswerCorrect={onEditToggleAnswerCorrect}
              onAddAnswer={onEditAddAnswer}
              onRemoveAnswer={onEditRemoveAnswer}
              onSave={onEditSave}
              onCancel={onEditCancel}
            />
          )}
          <QuestionDetails question={question} onZoomImage={onZoomImage} />
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
