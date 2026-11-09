import React from "react";
import type { Question } from "../../../types/question";
import { buildQuestionMediaUrl } from "../../../utils/mediaUrl";
import {
  getStatusLabel,
  getThemeLabel,
  getTypeLabel,
} from "../../../utils/questionLabels";
import { getBuildingLabel } from "../../../data/buildings";
import { getCivilisationLabel } from "../../../data/civilizations";
import QuestionMedia from "../../../components/QuestionMedia";

const LABEL_STYLE: React.CSSProperties = {
  color: "#9ca3af",
  fontWeight: "600",
};
const VALUE_STYLE: React.CSSProperties = { color: "#e5e7eb" };

interface QuestionDetailsProps {
  question: Question;
  onZoomImage: (imageUrl: string) => void;
}

const QuestionDetails: React.FC<QuestionDetailsProps> = ({
  question,
  onZoomImage,
}) => {
  return (
    <>
      <h4
        style={{
          fontSize: "16px",
          fontWeight: "600",
          marginBottom: "16px",
          color: "#e5e7eb",
        }}
      >
        Détails complets
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {question.authorUsername && (
          <div>
            <span style={LABEL_STYLE}>Auteur: </span>
            <span style={VALUE_STYLE}>{question.authorUsername}</span>
          </div>
        )}

        {question.explication && (
          <div>
            <span style={LABEL_STYLE}>Explication: </span>
            <span style={VALUE_STYLE}>{question.explication}</span>
          </div>
        )}

        {question.theme && (
          <div>
            <span style={LABEL_STYLE}>Thème: </span>
            <span style={VALUE_STYLE}>{getThemeLabel(question.theme)}</span>
          </div>
        )}

        <div>
          <span style={LABEL_STYLE}>Civilisation: </span>
          <span style={VALUE_STYLE}>
            {getCivilisationLabel(question.civilisation)}
          </span>
        </div>

        <div>
          <span style={LABEL_STYLE}>Bâtiment: </span>
          <span style={VALUE_STYLE}>{getBuildingLabel(question.building)}</span>
        </div>

        {question.fileUrl && (
          <div>
            <span style={LABEL_STYLE}>Fichier: </span>
            <div style={{ marginTop: "8px" }}>
              <QuestionMedia
                fileUrl={question.fileUrl}
                type={question.type}
                imageTitle="Cliquer pour zoomer"
                onImageClick={onZoomImage}
                audioMarginTop={8}
              />
              <a
                href={buildQuestionMediaUrl(question.type, question.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#60a5fa",
                  textDecoration: "underline",
                  display: "block",
                  marginTop: "8px",
                }}
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        )}

        <div>
          <span style={LABEL_STYLE}>Type: </span>
          <span style={VALUE_STYLE}>{getTypeLabel(question.type)}</span>
        </div>
        <div>
          <span style={LABEL_STYLE}>Statut: </span>
          <span style={VALUE_STYLE}>{getStatusLabel(question.status)}</span>
        </div>

        {question.createdAt && (
          <div>
            <span style={LABEL_STYLE}>Date de création:</span>
            <span style={VALUE_STYLE}>
              {" "}
              {new Date(question.createdAt).toLocaleString("fr-FR")}
            </span>
          </div>
        )}
        {question.modifiedAt && (
          <div>
            <span style={LABEL_STYLE}>Dernière modification:</span>
            <span style={VALUE_STYLE}>
              {" "}
              {new Date(question.modifiedAt).toLocaleString("fr-FR")}
            </span>
          </div>
        )}

        {question.answers && question.answers.length > 0 ? (
          <div>
            <span
              style={{
                color: "#9ca3af",
                fontWeight: "600",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Réponses proposées ({question.answers.length}):
            </span>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {question.answers.map((answer) => (
                <li
                  key={answer.id}
                  style={{
                    padding: "8px 12px",
                    marginBottom: "6px",
                    backgroundColor: answer.correct ? "#065f46" : "#374151",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#e5e7eb",
                    border: answer.correct ? "2px solid #34d399" : "none",
                  }}
                >
                  {answer.value}
                  {answer.correct && (
                    <span
                      style={{
                        color: "#34d399",
                        fontWeight: "bold",
                        marginLeft: "8px",
                      }}
                    >
                      ✓ Réponse correcte
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ color: "#f87171", marginTop: 8 }}>
            Aucune réponse disponible pour cette question.
          </div>
        )}
      </div>
    </>
  );
};

export default QuestionDetails;
