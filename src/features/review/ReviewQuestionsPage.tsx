import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useRequireRole } from "../../hooks/useRequireRole";
import {
  fetchQuestions,
  updateQuestion,
  updateQuestionStatus,
} from "../../services/questionsApi";
import { Question } from "../../types/question";
import { useQuestionEditForm } from "./hooks/useQuestionEditForm";
import QuestionFilterBar from "./components/QuestionFilterBar";
import QuestionCard from "./components/QuestionCard";
import ImageZoomModal from "../../components/ImageZoomModal";
import Alert from "../../components/ui/Alert";
import Spinner from "../../components/ui/Spinner";

/**
 * Orchestrates the review screen: auth guard, data fetching, filters/sort,
 * and the currently-expanded/edited/zoomed question. The heavier pieces of
 * UI live in features/review/components, and the edit-form state lives in
 * the useQuestionEditForm hook.
 */
const ReviewQuestionsPage: React.FC = () => {
  const { user } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [civilFilter, setCivilFilter] = useState<string>("ALL");
  const [dateSort, setDateSort] = useState<string>("DESC");
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(
    null,
  );
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [savingEdit, setSavingEdit] = useState(false);

  const {
    editForm,
    startEditing,
    cancelEditing,
    setLibelle,
    setTheme,
    setCivilisation,
    setBuilding,
    setAnswerValue,
    toggleAnswerCorrect,
    addAnswer,
    removeAnswer,
  } = useQuestionEditForm();

  const {
    hasRequiredRole: hasReviewerRole,
    isAuthLoading,
    isAuthenticated,
  } = useRequireRole(["REVIEWER", "ADMIN"]);

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
        <Spinner label="Chargement..." className="mb-3" />
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

  const handleStartEdit = (question: Question) => {
    setExpandedQuestionId(question.id);
    startEditing(question);
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
      cancelEditing();
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
    const matchesCivil =
      civilFilter === "ALL" || (q.civilisation || "NONE") === civilFilter;
    return matchesStatus && matchesType && matchesCivil;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    const aDate = a.modifiedAt || a.createdAt;
    const bDate = b.modifiedAt || b.createdAt;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return dateSort === "DESC" ? bTime - aTime : aTime - bTime;
  });

  return (
    <>
      <div className="container page-xxl mt-5 review-panel">
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

        {error && <Alert className="mb-4">{error}</Alert>}

        <QuestionFilterBar
          statusFilter={filter}
          onStatusFilterChange={setFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          civilFilter={civilFilter}
          onCivilFilterChange={setCivilFilter}
          dateSort={dateSort}
          onDateSortChange={setDateSort}
          resultCount={filteredQuestions.length}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sortedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isExpanded={expandedQuestionId === question.id}
              onToggleExpand={() =>
                setExpandedQuestionId(
                  expandedQuestionId === question.id ? null : question.id,
                )
              }
              onApprove={() => handleStatusUpdate(question.id, "VALIDATED")}
              onReject={() => handleStatusUpdate(question.id, "REJECTED")}
              onStartEdit={() => handleStartEdit(question)}
              onZoomImage={(imageUrl) => {
                setZoomLevel(1);
                setZoomedImageUrl(imageUrl);
              }}
              editForm={editForm}
              isSavingEdit={savingEdit}
              onEditLibelleChange={setLibelle}
              onEditThemeChange={setTheme}
              onEditCivilisationChange={setCivilisation}
              onEditBuildingChange={setBuilding}
              onEditAnswerValueChange={setAnswerValue}
              onEditToggleAnswerCorrect={toggleAnswerCorrect}
              onEditAddAnswer={addAnswer}
              onEditRemoveAnswer={removeAnswer}
              onEditSave={handleEditSave}
              onEditCancel={cancelEditing}
            />
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
        <ImageZoomModal
          imageUrl={zoomedImageUrl}
          zoomLevel={zoomLevel}
          onClose={() => setZoomedImageUrl(null)}
          onToggleZoom={() => setZoomLevel((prev) => (prev === 1 ? 2 : 1))}
        />
      )}
    </>
  );
};

export default ReviewQuestionsPage;
