// ...existing code...
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BACKEND_URL from "../config";
import { requestRematch, submitAnswers } from "../services/api";
import { useUser } from "../components/Context/UserContext";
import { GameRoomSocket, isGameRecapEvent } from "../services/gameRoomSocket";
import type { GameEvent, GameRecapPayload } from "../types/multiplayer";

// Types
interface QuizQuestion {
  id: number;
  intitule: string;
  authorName?: string;
  options: string[];
  optionIds: number[];
  correctAnswers: string[];
  correctAnswerIds: number[];
  type: string; // MULTIPLE, TRUE_FALSE, etc.
  fileUrl?: string;
  explication?: string;
}

interface QuizResult {
  questionId: number;
  selected: string[];
  correct: string[];
  intitule: string;
  options: string[];
}

interface LivePlayerScore {
  userId: number;
  username: string;
  rank?: number;
  score?: number;
  points?: number;
}

type QuizLocationState = {
  questions?: any[];
  roomCode?: string;
  gameRecap?: GameRecapPayload | GameEvent<GameRecapPayload>;
};

const extractGameRecap = (
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

const extractQuestionsFromEvent = (event: GameEvent<unknown>) => {
  const payload = event.data as any;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (payload?.question) return [payload.question];
  return null;
};

const extractQuestionsFromUnknown = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (payload?.question) return [payload.question];
  if (Array.isArray(payload?.nextQuestions)) return payload.nextQuestions;
  if (payload?.nextQuestion) return [payload.nextQuestion];
  if (Array.isArray(payload?.data?.questions)) return payload.data.questions;
  if (payload?.data?.question) return [payload.data.question];
  return null;
};

const extractGameRecapFromUnknown = (payload: any) => {
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

const extractLivePlayerResults = (event: GameEvent<unknown>) => {
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

function normalizeQuestions(rawQuestions: any[]): QuizQuestion[] {
  return (rawQuestions || []).map((q: any) => {
    // Get question text
    const intitule = q.libelle || "";
    const authorName = q.authorUsername || undefined;

    // Handle options and correct answers
    let options: string[] = [];
    let optionIds: number[] = [];
    let correctAnswers: string[] = [];
    let correctAnswerIds: number[] = [];

    if (Array.isArray(q.answers)) {
      options = q.answers.map((a: any) => a.value || "");
      optionIds = q.answers.map((a: any) => a.id || 0);
      correctAnswers = q.answers
        .filter((a: any) => a.correct === true)
        .map((a: any) => a.value || "");
      correctAnswerIds = q.answers
        .filter((a: any) => a.correct === true)
        .map((a: any) => a.id || 0);
    }

    // Fallback: TRUE_FALSE type
    if ((!options || options.length === 0) && q.type === "TRUE_FALSE") {
      options = ["Vrai", "Faux"];
      optionIds = [1, 2]; // Default IDs for TRUE_FALSE
    }

    const fileUrl = q.fileUrl || null;
    const explication = q.explication || undefined;
    return {
      id: q.id,
      intitule,
      authorName,
      options: options || [],
      optionIds: optionIds || [],
      correctAnswers: correctAnswers || [],
      correctAnswerIds: correctAnswerIds || [],
      type: q.type || "MULTIPLE",
      fileUrl: fileUrl || undefined,
      explication,
    };
  });
}

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: QuizLocationState };
  const { user } = useUser();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionIndex, setCorrectionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [questionPoints, setQuestionPoints] = useState<number[]>([]);
  const [answerTimers, setAnswerTimers] = useState<number[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [multiplayerRecap, setMultiplayerRecap] =
    useState<GameRecapPayload | null>(null);
  const [isWaitingNextQuestion, setIsWaitingNextQuestion] = useState(false);
  const [waitingElapsedSeconds, setWaitingElapsedSeconds] = useState(0);
  const [liveScores, setLiveScores] = useState<LivePlayerScore[]>([]);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [rematchFeedback, setRematchFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openRecapQuestionIndex, setOpenRecapQuestionIndex] = useState<
    number | null
  >(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const multiplayerSocketRef = useRef<GameRoomSocket | null>(null);
  const multiplayerRoomCleanupRef = useRef<(() => void) | null>(null);
  const waitingSinceRef = useRef<number | null>(null);
  const isWaitingNextQuestionRef = useRef(false);
  const roomCode = location.state?.roomCode;
  const isMultiplayerQuestionFlow = Boolean(roomCode) && !multiplayerRecap;

  const resolveParticipantId = () => {
    if (user?.id !== undefined && user?.id !== null) {
      return `user_${user.id}`;
    }

    const storageKey = "multiplayer_participant_id";
    const fromStorage = window.sessionStorage.getItem(storageKey);
    if (fromStorage) {
      return fromStorage;
    }

    const generated = `anon_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(storageKey, generated);
    return generated;
  };

  useEffect(() => {
    isWaitingNextQuestionRef.current = isWaitingNextQuestion;
  }, [isWaitingNextQuestion]);

  const applyIncomingQuestion = (rawQuestions: any[]) => {
    if (!rawQuestions || rawQuestions.length === 0) {
      return;
    }

    const normalized = normalizeQuestions(rawQuestions);
    setQuestions(normalized);
    setCurrent(0);
    setAnswers(Array(normalized.length).fill([]));
    setAnswerTimers(Array(normalized.length).fill(0));
    setIsWaitingNextQuestion(false);
    waitingSinceRef.current = null;
    setWaitingElapsedSeconds(0);
    setTimer(15);
  };

  // Avance automatique à la fin du timer
  useEffect(() => {
    if (timer === 0 && !showCorrection && !isWaitingNextQuestion) {
      // Pour éviter les appels multiples
      setTimeout(() => {
        if (timer === 0 && !showCorrection && !isWaitingNextQuestion) {
          handleNext();
        }
      }, 100);
    }
    // eslint-disable-next-line
  }, [timer, showCorrection, isWaitingNextQuestion]);
  // Timer effect
  useEffect(() => {
    setTimer(15);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, questions]);

  // Helper to extract file name from fileUrl
  const getFileName = (fileUrl?: string) => {
    if (!fileUrl) return "";
    return fileUrl.split(/[/\\]/).pop() || "";
  };

  // On mount, fetch questions (or get from location.state)
  useEffect(() => {
    const recap = extractGameRecap(location.state);
    if (recap?.session?.gameMode === "MULTIPLAYER") {
      setMultiplayerRecap(recap);
      setShowCorrection(true);
      return;
    }

    if (location.state && location.state.questions) {
      const normalized = normalizeQuestions(location.state.questions);
      setQuestions(normalized);
      setAnswers(Array(normalized.length).fill([]));
      setAnswerTimers(Array(normalized.length).fill(0));
    } else {
      // fallback: fetch from API (should not happen in normal flow)
      axios.get(`${BACKEND_URL}/questions/quizz`).then((res) => {
        const normalized = normalizeQuestions(res.data);
        setQuestions(normalized);
        setAnswers(Array(normalized.length).fill([]));
        setAnswerTimers(Array(normalized.length).fill(0));
      });
    }
  }, [location.state]);

  useEffect(() => {
    if (!roomCode || multiplayerRecap) {
      return;
    }

    const socket = new GameRoomSocket(user?.jwt);
    multiplayerSocketRef.current = socket;

    socket
      .connect()
      .then(() => {
        multiplayerRoomCleanupRef.current = socket.subscribeRoomEvents(
          roomCode,
          (event) => {
            if (isGameRecapEvent(event)) {
              setMultiplayerRecap(event.data);
              setShowCorrection(true);
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
                      typeof player.rank === "number" ? player.rank : undefined,
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
            setShowCorrection(true);
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

        const roomCleanup = multiplayerRoomCleanupRef.current;
        multiplayerRoomCleanupRef.current = () => {
          roomCleanup?.();
          unsubscribePublicAnswerResult();
          unsubscribePrivateAnswerResult();
        };
      })
      .catch((error) => {
        console.error("Unable to subscribe to multiplayer room events", error);
      });

    return () => {
      if (multiplayerRoomCleanupRef.current) {
        multiplayerRoomCleanupRef.current();
        multiplayerRoomCleanupRef.current = null;
      }
      multiplayerSocketRef.current?.disconnect();
      multiplayerSocketRef.current = null;
    };
  }, [roomCode, user?.jwt, multiplayerRecap]);

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

  // Fetch audio as blob for seeking
  useEffect(() => {
    if (questions.length > 0 && current < questions.length) {
      const q = questions[current];
      if (q.fileUrl) {
        const filename = getFileName(q.fileUrl);
        const type = (q.type || "").toUpperCase();
        if (type === "SOUND") {
          const audioUrl = `${BACKEND_URL}/media/audio/${encodeURIComponent(filename)}`;
          fetch(audioUrl)
            .then((response) => response.blob())
            .then((blob) => {
              // Revoke previous URL to free memory
              if (audioBlobUrl) {
                URL.revokeObjectURL(audioBlobUrl);
              }
              const blobUrl = URL.createObjectURL(blob);
              setAudioBlobUrl(blobUrl);
            })
            .catch((error) => {
              console.error("Error fetching audio:", error);
              setAudioBlobUrl(audioUrl); // Fallback to direct URL
            });
        } else {
          // Not sound, clear blob URL
          if (audioBlobUrl) {
            URL.revokeObjectURL(audioBlobUrl);
            setAudioBlobUrl(null);
          }
        }
      }
    }
  }, [questions, current]);

  // Handle answer selection
  const handleSelect = (optionText: string) => {
    if (isWaitingNextQuestion) {
      return;
    }

    setAnswers((prev) => {
      const updated = [...prev];
      const q = questions[current];
      // Find the ID of the selected option
      const optionIndex = q.options.indexOf(optionText);
      const optionId = optionIndex >= 0 ? q.optionIds[optionIndex] : 0;

      // Allow multi-select for MULTIPLE, SOUND, and IMAGE types
      if (q.type === "MULTIPLE" || q.type === "SOUND" || q.type === "IMAGE") {
        updated[current] = updated[current].includes(optionId)
          ? updated[current].filter((id) => id !== optionId)
          : [...updated[current], optionId];
      } else {
        updated[current] = [optionId];
      }
      return updated;
    });
  };

  // Next question or show correction
  const handleNext = async () => {
    if (isSubmitting || isWaitingNextQuestion) {
      return;
    }

    // Save the current timer value for this question before moving
    const updatedTimers = [...answerTimers];
    updatedTimers[current] = Math.max(1, 15 - timer); // Temps écoulé (1 à 15 secondes)
    setAnswerTimers(updatedTimers);

    if (isMultiplayerQuestionFlow) {
      const q = questions[current];
      const selectedAnswerIds = answers[current] || [];
      const participantId = resolveParticipantId();

      setIsSubmitting(true);
      try {
        if (!roomCode || !multiplayerSocketRef.current) {
          throw new Error("Multiplayer socket unavailable");
        }

        multiplayerSocketRef.current.sendAnswer(roomCode, {
          answerIds: selectedAnswerIds,
          participantId,
          questionId: q.id,
        });

        setIsWaitingNextQuestion(true);
        waitingSinceRef.current = Date.now();
        setWaitingElapsedSeconds(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setTimer(0);
      } catch (error) {
        console.error("Error submitting answers:", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      // Preparation de la phase de correction et envoi des réponses
      // Prepare results with text for display
      const res: QuizResult[] = questions.map((q, i) => {
        const selectedTexts = answers[i].map((id) => {
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

      // Prepare data to send to backend (with IDs)
      const submitData = questions.map((q, i) => ({
        questionId: q.id,
        answerIds: answers[i],
        responseTimeSeconds: updatedTimers[i] || 1,
      }));

      setResults(res);
      setIsSubmitting(true);

      try {
        // Submit answers to backend
        const jwt = user?.jwt;
        await submitAnswers(submitData, jwt);
        console.log("Answers submitted successfully");
      } catch (error) {
        console.error("Error submitting answers:", error);
        // Continue to show correction even if submission fails
      } finally {
        setIsSubmitting(false);
      }

      setShowCorrection(true);

      // Score et points - ONLY if ALL correct answers are selected
      let sc = 0;
      let pts = 0;
      questions.forEach((q, i) => {
        const selectedIds = answers[i];
        const correctIds = q.correctAnswerIds;
        const isGood =
          selectedIds.length === correctIds.length &&
          selectedIds.every((id) => correctIds.includes(id));
        if (isGood) {
          sc++;
          // Points inversement proportionnels au temps écoulé (plus rapide = plus de points)
          pts += Math.max(1, 16 - (updatedTimers[i] || 1));
        }
      });
      setScore(sc);
      setPoints(pts);
    }
  };

  const handleRequestRematch = async () => {
    if (!roomCode) {
      setRematchFeedback(
        "Room code unavailable. Return to the multiplayer room and reconnect.",
      );
      return;
    }

    setIsRequestingRematch(true);
    setRematchFeedback(null);
    try {
      await requestRematch(roomCode, user?.jwt);
      setRematchFeedback("Rematch request sent.");
    } catch (error) {
      console.error("Rematch request failed", error);
      setRematchFeedback("Rematch request failed. Please try again.");
    } finally {
      setIsRequestingRematch(false);
    }
  };

  // Correction view
  if (showCorrection) {
    if (multiplayerRecap) {
      const sortedPlayers = [...(multiplayerRecap.results?.playerResults || [])]
        .sort((a, b) => a.rank - b.rank)
        .map((player) => ({
          ...player,
          isCurrentUser:
            player.userId === user?.id || player.username === user?.username,
        }));
      const playersByUsername = new Map(
        sortedPlayers.map((player) => [player.username, player]),
      );
      const playersByUserId = new Map(
        sortedPlayers.map((player) => [String(player.userId), player]),
      );

      const getPlayerLabel = (playerKey: string) => {
        const byUsername = playersByUsername.get(playerKey);
        if (byUsername) {
          return byUsername.userId < 0
            ? `${byUsername.username} (anonyme)`
            : byUsername.username;
        }

        const byUserId = playersByUserId.get(playerKey);
        if (byUserId) {
          return byUserId.userId < 0
            ? `${byUserId.username} (anonyme)`
            : byUserId.username;
        }

        return playerKey;
      };

      const myPlayer = sortedPlayers.find((player) => player.isCurrentUser);

      return (
        <div className="container" style={{ maxWidth: 900, marginTop: 40 }}>
          <div className="card p-4">
            <h2 className="mb-2 text-center">Recap multijoueur</h2>
            <div className="text-center mb-4" style={{ color: "#9ca3af" }}>
              Session {multiplayerRecap.session.gameSessionId} |{" "}
              {multiplayerRecap.session.questionCount} questions |{" "}
              {multiplayerRecap.session.totalDuration}s
            </div>

            {myPlayer && (
              <div
                className="mb-4 p-3"
                style={{
                  border: "1px solid #374151",
                  borderRadius: 8,
                  backgroundColor: "#111827",
                }}
              >
                <strong>Votre resultat:</strong> rang #{myPlayer.rank} | score{" "}
                {myPlayer.score}/{myPlayer.totalQuestions} | {myPlayer.points}{" "}
                points
              </div>
            )}

            <h4 className="mb-3">Classement final</h4>
            <div className="table-responsive mb-4">
              <table className="table table-dark table-striped align-middle">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Joueur</th>
                    <th>Score</th>
                    <th>Points</th>
                    <th>Precision</th>
                    <th>Temps total</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player) => (
                    <tr
                      key={`${player.username}-${player.userId}`}
                      style={{
                        backgroundColor: player.isCurrentUser
                          ? "#1f2937"
                          : undefined,
                      }}
                    >
                      <td>{player.rank}</td>
                      <td>
                        {player.username}
                        {player.userId < 0 ? " (anonyme)" : ""}
                      </td>
                      <td>
                        {player.correctAnswers}/{player.totalQuestions}
                      </td>
                      <td>{player.points}</td>
                      <td>{player.accuracy.toFixed(1)}%</td>
                      <td>{player.totalTimeSeconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="mb-3">Details par question</h4>
            <div className="accordion" id="recapQuestions">
              {(multiplayerRecap.questions || []).map((question, idx) => (
                <div className="accordion-item" key={question.questionId}>
                  <h2 className="accordion-header" id={`heading-${idx}`}>
                    <button
                      className={`accordion-button${
                        openRecapQuestionIndex === idx ? "" : " collapsed"
                      }`}
                      type="button"
                      onClick={() =>
                        setOpenRecapQuestionIndex((prev) =>
                          prev === idx ? null : idx,
                        )
                      }
                      aria-expanded={openRecapQuestionIndex === idx}
                      aria-controls={`collapse-${idx}`}
                    >
                      Q{idx + 1}. {question.questionText}
                    </button>
                  </h2>
                  <div
                    id={`collapse-${idx}`}
                    className={`accordion-collapse collapse${
                      openRecapQuestionIndex === idx ? " show" : ""
                    }`}
                    aria-labelledby={`heading-${idx}`}
                    data-bs-parent="#recapQuestions"
                    style={{
                      display:
                        openRecapQuestionIndex === idx ? "block" : "none",
                    }}
                  >
                    <div className="accordion-body">
                      <div className="table-responsive">
                        <table className="table table-sm table-striped">
                          <thead>
                            <tr>
                              <th>Joueur</th>
                              <th>Choix</th>
                              <th>Bonnes reponses</th>
                              <th>Resultat</th>
                              <th>Temps</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(question.playerResponses || {}).map(
                              ([playerKey, response]) => (
                                <tr key={playerKey}>
                                  <td>{getPlayerLabel(playerKey)}</td>
                                  <td>
                                    {(response.selected || []).join(", ") ||
                                      "-"}
                                  </td>
                                  <td>
                                    {(response.correct || []).join(", ") || "-"}
                                  </td>
                                  <td
                                    style={{
                                      color: response.isCorrect
                                        ? "#22c55e"
                                        : "#ef4444",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {response.isCorrect
                                      ? "Correct"
                                      : "Incorrect"}
                                  </td>
                                  <td>{response.timeSeconds}s</td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {multiplayerRecap.allowRematch && (
              <div
                className="mt-4 p-3"
                style={{ backgroundColor: "#1f2937", borderRadius: 8 }}
              >
                <div className="mb-2">
                  Rematch available ({multiplayerRecap.rematchExpireIn || 0}s)
                </div>
                <button
                  className="btn btn-outline-gold"
                  onClick={handleRequestRematch}
                  disabled={isRequestingRematch}
                >
                  {isRequestingRematch ? "Sending..." : "Request rematch"}
                </button>
                {rematchFeedback && (
                  <div className="mt-2" style={{ color: "#d1d5db" }}>
                    {rematchFeedback}
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-bg-theme w-100 mt-4"
              onClick={() => navigate("/")}
            >
              Retour accueil
            </button>
          </div>
        </div>
      );
    }

    // If we've gone through all questions, show final summary
    if (correctionIndex >= results.length) {
      return (
        <div className="container" style={{ maxWidth: 700, marginTop: 40 }}>
          <div className="card p-4">
            <h2 className="mb-4 text-center">Récapitulatif final</h2>
            <table className="table table-dark table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  const questionIsCorrect =
                    r.selected.length === r.correct.length &&
                    r.selected.every((ans) => r.correct.includes(ans));
                  const savedTime = answerTimers[idx] || 0;
                  const pts = questionIsCorrect
                    ? Math.max(1, 16 - savedTime)
                    : 0;
                  return (
                    <tr key={r.questionId}>
                      <td>{idx + 1}</td>
                      <td>{r.intitule}</td>
                      <td style={{ color: pts > 0 ? "#4ade80" : "#f87171" }}>
                        {pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div
              className="text-center mt-4 p-3"
              style={{ backgroundColor: "#1a1a1a", borderRadius: 8 }}
            >
              <h3>
                Score : {score} / {results.length}
              </h3>
              <h4 style={{ marginTop: 10, color: "#4ade80", fontSize: 24 }}>
                Points totaux : {points}
              </h4>
            </div>
            <button
              className="btn btn-bg-theme w-100 mt-4"
              onClick={() => navigate("/")}
            >
              Retour accueil
            </button>
          </div>
        </div>
      );
    }

    // Show one question at a time during review
    const r = results[correctionIndex];
    const questionIsCorrect =
      r.selected.length === r.correct.length &&
      r.selected.every((ans) => r.correct.includes(ans));
    const savedTime = answerTimers[correctionIndex] || 0;
    const pts = questionIsCorrect ? Math.max(1, 16 - savedTime) : 0;
    const currentQuestion = questions[correctionIndex];

    return (
      <div className="container" style={{ maxWidth: 700, marginTop: 40 }}>
        <div className="card p-4">
          <div className="mb-3 text-center" style={{ color: "#9ca3af" }}>
            Question {correctionIndex + 1} / {results.length}
          </div>
          <h3 className="mb-4 text-center">{r.intitule}</h3>

          {/* Afficher le media si applicable */}
          {currentQuestion?.fileUrl &&
            (() => {
              const filename = getFileName(currentQuestion.fileUrl);
              const type = (currentQuestion.type || "").toUpperCase();
              if (type === "IMAGE") {
                const imageUrl = `${BACKEND_URL}/media/image/${encodeURIComponent(filename)}`;
                return (
                  <div className="mb-4 text-center">
                    <img
                      src={imageUrl}
                      alt="Question"
                      style={{
                        maxWidth: "320px",
                        width: "100%",
                        height: "auto",
                        borderRadius: "8px",
                        border: "1px solid #374151",
                      }}
                    />
                  </div>
                );
              } else if (type === "SOUND") {
                const audioUrl = `${BACKEND_URL}/media/audio/${encodeURIComponent(filename)}`;
                return (
                  <div className="mb-4 text-center">
                    <audio controls style={{ width: "100%" }}>
                      <source src={audioUrl} type="audio/mpeg" />
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                  </div>
                );
              }
              return null;
            })()}

          {/* Afficher les réponses */}
          <div className="mb-4">
            <h5 className="mb-3" style={{ color: "#d1d5db" }}>
              Réponses :
            </h5>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {r.options.map((opt) => {
                const isCorrect = r.correct.includes(opt);
                const isSelected = r.selected.includes(opt);
                const isMissed = isCorrect && !isSelected;
                const isWrong = isSelected && !isCorrect;
                let bgColor = "#23272f";
                let borderColor = "#333";
                let textColor = "#e0e0e0";
                if (isCorrect && isSelected) {
                  bgColor = "#2d3a2e";
                  borderColor = "#4ade80";
                  textColor = "#d1fae5";
                } else if (isCorrect && !isSelected) {
                  bgColor = "#353535";
                  borderColor = "#a3a3a3";
                  textColor = "#bdbdbd";
                } else if (isWrong) {
                  bgColor = "#3a2323";
                  borderColor = "#f87171";
                  textColor = "#fca5a5";
                }
                return (
                  <li
                    key={opt}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      marginBottom: 6,
                      background: bgColor,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      fontWeight: isMissed ? 700 : undefined,
                    }}
                  >
                    {opt}
                    {isCorrect && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: isMissed ? "#f87171" : "#4ade80",
                          fontWeight: 700,
                        }}
                      >
                        ✓ Bonne réponse
                      </span>
                    )}
                    {isSelected && (
                      <span style={{ marginLeft: 8, fontWeight: 700 }}>
                        (Votre choix)
                      </span>
                    )}
                    {isMissed && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "#f87171",
                          fontWeight: 700,
                          opacity: 0.8,
                        }}
                      >
                        (Non sélectionné)
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Afficher l'explication si elle existe */}
          {currentQuestion?.explication && (
            <div
              className="alert alert-info mb-4"
              style={{ borderColor: "#3b82f6", backgroundColor: "#1e3a5f" }}
            >
              <strong style={{ color: "#60a5fa" }}>Explication :</strong>
              <p style={{ marginTop: 8, marginBottom: 0, color: "#bfdbfe" }}>
                {currentQuestion.explication}
              </p>
            </div>
          )}

          {/* Afficher les points et temps */}
          <div
            style={{
              fontSize: 15,
              marginBottom: 16,
              color: "#a3a3a3",
              padding: "12px",
              backgroundColor: "#1a1a1a",
              borderRadius: 6,
            }}
          >
            Points obtenus :{" "}
            <span style={{ color: "#4ade80", fontWeight: 600 }}>{pts}</span>{" "}
            &nbsp;|&nbsp; Temps de réponse :{" "}
            <span style={{ color: "#60a5fa", fontWeight: 600 }}>
              {savedTime}s
            </span>
          </div>

          {/* Boutons de navigation */}
          <div className="d-flex justify-content-between">
            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setCorrectionIndex(Math.max(0, correctionIndex - 1))
              }
              disabled={correctionIndex === 0}
            >
              ← Précédent
            </button>
            <button
              className="btn btn-bg-theme"
              onClick={() => setCorrectionIndex(correctionIndex + 1)}
            >
              {correctionIndex === results.length - 1
                ? "Voir le récapitulatif"
                : "Suivant →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz view
  if (!questions.length) {
    return <div className="container text-center mt-5">Chargement...</div>;
  }

  const q = questions[current];
  const selected = answers[current] || [];

  // Render media if needed
  let media = null;
  if (q.fileUrl) {
    const filename = getFileName(q.fileUrl);
    const type = (q.type || "").toUpperCase();
    if (type === "IMAGE") {
      const imageUrl = `${BACKEND_URL}/media/image/${encodeURIComponent(filename)}`;
      media = (
        <div className="mb-4 text-center">
          <img
            src={imageUrl}
            alt="Question"
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
        </div>
      );
    } else if (type === "SOUND") {
      const audioUrl = `${BACKEND_URL}/media/audio/${encodeURIComponent(filename)}`;
      media = (
        <div className="mb-4 text-center">
          <audio
            ref={audioRef}
            controls
            autoPlay
            style={{ width: "100%", marginTop: 8 }}
          >
            <source src={audioBlobUrl || audioUrl} type="audio/mpeg" />
            Votre navigateur ne supporte pas l'élément audio.
          </audio>
        </div>
      );
    }
  }

  return (
    <div className="container" style={{ maxWidth: 700, marginTop: 40 }}>
      <div className="card p-4">
        <div className="mb-3 fw-bold fs-5 text-center">
          Question {current + 1} / {questions.length}
        </div>
        <div
          className="mb-3 text-center"
          style={{
            fontSize: 20,
            color: timer <= 5 ? "#dc2626" : "#2563eb",
            fontWeight: 700,
          }}
        >
          Temps restant : {timer}s
        </div>
        <div className="mb-4 fs-4 text-center">{q.intitule}</div>
        <div className="mb-3 text-center" style={{ color: "#9ca3af" }}>
          Auteur : {q.authorName || "Inconnu"}
        </div>
        {media}
        {isMultiplayerQuestionFlow && liveScores.length > 0 && (
          <div
            className="mb-3 p-3"
            style={{ backgroundColor: "#111827", borderRadius: 8 }}
          >
            <div className="mb-2" style={{ color: "#d1d5db", fontWeight: 600 }}>
              Classement live
            </div>
            <div style={{ color: "#9ca3af", fontSize: 14 }}>
              {liveScores
                .slice(0, 5)
                .map((player) => {
                  const rank =
                    typeof player.rank === "number" ? `#${player.rank}` : "#-";
                  const scoreText =
                    typeof player.score === "number"
                      ? `score ${player.score}`
                      : "score -";
                  const pointsText =
                    typeof player.points === "number"
                      ? `${player.points} pts`
                      : "- pts";
                  return `${rank} ${player.username}: ${scoreText}, ${pointsText}`;
                })
                .join(" | ")}
            </div>
          </div>
        )}
        <div className="mb-4">
          {isWaitingNextQuestion && (
            <div
              className="alert alert-info"
              style={{ backgroundColor: "#1e3a5f", borderColor: "#3b82f6" }}
            >
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
                style={{ marginRight: 8 }}
              />
              Reponse envoyee. En attente de la prochaine question... (
              {waitingElapsedSeconds}s)
            </div>
          )}
          {q.options.map((opt, idx) => {
            const optionId = q.optionIds[idx];
            return (
              <button
                key={opt}
                className={`btn w-100 mb-2 ${selected.includes(optionId) ? "btn-bg-theme" : "btn-outline-gold"}`}
                style={{ fontWeight: 600, fontSize: 18 }}
                onClick={() => handleSelect(opt)}
                disabled={isWaitingNextQuestion || isSubmitting}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div className="text-end">
          <button
            className="btn btn-bg-theme"
            onClick={handleNext}
            disabled={isSubmitting || isWaitingNextQuestion}
          >
            {isMultiplayerQuestionFlow
              ? isSubmitting
                ? "Validation..."
                : isWaitingNextQuestion
                  ? "En attente de la prochaine question..."
                  : "Valider"
              : current === questions.length - 1
                ? "Voir la correction"
                : "Question suivante"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
