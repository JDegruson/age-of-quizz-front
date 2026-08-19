import { useEffect, useRef, useState } from "react";
import {
  GameRoomSocket,
  isGameRecapEvent,
} from "../../../services/gameRoomSocket";
import type { GameRecapPayload } from "../../../types/multiplayer";
import {
  extractGameRecapFromUnknown,
  extractLivePlayerResults,
  extractQuestionsFromEvent,
  extractQuestionsFromUnknown,
} from "../../multiplayer/utils/gameEvents";

export interface LivePlayerScore {
  userId: number;
  username: string;
  rank?: number;
  score?: number;
  points?: number;
}

/**
 * Handles the multiplayer game-room WebSocket for the quiz screen: listens
 * for new questions, live score updates and the end-of-game recap, and
 * exposes `sendAnswer` to submit the player's answer for the current
 * question.
 *
 * `onNewQuestions` is called whenever a fresh question (or batch of
 * questions) arrives from the server — the caller is responsible for
 * normalizing the raw payload and updating the quiz state (current index,
 * answers, timers...).
 */
export function useMultiplayerQuizSocket({
  roomCode,
  jwt,
  initialRecap,
  onNewQuestions,
}: {
  roomCode?: string;
  jwt?: string;
  initialRecap: GameRecapPayload | null;
  onNewQuestions: (rawQuestions: any[]) => void;
}) {
  const [multiplayerRecap, setMultiplayerRecap] =
    useState<GameRecapPayload | null>(initialRecap);
  const [isWaitingNextQuestion, setIsWaitingNextQuestion] = useState(false);
  const [waitingElapsedSeconds, setWaitingElapsedSeconds] = useState(0);
  const [liveScores, setLiveScores] = useState<LivePlayerScore[]>([]);

  const socketRef = useRef<GameRoomSocket | null>(null);
  const roomCleanupRef = useRef<(() => void) | null>(null);
  const waitingSinceRef = useRef<number | null>(null);
  const isWaitingNextQuestionRef = useRef(false);

  useEffect(() => {
    isWaitingNextQuestionRef.current = isWaitingNextQuestion;
  }, [isWaitingNextQuestion]);

  const applyIncomingQuestion = (rawQuestions: any[]) => {
    if (!rawQuestions || rawQuestions.length === 0) {
      return;
    }

    onNewQuestions(rawQuestions);
    setIsWaitingNextQuestion(false);
    waitingSinceRef.current = null;
    setWaitingElapsedSeconds(0);
  };

  useEffect(() => {
    if (!roomCode || multiplayerRecap) {
      return;
    }

    const socket = new GameRoomSocket(jwt);
    socketRef.current = socket;

    socket
      .connect()
      .then(() => {
        roomCleanupRef.current = socket.subscribeRoomEvents(
          roomCode,
          (event) => {
            if (isGameRecapEvent(event)) {
              setMultiplayerRecap(event.data);
              setIsWaitingNextQuestion(false);
              waitingSinceRef.current = null;
              setWaitingElapsedSeconds(0);
              return;
            }

            const rawQuestions = extractQuestionsFromEvent(event);
            if (
              rawQuestions &&
              rawQuestions.length > 0 &&
              (event.type === "NEW_QUESTION" ||
                isWaitingNextQuestionRef.current)
            ) {
              applyIncomingQuestion(rawQuestions);
              return;
            }

            if (event.type === "SCORES_UPDATED") {
              const playerResults = extractLivePlayerResults(event);
              if (playerResults) {
                const normalized = playerResults
                  .map((player: any) => ({
                    userId: Number(player.userId ?? -1),
                    username: String(
                      player.username || `anon_${player.userId ?? -1}`,
                    ),
                    rank:
                      typeof player.rank === "number"
                        ? player.rank
                        : undefined,
                    score:
                      typeof player.score === "number"
                        ? player.score
                        : undefined,
                    points:
                      typeof player.points === "number"
                        ? player.points
                        : undefined,
                  }))
                  .sort(
                    (
                      a: { rank: number; points: any },
                      b: { rank: number; points: any },
                    ) => {
                      if (
                        typeof a.rank === "number" &&
                        typeof b.rank === "number"
                      ) {
                        return a.rank - b.rank;
                      }
                      return (b.points || 0) - (a.points || 0);
                    },
                  );
                setLiveScores(normalized);
              }
              return;
            }
          },
        );

        const applyAnswerResult = (payload: any) => {
          const recap = extractGameRecapFromUnknown(payload);
          if (recap) {
            setMultiplayerRecap(recap);
            setIsWaitingNextQuestion(false);
            waitingSinceRef.current = null;
            setWaitingElapsedSeconds(0);
            return;
          }

          const maybeQuestions = extractQuestionsFromUnknown(payload);
          if (
            maybeQuestions &&
            maybeQuestions.length > 0 &&
            isWaitingNextQuestionRef.current
          ) {
            applyIncomingQuestion(maybeQuestions);
          }
        };

        const unsubscribePublicAnswerResult =
          socket.subscribeAnswerResultPublic(roomCode, (result) => {
            applyAnswerResult(result as any);
          });

        const unsubscribePrivateAnswerResult =
          socket.subscribeAnswerResultPrivate(roomCode, (result) => {
            applyAnswerResult(result as any);
          });

        const roomCleanup = roomCleanupRef.current;
        roomCleanupRef.current = () => {
          roomCleanup?.();
          unsubscribePublicAnswerResult();
          unsubscribePrivateAnswerResult();
        };
      })
      .catch((error) => {
        console.error("Unable to subscribe to multiplayer room events", error);
      });

    return () => {
      if (roomCleanupRef.current) {
        roomCleanupRef.current();
        roomCleanupRef.current = null;
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, jwt, multiplayerRecap]);

  useEffect(() => {
    if (!isWaitingNextQuestion) {
      setWaitingElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      if (!waitingSinceRef.current) {
        return;
      }
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - waitingSinceRef.current) / 1000),
      );
      setWaitingElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isWaitingNextQuestion]);

  const sendAnswer = (
    questionId: number,
    answerIds: number[],
    participantId: string,
  ) => {
    if (!roomCode || !socketRef.current) {
      throw new Error("Multiplayer socket unavailable");
    }

    socketRef.current.sendAnswer(roomCode, {
      answerIds,
      participantId,
      questionId,
    });

    setIsWaitingNextQuestion(true);
    waitingSinceRef.current = Date.now();
    setWaitingElapsedSeconds(0);
  };

  return {
    multiplayerRecap,
    isWaitingNextQuestion,
    waitingElapsedSeconds,
    liveScores,
    sendAnswer,
  };
}
