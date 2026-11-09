import type { GameRecapPayload } from "../../../types/multiplayer";
import type { QuizQuestion } from "./normalizeQuestions";
import { computePoints, isExactMatch, type QuizResult } from "./scoring";

/**
 * Builds a recap in the same shape as the multiplayer one (sent by the
 * server at the end of a game) from a finished solo quiz, so both modes can
 * share MultiplayerRecapView.
 */
export function buildSoloRecap(
  results: QuizResult[],
  answerTimers: number[],
  user:
    | {
        id?: number;
        username?: string;
        userProfile?: { pseudo?: string } | null;
      }
    | null
    | undefined,
  /** Same order as `results`: brings the explanation and media into the recap. */
  quizQuestions: QuizQuestion[] = [],
): GameRecapPayload {
  const userId = user?.id ?? -1;
  const username = user?.userProfile?.pseudo || user?.username || "Vous";

  const questions = results.map((r, idx) => ({
    questionId: r.questionId,
    questionText: r.intitule,
    explanation: quizQuestions[idx]?.explication ?? null,
    fileUrl: quizQuestions[idx]?.fileUrl ?? null,
    questionType: quizQuestions[idx]?.type ?? null,
    playerResponses: {
      [username]: {
        selected: r.selected,
        correct: r.correct,
        isCorrect: isExactMatch(r.selected, r.correct),
        timeSeconds: answerTimers[idx] || 0,
      },
    },
  }));

  const correctAnswers = questions.filter(
    (q) => q.playerResponses[username].isCorrect,
  ).length;
  const points = questions.reduce(
    (total, q) =>
      total +
      computePoints(
        q.playerResponses[username].isCorrect,
        q.playerResponses[username].timeSeconds,
      ),
    0,
  );
  const totalTimeSeconds = answerTimers.reduce((sum, t) => sum + (t || 0), 0);
  const totalQuestions = results.length;

  return {
    session: {
      gameSessionId: "",
      gameMode: "SINGLEPLAYER",
      status: "FINISHED",
      startTime: "",
      endTime: "",
      totalDuration: totalTimeSeconds,
      questionCount: totalQuestions,
    },
    results: {
      playerResults: [
        {
          userId,
          username,
          rank: 1,
          score: correctAnswers,
          points,
          correctAnswers,
          totalQuestions,
          accuracy: totalQuestions
            ? (correctAnswers / totalQuestions) * 100
            : 0,
          totalTimeSeconds,
          averageTimePerQuestion: totalQuestions
            ? totalTimeSeconds / totalQuestions
            : 0,
        },
      ],
    },
    questions,
  };
}
