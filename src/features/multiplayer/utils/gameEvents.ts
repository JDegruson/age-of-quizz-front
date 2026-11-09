import type { GameEvent, GameRecapPayload } from "../../../types/multiplayer";

/**
 * Parsing helpers for the loosely-typed payloads that travel over the
 * multiplayer game room WebSocket.
 *
 * These were previously duplicated (identically, for
 * `extractQuestionsFromEvent`) or reimplemented (for the recap helpers)
 * across QuizPage.tsx and MultiplayerRoomPage.tsx. Both pages should import
 * from here instead of keeping their own copies.
 */

export type QuestionProgress = {
  questionIndex: number;
  totalQuestions: number;
  /** Time allowed for this question, set by the host in the room settings. */
  durationSeconds?: number;
};

export type QuizLocationState = {
  questions?: any[];
  roomCode?: string;
  questionProgress?: QuestionProgress | null;
  gameRecap?: GameRecapPayload | GameEvent<GameRecapPayload>;
  /** Solo only: no countdown, questions never expire. */
  unlimitedTime?: boolean;
};

export const extractGameRecap = (
  locationState?: QuizLocationState,
): GameRecapPayload | null => {
  if (!locationState?.gameRecap) {
    return null;
  }

  const rawRecap = locationState.gameRecap as
    | GameRecapPayload
    | GameEvent<GameRecapPayload>;

  if ("data" in rawRecap && rawRecap.data && "session" in rawRecap.data) {
    return rawRecap.data;
  }

  if ("session" in rawRecap) {
    return rawRecap;
  }

  return null;
};

export const extractQuestionsFromEvent = (event: GameEvent<unknown>) => {
  const payload = event.data as any;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (payload?.question) return [payload.question];
  return null;
};

/**
 * Reads the position of the current question within the multiplayer game
 * (0-based index + total) and its duration, sent alongside each NEW_QUESTION
 * payload.
 */
export const extractQuestionProgress = (
  payload: any,
): QuestionProgress | null => {
  const source = payload?.data ?? payload;
  if (
    typeof source?.questionIndex === "number" &&
    typeof source?.totalQuestions === "number"
  ) {
    const hasTimes =
      typeof source.questionStartTime === "number" &&
      typeof source.questionEndTime === "number";
    return {
      questionIndex: source.questionIndex,
      totalQuestions: source.totalQuestions,
      durationSeconds: hasTimes
        ? Math.round((source.questionEndTime - source.questionStartTime) / 1000)
        : undefined,
    };
  }
  return null;
};

export const extractQuestionsFromUnknown = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (payload?.question) return [payload.question];
  if (Array.isArray(payload?.nextQuestions)) return payload.nextQuestions;
  if (payload?.nextQuestion) return [payload.nextQuestion];
  if (Array.isArray(payload?.data?.questions)) return payload.data.questions;
  if (payload?.data?.question) return [payload.data.question];
  return null;
};

export const extractGameRecapFromUnknown = (payload: any) => {
  if (!payload) {
    return null;
  }

  if (payload?.session?.gameMode === "MULTIPLAYER") {
    return payload as GameRecapPayload;
  }

  if (payload?.data?.session?.gameMode === "MULTIPLAYER") {
    return payload.data as GameRecapPayload;
  }

  if (payload?.recap?.session?.gameMode === "MULTIPLAYER") {
    return payload.recap as GameRecapPayload;
  }

  return null;
};

export const extractLivePlayerResults = (event: GameEvent<unknown>) => {
  const payload = event.data as any;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.playerResults)) {
    return payload.playerResults;
  }
  if (Array.isArray(payload?.results?.playerResults)) {
    return payload.results.playerResults;
  }
  return null;
};
