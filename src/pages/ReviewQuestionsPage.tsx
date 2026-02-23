import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../components/Context/UserContext";
import { useAuth } from "../components/Context/AuthContext";
import {
  fetchQuestions,
  updateQuestion,
  updateQuestionStatus,
} from "../services/api";
import { Question } from "../types";
import BACKEND_URL from "../config";
import { BUILDING_OPTIONS, getBuildingLabel } from "../data/buildings";
import { CIVILIZATIONS_LABELS, CIVILIZATIONS_MAP } from "../data/civilizations";

type EditAnswer = {
  id?: number;
  value: string;
  correct: boolean;
};

type EditQuestionForm = {
  id: number;
  libelle: string;
  theme: string;
  civilisation: string;
  building: string;
  type: string;
  fileUrl?: string;
  answers: EditAnswer[];
};

const ReviewQuestionsPage: React.FC = () => {
  const { user } = useUser();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dateSort, setDateSort] = useState<string>("DESC");
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(
    null,
  );
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [editForm, setEditForm] = useState<EditQuestionForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Vérifier si l'utilisateur a le rôle REVIEWER ou ADMIN
  const hasReviewerRole = user?.roles?.some(
    (role) => role.name === "REVIEWER" || role.name === "ADMIN",
  );

  // Fonctions de mapping pour les labels
  const getStatusLabel = (status?: string): string => {
    const labels: { [key: string]: string } = {
      PENDING: "En attente",
      APPROVED: "Approuvée",
      REJECTED: "Rejetée",
      CREATED_REVIEW: "En révision",
      CLAIMED_REVIEW: "Prise en charge",
      VALIDATED: "Validée",
      DRAFT: "Brouillon",
    };
    return labels[status || "PENDING"] || status || "En attente";
  };

  const getTypeLabel = (type?: string): string => {
    const labels: { [key: string]: string } = {
      MULTIPLE: "Choix multiple",
      TRUE_FALSE: "Vrai/Faux",
      SOUND: "Question audio",
      IMAGE: "Question image",
      TEXT: "Question texte",
    };
    return labels[type || ""] || type || "N/A";
  };

  const getThemeLabel = (theme?: string): string => {
    const labels: { [key: string]: string } = {
      TECH_TREE: "Arbre des technologies",
      IMAGE: "Image",
      UNIT_STATS: "Statistiques des unités",
      SOUND: "Son",
    };
    return labels[theme || ""] || theme || "N/A";
  };

  const themeOptions = ["TECH_TREE", "IMAGE", "UNIT_STATS", "SOUND"];

  const buildEditForm = (question: Question): EditQuestionForm => {
    const rawAnswers: EditAnswer[] = question.answers?.length
      ? question.answers.map((answer) => ({
          id: answer.id,
          value: answer.value || "",
          correct: Boolean(answer.correct),
        }))
      : question.options?.length
        ? question.options.map((option) => ({
            value: option,
            correct: option === question.correctAnswer,
          }))
        : question.correctAnswer
          ? [{ value: question.correctAnswer, correct: true }]
          : [];

    const normalizedAnswers =
      question.type === "TRUE_FALSE"
        ? (() => {
            const base = [
              { value: "Vrai", correct: false },
              { value: "Faux", correct: false },
            ];
            const merged = base.map((entry, index) =>
              rawAnswers[index]
                ? {
                    ...entry,
                    ...rawAnswers[index],
                  }
                : entry,
            );
            const firstCorrectIndex = merged.findIndex(
              (answer) => answer.correct,
            );
            return merged.map((answer, index) => ({
              ...answer,
              correct: index === firstCorrectIndex,
            }));
          })()
        : rawAnswers.length > 0
          ? rawAnswers
          : [{ value: "", correct: false }];

    return {
      id: question.id,
      libelle: question.libelle || question.questionText || "",
      theme: question.theme || "TECH_TREE",
      civilisation: question.civilisation || "NONE",
      building: question.building || "NONE",
      type: question.type || "MULTIPLE",
      fileUrl: question.fileUrl,
      answers: normalizedAnswers,
    };
  };

  const setEditAnswerValue = (index: number, value: string) => {
    if (!editForm) return;
    const nextAnswers = [...editForm.answers];
    nextAnswers[index] = { ...nextAnswers[index], value };
    setEditForm({ ...editForm, answers: nextAnswers });
  };

  const toggleEditAnswerCorrect = (index: number) => {
    if (!editForm) return;
    const nextAnswers = editForm.answers.map((answer, idx) => {
      if (editForm.type === "TRUE_FALSE") {
        return { ...answer, correct: idx === index };
      }
      if (idx === index) {
        return { ...answer, correct: !answer.correct };
      }
      return answer;
    });
    setEditForm({ ...editForm, answers: nextAnswers });
  };

  const addEditAnswer = () => {
    if (!editForm || editForm.type === "TRUE_FALSE") return;
    setEditForm({
      ...editForm,
      answers: [...editForm.answers, { value: "", correct: false }],
    });
  };

  const removeEditAnswer = (index: number) => {
    if (!editForm || editForm.type === "TRUE_FALSE") return;
    const nextAnswers = editForm.answers.filter((_, idx) => idx !== index);
    setEditForm({ ...editForm, answers: nextAnswers });
  };

  const getCivilisationLabel = (civilisation?: string): string => {
    if (!civilisation || civilisation === "NONE" || civilisation === "None") {
      return "Aucune civilisation";
    }
    return CIVILIZATIONS_LABELS[civilisation] || civilisation;
  };

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (!hasReviewerRole) {
        navigate("/");
      }
    }
  }, [isAuthenticated, isAuthLoading, hasReviewerRole, navigate]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!user?.jwt) return;

      try {
        setLoading(true);
        const data = await fetchQuestions(user.jwt);
        setQuestions(data);
        setError(null);
      } catch (err) {
        setError("Erreur lors du chargement des questions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && hasReviewerRole) {
      loadQuestions();
    }
  }, [isAuthenticated, hasReviewerRole, user?.jwt]);

  if (isAuthLoading || loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "#e5e7eb" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!hasReviewerRole) {
    return null;
  }

  const handleStatusUpdate = async (questionId: number, newStatus: string) => {
    if (!user?.jwt) return;

    try {
      await updateQuestionStatus(questionId, newStatus, user.jwt);
      // Recharger les questions après la mise à jour
      const data = await fetchQuestions(user.jwt);
      setQuestions(data);
      setError(null);
    } catch (err) {
      setError(`Erreur lors de la mise à jour du statut`);
      console.error(err);
    }
  };

  const handleEditSave = async () => {
    if (!user?.jwt || !editForm) return;

    const trimmedAnswers = editForm.answers
      .map((answer) => ({
        ...answer,
        value: answer.value.trim(),
      }))
      .filter((answer) => answer.value);

    if (!editForm.libelle.trim()) {
      setError("Le libelle est requis pour la modification");
      return;
    }

    if (trimmedAnswers.length === 0) {
      setError("Au moins une reponse est requise");
      return;
    }

    try {
      setSavingEdit(true);
      setError(null);
      await updateQuestion(
        {
          id: editForm.id,
          libelle: editForm.libelle.trim(),
          theme: editForm.theme,
          civilisation: editForm.civilisation || "NONE",
          building: editForm.building || "NONE",
          type: editForm.type,
          fileUrl: editForm.fileUrl,
          answers: trimmedAnswers.map((answer) => ({
            id: answer.id,
            value: answer.value,
            correct: answer.correct,
          })),
        },
        user.jwt,
      );
      const data = await fetchQuestions(user.jwt);
      setQuestions(data);
      setEditForm(null);
    } catch (err) {
      setError("Erreur lors de la modification de la question");
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesStatus = filter === "ALL" || q.status === filter;
    const matchesType = typeFilter === "ALL" || q.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    const aDate = a.updatedAt || a.createdAt;
    const bDate = b.updatedAt || b.createdAt;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return dateSort === "DESC" ? bTime - aTime : aTime - bTime;
  });

  const getStatusBadge = (status?: string) => {
    const styles: { [key: string]: React.CSSProperties } = {
      PENDING: {
        backgroundColor: "#fbbf24",
        color: "#78350f",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
      },
      APPROVED: {
        backgroundColor: "#34d399",
        color: "#065f46",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
      },
      VALIDATED: {
        backgroundColor: "#34d399",
        color: "#065f46",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
      },
      REJECTED: {
        backgroundColor: "#f87171",
        color: "#7f1d1d",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
      },
      CREATED_REVIEW: {
        backgroundColor: "#fbbf24",
        color: "#78350f",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
      },
      CLAIMED_REVIEW: {
        backgroundColor: "#60a5fa",
        color: "#1e3a8a",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
      },
    };

    return (
      <span style={styles[status || "PENDING"] || styles.PENDING}>
        {getStatusLabel(status)}
      </span>
    );
  };

  return (
    <>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "#e5e7eb",
          }}
        >
          Révision des Questions
        </h1>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label
              style={{
                marginRight: "10px",
                fontWeight: "bold",
                color: "#e5e7eb",
              }}
            >
              Filtrer par statut:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                border: "1px solid #4b5563",
                fontSize: "14px",
                backgroundColor: "#374151",
                color: "#e5e7eb",
              }}
            >
              <option value="ALL">Toutes</option>
              <option value="CREATED_REVIEW">En révision</option>
              <option value="CLAIMED_REVIEW">Prise en charge</option>
              <option value="VALIDATED">Validées</option>
              <option value="REJECTED">Rejetées</option>
            </select>
          </div>

          <div>
            <label
              style={{
                marginRight: "10px",
                fontWeight: "bold",
                color: "#e5e7eb",
              }}
            >
              Filtrer par type:
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                border: "1px solid #4b5563",
                fontSize: "14px",
                backgroundColor: "#374151",
                color: "#e5e7eb",
              }}
            >
              <option value="ALL">Tous les types</option>
              <option value="MULTIPLE">Choix multiple</option>
              <option value="TRUE_FALSE">Vrai/Faux</option>
              <option value="SOUND">Question audio</option>
              <option value="IMAGE">Question image</option>
            </select>
          </div>
          <div>
            <label
              style={{
                marginRight: "10px",
                fontWeight: "bold",
                color: "#e5e7eb",
              }}
            >
              Trier par date (modif/crea):
            </label>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                border: "1px solid #4b5563",
                fontSize: "14px",
                backgroundColor: "#374151",
                color: "#e5e7eb",
              }}
            >
              <option value="DESC">Plus recente</option>
              <option value="ASC">Plus ancienne</option>
            </select>
          </div>
        </div>

        <div
          style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "20px" }}
        >
          {filteredQuestions.length} question(s) trouvée(s)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sortedQuestions.map((question) => (
            <div
              key={question.id}
              style={{
                border: "1px solid #4b5563",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "#1f2937",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                cursor: "pointer",
              }}
              onClick={() =>
                setExpandedQuestionId(
                  expandedQuestionId === question.id ? null : question.id,
                )
              }
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
                    {question.libelle ||
                      question.questionText ||
                      "(Pas d'intitulé)"}
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
                {getStatusBadge(question.status)}
              </div>

              <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(question.id, "VALIDATED");
                  }}
                >
                  Approuver
                </button>
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedQuestionId(question.id);
                    setEditForm(buildEditForm(question));
                  }}
                >
                  Modifier
                </button>
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(question.id, "REJECTED");
                  }}
                >
                  Rejeter
                </button>
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedQuestionId(
                      expandedQuestionId === question.id ? null : question.id,
                    );
                  }}
                >
                  {expandedQuestionId === question.id ? "Masquer" : "Détails"}
                </button>
              </div>

              {/* Section des détails expandable */}
              {expandedQuestionId === question.id && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    backgroundColor: "#111827",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                  }}
                >
                  {editForm?.id === question.id && (
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
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "6px",
                              color: "#9ca3af",
                              fontWeight: "600",
                            }}
                          >
                            Libelle
                          </label>
                          <input
                            type="text"
                            value={editForm.libelle}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                libelle: event.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #374151",
                              backgroundColor: "#1f2937",
                              color: "#e5e7eb",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "6px",
                                color: "#9ca3af",
                                fontWeight: "600",
                              }}
                            >
                              Theme
                            </label>
                            <select
                              value={editForm.theme}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  theme: event.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #374151",
                                backgroundColor: "#1f2937",
                                color: "#e5e7eb",
                              }}
                            >
                              {themeOptions.map((value) => (
                                <option key={value} value={value}>
                                  {getThemeLabel(value)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "6px",
                                color: "#9ca3af",
                                fontWeight: "600",
                              }}
                            >
                              Civilisation
                            </label>
                            <select
                              value={editForm.civilisation}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  civilisation: event.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #374151",
                                backgroundColor: "#1f2937",
                                color: "#e5e7eb",
                              }}
                            >
                              <option value="NONE">Aucune civilisation</option>
                              {Object.entries(CIVILIZATIONS_MAP).map(
                                ([label, value]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "6px",
                                color: "#9ca3af",
                                fontWeight: "600",
                              }}
                            >
                              Batiment
                            </label>
                            <select
                              value={editForm.building}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  building: event.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #374151",
                                backgroundColor: "#1f2937",
                                color: "#e5e7eb",
                              }}
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
                            style={{
                              color: "#9ca3af",
                              fontWeight: "600",
                              marginBottom: "8px",
                            }}
                          >
                            Reponses
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {editForm.answers.map((answer, index) => (
                              <div
                                key={`${editForm.id}-answer-${index}`}
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
                                    setEditAnswerValue(
                                      index,
                                      event.target.value,
                                    )
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #374151",
                                    backgroundColor: "#1f2937",
                                    color: "#e5e7eb",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleEditAnswerCorrect(index)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #374151",
                                    backgroundColor: answer.correct
                                      ? "#065f46"
                                      : "#1f2937",
                                    color: "#e5e7eb",
                                    cursor: "pointer",
                                  }}
                                >
                                  {answer.correct ? "Correct" : "Marquer"}
                                </button>
                                {editForm.type !== "TRUE_FALSE" && (
                                  <button
                                    type="button"
                                    onClick={() => removeEditAnswer(index)}
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      border: "1px solid #7f1d1d",
                                      backgroundColor: "#991b1b",
                                      color: "#fee2e2",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {editForm.type !== "TRUE_FALSE" && (
                            <button
                              type="button"
                              onClick={addEditAnswer}
                              style={{
                                marginTop: "10px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid #374151",
                                backgroundColor: "#1f2937",
                                color: "#e5e7eb",
                                cursor: "pointer",
                              }}
                            >
                              Ajouter une reponse
                            </button>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={handleEditSave}
                            disabled={savingEdit}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: savingEdit ? "not-allowed" : "pointer",
                              fontWeight: "600",
                            }}
                          >
                            {savingEdit ? "Enregistrement..." : "Enregistrer"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(null)}
                            disabled={savingEdit}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#374151",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: savingEdit ? "not-allowed" : "pointer",
                              fontWeight: "600",
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {(question.authorUsername || question.createdBy) && (
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Auteur:{" "}
                        </span>
                        <span style={{ color: "#e5e7eb" }}>
                          {question.authorUsername ||
                            question.createdBy?.username}
                          {question.createdBy?.id &&
                            ` (ID: ${question.createdBy.id})`}
                        </span>
                      </div>
                    )}

                    {question.theme && (
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Thème:{" "}
                        </span>
                        <span style={{ color: "#e5e7eb" }}>
                          {getThemeLabel(question.theme)}
                        </span>
                      </div>
                    )}

                    <div>
                      <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                        Civilisation:{" "}
                      </span>
                      <span style={{ color: "#e5e7eb" }}>
                        {getCivilisationLabel(question.civilisation)}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                        Bâtiment:{" "}
                      </span>
                      <span style={{ color: "#e5e7eb" }}>
                        {getBuildingLabel(question.building)}
                      </span>
                    </div>

                    {question.fileUrl && (
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Fichier:{" "}
                        </span>
                        <div style={{ marginTop: "8px" }}>
                          {question.type === "IMAGE" &&
                            (() => {
                              // Extraire le nom du fichier en gérant les / et les \
                              const filename = question.fileUrl
                                .split(/[/\\]/)
                                .pop();
                              const imageUrl = `${BACKEND_URL}/media/image/${encodeURIComponent(filename || "")}`;

                              return (
                                <img
                                  src={imageUrl}
                                  alt="Question"
                                  onClick={() => {
                                    setZoomLevel(1);
                                    setZoomedImageUrl(imageUrl);
                                  }}
                                  title="Cliquer pour zoomer"
                                  style={{
                                    maxWidth: "320px",
                                    width: "100%",
                                    height: "auto",
                                    borderRadius: "8px",
                                    border: "1px solid #374151",
                                    cursor: "zoom-in",
                                  }}
                                />
                              );
                            })()}
                          {question.type === "SOUND" &&
                            (() => {
                              // Extraire le nom du fichier en gérant les / et les \
                              const filename = question.fileUrl
                                .split(/[/\\]/)
                                .pop();
                              const audioUrl = `${BACKEND_URL}/media/audio/${encodeURIComponent(filename || "")}`;

                              // ...log supprimé...
                              return (
                                <audio
                                  controls
                                  style={{ width: "100%", marginTop: "8px" }}
                                >
                                  <source src={audioUrl} type="audio/mpeg" />
                                  Votre navigateur ne supporte pas l'élément
                                  audio.
                                </audio>
                              );
                            })()}
                          {(() => {
                            const filename = question.fileUrl
                              .split(/[/\\]/)
                              .pop();
                            const mediaUrl =
                              question.type === "IMAGE"
                                ? `${BACKEND_URL}/media/image/${encodeURIComponent(filename || "")}`
                                : `${BACKEND_URL}/media/audio/${encodeURIComponent(filename || "")}`;
                            return (
                              <a
                                href={mediaUrl}
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
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    <div>
                      <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                        Type:{" "}
                      </span>
                      <span style={{ color: "#e5e7eb" }}>
                        {getTypeLabel(question.type)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                        Statut:{" "}
                      </span>
                      <span style={{ color: "#e5e7eb" }}>
                        {getStatusLabel(question.status)}
                      </span>
                    </div>

                    {question.createdAt && (
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Date de création:
                        </span>
                        <span style={{ color: "#e5e7eb" }}>
                          {" "}
                          {new Date(question.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                    )}
                    {question.updatedAt && (
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Dernière modification:
                        </span>
                        <span style={{ color: "#e5e7eb" }}>
                          {" "}
                          {new Date(question.updatedAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                    )}

                    {/* Réponses/Options */}
                    {/* Affichage des réponses, fallback si answers absent */}
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
                        <ul
                          style={{ listStyle: "none", padding: 0, margin: 0 }}
                        >
                          {question.answers.map((answer) => (
                            <li
                              key={answer.id}
                              style={{
                                padding: "8px 12px",
                                marginBottom: "6px",
                                backgroundColor: answer.correct
                                  ? "#065f46"
                                  : "#374151",
                                borderRadius: "4px",
                                fontSize: "14px",
                                color: "#e5e7eb",
                                border: answer.correct
                                  ? "2px solid #34d399"
                                  : "none",
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
                    ) : question.options && question.options.length > 0 ? (
                      <div>
                        <span
                          style={{
                            color: "#9ca3af",
                            fontWeight: "600",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          Réponses proposées ({question.options.length}):
                        </span>
                        <ul
                          style={{ listStyle: "none", padding: 0, margin: 0 }}
                        >
                          {question.options.map((option, index) => (
                            <li
                              key={index}
                              style={{
                                padding: "8px 12px",
                                marginBottom: "6px",
                                backgroundColor:
                                  option === question.correctAnswer
                                    ? "#065f46"
                                    : "#374151",
                                borderRadius: "4px",
                                fontSize: "14px",
                                color: "#e5e7eb",
                                border:
                                  option === question.correctAnswer
                                    ? "2px solid #34d399"
                                    : "none",
                              }}
                            >
                              {option}
                              {option === question.correctAnswer && (
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
                    ) : question.correctAnswer ? (
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Réponse correcte:
                        </span>
                        <span style={{ color: "#34d399", fontWeight: "bold" }}>
                          {" "}
                          {question.correctAnswer}
                        </span>
                      </div>
                    ) : (
                      <div style={{ color: "#f87171", marginTop: 8 }}>
                        Aucune réponse disponible pour cette question.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#9ca3af",
                fontSize: "16px",
              }}
            >
              Aucune question trouvée pour ce filtre.
            </div>
          )}
        </div>
      </div>
      {zoomedImageUrl && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setZoomedImageUrl(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setZoomedImageUrl(null);
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
            cursor: "zoom-out",
          }}
          aria-label="Fermer le zoom"
        >
          <img
            src={zoomedImageUrl}
            alt="Agrandissement"
            onClick={(event) => {
              event.stopPropagation();
              setZoomLevel((prev) => (prev === 1 ? 2 : 1));
            }}
            style={{
              maxWidth: "95%",
              maxHeight: "95%",
              borderRadius: "8px",
              border: "1px solid #374151",
              backgroundColor: "#111827",
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              cursor: zoomLevel === 1 ? "zoom-in" : "zoom-out",
            }}
          />
        </div>
      )}
    </>
  );
};

export default ReviewQuestionsPage;
