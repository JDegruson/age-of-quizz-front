import type { QuizQuestion } from "./normalizeQuestions";

export interface QuizResult {
  questionId: number;
  selected: string[];
  correct: string[];
  intitule: string;
  options: string[];
}

/** Builds the display-friendly results (text answers) used by the correction screens. */
export function buildQuizResults(
  questions: QuizQuestion[],
  answers: number[][],
): QuizResult[] {
  return questions.map((q, i) => {
    const selectedTexts = (answers[i] || []).map((id) => {
      const idx = q.optionIds.indexOf(id);
      return idx >= 0 ? q.options[idx] : "";
    });
    return {
      questionId: q.id,
      selected: selectedTexts,
      correct: q.correctAnswers,
      intitule: q.intitule,
      options: q.options,
    };
  });
}

/**
 * Final score/points for a finished solo quiz. A question only counts as
 * correct if the selected answers are exactly the set of correct answers.
 */
export function computeScoreAndPoints(
  questions: QuizQuestion[],
  answers: number[][],
  answerTimers: number[],
): { score: number; points: number } {
  let score = 0;
  let points = 0;
  questions.forEach((q, i) => {
    const isGood = isExactMatch(answers[i] || [], q.correctAnswerIds);
    if (isGood) {
      score++;
      points += computePoints(true, answerTimers[i] || 1);
    }
  });
  return { score, points };
}

/**
 * True when the selected set is exactly the correct set (same size, same
 * members). Shared by the ID-based scoring below and the text-based
 * QuizResult comparisons used in buildSoloRecap.
 */
export function isExactMatch<T>(selected: T[], correct: T[]): boolean {
  return (
    selected.length === correct.length &&
    selected.every((value) => correct.includes(value))
  );
}

/**
 * Points inversement proportionnels au temps écoulé (plus rapide = plus de
 * points), 0 si la réponse est fausse. `timeSeconds` est déjà résolu par
 * l'appelant (chaque site d'appel garde sa propre convention de valeur par
 * défaut quand le temps manque, pas unifiée ici).
 */
export function computePoints(isCorrect: boolean, timeSeconds: number): number {
  return isCorrect ? Math.max(1, 16 - timeSeconds) : 0;
}
