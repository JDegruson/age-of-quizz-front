import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { requestNotificationsRefresh } from "../../services/notificationsApi";
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
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";

/** Nombre de cartes affichées d'un coup : la liste complète dépasse 1500 questions. */
const PAGE_SIZE = 50;

/**
 * Orchestrates the review screen: auth guard, data fetching, filters/sort,
 * and the currently-expanded/edited/zoomed question. The heavier pieces of
 * UI live in features/review/components, and the edit-form state lives in
 * the useQuestionEditForm hook.
 *
 * La liste n'est chargée qu'une fois : après une action, la question renvoyée
 * par le back remplace l'ancienne dans la liste locale.
 */
const ReviewQuestionsPage: React.FC = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  // ?question=<id> (lien depuis une notification) : on n'affiche que cette question.
  const focusedQuestionId = Number(searchParams.get("question")) || null;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [civilFilter, setCivilFilter] = useState<string>("ALL");
  const [authorFilter, setAuthorFilter] = useState<string>("ALL");
  const [dateSort, setDateSort] = useState<string>("DESC");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(
    null,
  );
  const [pendingQuestionId, setPendingQuestionId] = useState<number | null>(
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
    setExplication,
    setTheme,
    setCivilisation,
    setBuilding,
    setAnswerValue,
    toggleAnswerCorrect,
    addAnswer,
    removeAnswer,
  } = useQuestionEditForm();

  const {
    hasRequiredRole: canViewQuestions,
    isAuthLoading,
    isAuthenticated,
  } = useRequireRole(["AUTHOR", "REVIEWER", "ADMIN"]);

  const hasRole = (...names: string[]) =>
    !!user?.roles?.some((role) => names.includes(role.name));
  const isAuthor = hasRole("AUTHOR");
  // Les auteurs consultent la liste, seuls les relecteurs changent le statut.
  const canReview = hasRole("REVIEWER", "ADMIN");
  // Un relecteur (ou admin) modifie toutes les questions, y compris les
  // siennes ; un simple auteur uniquement les siennes.
  const canEditQuestion = (question: Question) =>
    canReview ||
    (isAuthor &&
      !!user?.username &&
      question.authorUsername === user.username);

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

    if (isAuthenticated && canViewQuestions) {
      loadQuestions();
    }
  }, [isAuthenticated, canViewQuestions, user?.jwt]);

  // Arrivée depuis une notification : la question ciblée est dépliée.
  useEffect(() => {
    if (focusedQuestionId) setExpandedQuestionId(focusedQuestionId);
  }, [focusedQuestionId]);

  // Nouveau filtre ou tri : on repart des premières cartes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, typeFilter, civilFilter, authorFilter, dateSort]);

  // Auteurs présents dans les questions chargées, triés alphabétiquement.
  const authors = useMemo(
    () =>
      Array.from(
        new Set(
          questions
            .map((q) => q.authorUsername)
            .filter((name): name is string => !!name),
        ),
      ).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    [questions],
  );

  const sortedQuestions = useMemo(() => {
    if (focusedQuestionId) {
      return questions.filter((q) => q.id === focusedQuestionId);
    }
    const filtered = questions.filter((q) => {
      const matchesStatus = filter === "ALL" || q.status === filter;
      const matchesType = typeFilter === "ALL" || q.type === typeFilter;
      const matchesCivil =
        civilFilter === "ALL" || (q.civilisation || "NONE") === civilFilter;
      const matchesAuthor =
        authorFilter === "ALL" ||
        (q.authorUsername || "NONE") === authorFilter;
      return matchesStatus && matchesType && matchesCivil && matchesAuthor;
    });
    const timeOf = (q: Question) => {
      const date = q.modifiedAt || q.createdAt;
      return date ? new Date(date).getTime() : 0;
    };
    return filtered.sort((a, b) =>
      dateSort === "DESC" ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b),
    );
  }, [
    questions,
    focusedQuestionId,
    filter,
    typeFilter,
    civilFilter,
    authorFilter,
    dateSort,
  ]);

  if (isAuthLoading || loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "#e5e7eb" }}>
        <Spinner label="Chargement..." className="mb-3" />
        <p>Chargement...</p>
      </div>
    );
  }

  if (!canViewQuestions) {
    return null;
  }

  const replaceQuestion = (updated: Question) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q)),
    );

  const handleStatusUpdate = async (questionId: number, newStatus: string) => {
    if (!user?.jwt) return;

    try {
      setPendingQuestionId(questionId);
      const updated: Question = await updateQuestionStatus(
        questionId,
        newStatus,
        user.jwt,
      );
      replaceQuestion(updated);
      setError(null);
      // La décision solde les notifications « à relire » de cette question.
      requestNotificationsRefresh();
    } catch (err) {
      setError(`Erreur lors de la mise à jour du statut`);
      console.error(err);
    } finally {
      setPendingQuestionId(null);
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
      const updated: Question = await updateQuestion(
        {
          id: editForm.id,
          libelle: editForm.libelle.trim(),
          // Le back remplace l'explication : on renvoie l'existante pour ne pas l'effacer.
          explication: editForm.explication.trim() || null,
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
      replaceQuestion(updated);
      cancelEditing();
    } catch (err) {
      setError("Erreur lors de la modification de la question");
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const visibleQuestions = sortedQuestions.slice(0, visibleCount);

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

        {focusedQuestionId ? (
          <div
            className="mb-4"
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <span style={{ color: "#9ca3af" }}>
              Question #{focusedQuestionId}
            </span>
            <Button
              variant="outline-theme"
              className="btn-sm"
              onClick={() => setSearchParams({})}
            >
              Afficher toutes les questions
            </Button>
          </div>
        ) : (
        <QuestionFilterBar
          statusFilter={filter}
          onStatusFilterChange={setFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          civilFilter={civilFilter}
          onCivilFilterChange={setCivilFilter}
          authorFilter={authorFilter}
          onAuthorFilterChange={setAuthorFilter}
          authors={authors}
          dateSort={dateSort}
          onDateSortChange={setDateSort}
          resultCount={sortedQuestions.length}
        />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {visibleQuestions.map((question) => (
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
              canEdit={canEditQuestion(question)}
              canReview={canReview}
              isPending={pendingQuestionId === question.id}
              editForm={editForm}
              isSavingEdit={savingEdit}
              onEditLibelleChange={setLibelle}
              onEditExplicationChange={setExplication}
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

          {sortedQuestions.length > visibleCount && (
            <div style={{ textAlign: "center" }}>
              <Button
                variant="outline-theme"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Afficher plus ({sortedQuestions.length - visibleCount}{" "}
                restantes)
              </Button>
            </div>
          )}

          {sortedQuestions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#9ca3af",
                fontSize: "16px",
              }}
            >
              {focusedQuestionId
                ? "Cette question n'existe plus."
                : "Aucune question trouvée pour ce filtre."}
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
