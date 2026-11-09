import { useState } from "react";
import type { Question } from "../../../types/question";
import { buildEditForm, type EditQuestionForm } from "../utils/editForm";

/**
 * Owns the "currently edited question" form state for the review screen.
 * Only one question can be edited at a time (matching the previous
 * behaviour), identified by `editForm.id`.
 */
export function useQuestionEditForm() {
  const [editForm, setEditForm] = useState<EditQuestionForm | null>(null);

  const startEditing = (question: Question) => {
    setEditForm(buildEditForm(question));
  };

  const cancelEditing = () => setEditForm(null);

  const setLibelle = (libelle: string) => {
    setEditForm((prev) => (prev ? { ...prev, libelle } : prev));
  };

  const setExplication = (explication: string) => {
    setEditForm((prev) => (prev ? { ...prev, explication } : prev));
  };

  const setTheme = (theme: string) => {
    setEditForm((prev) => (prev ? { ...prev, theme } : prev));
  };

  const setCivilisation = (civilisation: string) => {
    setEditForm((prev) => (prev ? { ...prev, civilisation } : prev));
  };

  const setBuilding = (building: string) => {
    setEditForm((prev) => (prev ? { ...prev, building } : prev));
  };

  const setAnswerValue = (index: number, value: string) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const nextAnswers = [...prev.answers];
      nextAnswers[index] = { ...nextAnswers[index], value };
      return { ...prev, answers: nextAnswers };
    });
  };

  const toggleAnswerCorrect = (index: number) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const nextAnswers = prev.answers.map((answer, idx) => {
        if (prev.type === "TRUE_FALSE") {
          return { ...answer, correct: idx === index };
        }
        if (idx === index) {
          return { ...answer, correct: !answer.correct };
        }
        return answer;
      });
      return { ...prev, answers: nextAnswers };
    });
  };

  const addAnswer = () => {
    setEditForm((prev) => {
      if (!prev || prev.type === "TRUE_FALSE") return prev;
      return {
        ...prev,
        answers: [...prev.answers, { value: "", correct: false }],
      };
    });
  };

  const removeAnswer = (index: number) => {
    setEditForm((prev) => {
      if (!prev || prev.type === "TRUE_FALSE") return prev;
      return {
        ...prev,
        answers: prev.answers.filter((_, idx) => idx !== index),
      };
    });
  };

  return {
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
  };
}
