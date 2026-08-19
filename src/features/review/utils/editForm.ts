import type { Question } from "../../../types/question";

export type EditAnswer = {
  id?: number;
  value: string;
  correct: boolean;
};

export type EditQuestionForm = {
  id: number;
  libelle: string;
  theme: string;
  civilisation: string;
  building: string;
  type: string;
  fileUrl?: string;
  answers: EditAnswer[];
};

/** Builds the editable form state for a question, normalizing TRUE_FALSE answers. */
export function buildEditForm(question: Question): EditQuestionForm {
  const rawAnswers: EditAnswer[] = question.answers?.length
    ? question.answers.map((answer) => ({
        id: answer.id,
        value: answer.value || "",
        correct: Boolean(answer.correct),
      }))
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
    libelle: question.libelle || "",
    theme: question.theme || "TECH_TREE",
    civilisation: question.civilisation || "NONE",
    building: question.building || "NONE",
    type: question.type || "MULTIPLE",
    fileUrl: question.fileUrl || undefined,
    answers: normalizedAnswers,
  };
}
