import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../components/Context/UserContext";
import { useAuth } from "../components/Context/AuthContext";
import { fetchQuestions, updateQuestionStatus } from "../services/api";
import { Question } from "../types";
import BACKEND_URL from "../config";

const ReviewQuestionsPage: React.FC = () => {
  const { user } = useUser();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(
    null,
  );

  // Vérifier si l'utilisateur a le rôle REVIEWER
  const hasReviewerRole = user?.roles?.some((role) => role.name === "REVIEWER");

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
      HISTORY: "Histoire",
      GEOGRAPHY: "Géographie",
      CULTURE: "Culture",
      MILITARY: "Militaire",
      ECONOMY: "Économie",
      TECHNOLOGY: "Technologie",
      RELIGION: "Religion",
      ART: "Art",
      TECH_TREE: "Arbre des technologies",
      UNIT_STATS: "Statistiques des unités",
    };
    return labels[theme || ""] || theme || "N/A";
  };

  const getCivilisationLabel = (civilisation?: string): string => {
    const labels: { [key: string]: string } = {
      AZTECS: "Aztèques",
      BRITONS: "Bretons",
      BYZANTINES: "Byzantins",
      CELTS: "Celtes",
      CHINESE: "Chinois",
      FRANKS: "Francs",
      GOTHS: "Goths",
      JAPANESE: "Japonais",
      MONGOLS: "Mongols",
      PERSIANS: "Perses",
      SARACENS: "Sarrasins",
      TEUTONS: "Teutons",
      TURKS: "Turcs",
      VIKINGS: "Vikings",
    };
    return labels[civilisation || ""] || civilisation || "N/A";
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

  const filteredQuestions = questions.filter((q) => {
    const matchesStatus = filter === "ALL" || q.status === filter;
    const matchesType = typeFilter === "ALL" || q.type === typeFilter;
    return matchesStatus && matchesType;
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
      </div>

      <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "20px" }}>
        {filteredQuestions.length} question(s) trouvée(s)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredQuestions.map((question) => (
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
                  {question.libelle || question.questionText}
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
                {question.civilisation && (
                  <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                    Civilisation: {getCivilisationLabel(question.civilisation)}
                  </p>
                )}
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

                  {question.civilisation && (
                    <div>
                      <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                        Civilisation:{" "}
                      </span>
                      <span style={{ color: "#e5e7eb" }}>
                        {getCivilisationLabel(question.civilisation)}
                      </span>
                    </div>
                  )}

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
                            console.log("Image URL:", imageUrl);
                            return (
                              <img
                                src={imageUrl}
                                alt="Question"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "400px",
                                  borderRadius: "8px",
                                  border: "1px solid #374151",
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
                            console.log("Audio URL:", audioUrl);
                            console.log("Question fileUrl:", question.fileUrl);
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
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
                  ) : null}
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
  );
};

export default ReviewQuestionsPage;
