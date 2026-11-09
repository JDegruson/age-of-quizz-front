import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BACKEND_URL from "../../config";
import { submitAnswers } from "../../services/quizApi";
import { requestRematch } from "../../services/multiplayer";
import { resolveKnownParticipantId } from "../multiplayer/utils/participant";
import { useUser } from "../../context/UserContext";
import {
  extractGameRecap,
  type QuestionProgress,
  type QuizLocationState,
} from "../multiplayer/utils/gameEvents";
import { resolveOrGenerateParticipantId } from "../multiplayer/utils/participant";
import { useMultiplayerQuizSocket } from "./hooks/useMultiplayerQuizSocket";
import {
  DEFAULT_QUESTION_DURATION_SECONDS,
  useQuizTimer,
} from "./hooks/useQuizTimer";
import { useQuizAudio } from "./hooks/useQuizAudio";
import {
  normalizeQuestions,
  type QuizQuestion,
} from "./utils/normalizeQuestions";
import {
  buildQuizResults,
  type QuizResult,
} from "./utils/scoring";
import { buildSoloRecap } from "./utils/soloRecap";
import MultiplayerRecapView from "./components/MultiplayerRecapView";
import QuestionView from "./components/QuestionView";
import ImageZoomModal from "../../components/ImageZoomModal";
/**
 * Orchestrates the quiz screen: owns the quiz-progress state (current
 * question, answers, timers) and picks which view to render (live  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
 * question, solo correction/recap, or multiplayer recap). The heavier
 * pieces of logic live in features/quiz/hooks and features/quiz/components.
 */
const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: QuizLocationState };
  const { user } = useUser();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [answerTimers, setAnswerTimers] = useState<number[]>([]);
  // Multiplayer only: the server sends one question at a time, so this holds
  // its position within the whole game.
  const [questionProgress, setQuestionProgress] =
    useState<QuestionProgress | null>(null);

  const [soloQuizFinished, setSoloQuizFinished] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);

  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [rematchFeedback, setRematchFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openRecapQuestionIndex, setOpenRecapQuestionIndex] = useState<
    number | null
  >(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const roomCode = location.state?.roomCode;

  // Computed fresh each render from location.state; only its value at mount
  // time actually matters (see the mount effect and useMultiplayerQuizSocket
  // below, which both only consume it once).
  const initialGameRecap = extractGameRecap(location.state);
  const initialMultiplayerRecap =
    initialGameRecap?.session?.gameMode === "MULTIPLAYER"
      ? initialGameRecap
      : null;

  const applyNewQuestions = (
    rawQuestions: any[],
    progress: QuestionProgress | null = null,
  ) => {
    const normalized = normalizeQuestions(rawQuestions);
    setQuestions(normalized);
    setQuestionProgress(progress);
    setCurrent(0);
    setAnswers(Array(normalized.length).fill([]));
    setAnswerTimers(Array(normalized.length).fill(0));
  };

  const {
    multiplayerRecap,
    isWaitingNextQuestion,
    waitingElapsedSeconds,
    liveScores,
    sendAnswer,
  } = useMultiplayerQuizSocket({
    roomCode,
    jwt: user?.jwt,
    initialRecap: initialMultiplayerRecap,
    onNewQuestions: applyNewQuestions,
  });

  const isMultiplayerQuestionFlow = Boolean(roomCode) && !multiplayerRecap;
  // Solo only: "temps illimité" chosen on the start page.
  const isUnlimitedTime =
    !isMultiplayerQuestionFlow && Boolean(location.state?.unlimitedTime);
  const questionDuration =
    questionProgress?.durationSeconds || DEFAULT_QUESTION_DURATION_SECONDS;
  const showCorrection = Boolean(multiplayerRecap) || soloQuizFinished;

  const audioBlobUrl = useQuizAudio(questions, current);

  // On mount, fetch questions (or get them from location.state) — unless a
  // multiplayer recap was already provided, in which case there is nothing
  // to fetch.
  useEffect(() => {
    if (initialMultiplayerRecap) {
      return;
    }

    if (location.state && location.state.questions) {
      applyNewQuestions(
        location.state.questions,
        location.state.questionProgress ?? null,
      );
    } else {
      // fallback: fetch from API (should not happen in normal flow)
      axios.get(`${BACKEND_URL}/questions/quizz`).then((res) => {
        applyNewQuestions(res.data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Next question or show correction. Referenced by useQuizTimer below as
  // the countdown's onExpire callback, and by the "next" button.
  const handleNext = async () => {
    if (isSubmitting || isWaitingNextQuestion) {
      return;
    }

    // Save the current timer value for this question before moving
    const updatedTimers = [...answerTimers];
    // Temps écoulé (en temps illimité, le timer compte déjà vers le haut)
    updatedTimers[current] = Math.max(
      1,
      isUnlimitedTime ? timer : questionDuration - timer,
    );
    setAnswerTimers(updatedTimers);

    if (isMultiplayerQuestionFlow) {
      const q = questions[current];
      const selectedAnswerIds = answers[current] || [];
      const participantId = resolveOrGenerateParticipantId(user);

      setIsSubmitting(true);
      try {
        sendAnswer(q.id, selectedAnswerIds, participantId);
        stopTimer();
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
      const res = buildQuizResults(questions, answers);

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

      setSoloQuizFinished(true);
    }
  };

  const { timer, stopTimer } = useQuizTimer({
    resetKey: [current, questions],
    isPaused: showCorrection || isWaitingNextQuestion,
    onExpire: handleNext,
    durationSeconds: isUnlimitedTime ? null : questionDuration,
  });

  const handleRequestRematch = async () => {
    if (!roomCode) {
      setRematchFeedback(
        "Code de la salle introuvable. Retourne dans le menu multijoueur.",
      );
      return;
    }

    setIsRequestingRematch(true);
    setRematchFeedback(null);
    try {
      const { code } = await requestRematch(
        roomCode,
        resolveKnownParticipantId(user) ?? undefined,
        user?.jwt,
      );
      // Back to the lobby of the same room, already registered server-side
      navigate("/join-room", { state: { rejoinRoomCode: code || roomCode } });
    } catch (error: any) {
      console.error("Rematch request failed", error);
      setRematchFeedback(
        error?.response?.status === 409
          ? "Une nouvelle partie a déjà commencé dans cette salle."
          : "Impossible de lancer la revanche. La salle n'existe peut-être plus.",
      );
      setIsRequestingRematch(false);
    }
  };

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

  // Correction view
  if (showCorrection) {
    if (multiplayerRecap) {
      return (
        <MultiplayerRecapView
          recap={multiplayerRecap}
          currentUser={user}
          openQuestionIndex={openRecapQuestionIndex}
          onToggleQuestion={(idx) =>
            setOpenRecapQuestionIndex((prev) => (prev === idx ? null : idx))
          }
          onRequestRematch={handleRequestRematch}
          isRequestingRematch={isRequestingRematch}
          rematchFeedback={rematchFeedback}
          onBackHome={() => navigate("/")}
        />
      );
    }

    // Solo: straight to the global recap (answers + explanations per question)
    return (
      <MultiplayerRecapView
        recap={buildSoloRecap(results, answerTimers, user, questions)}
        currentUser={user}
        openQuestionIndex={openRecapQuestionIndex}
        onToggleQuestion={(idx) =>
          setOpenRecapQuestionIndex((prev) => (prev === idx ? null : idx))
        }
        onBackHome={() => navigate("/")}
      />
    );
  }

  // Quiz view
  if (!questions.length) {
    return <div className="container text-center mt-5">Chargement...</div>;
  }

  return (
    <>
      <QuestionView
        question={questions[current]}
        index={questionProgress?.questionIndex ?? current}
        total={questionProgress?.totalQuestions ?? questions.length}
        timer={timer}
        isUnlimitedTime={isUnlimitedTime}
        selectedOptionIds={answers[current] || []}
        onSelect={handleSelect}
        onNext={handleNext}
        isSubmitting={isSubmitting}
        isMultiplayer={isMultiplayerQuestionFlow}
        isWaitingNextQuestion={isWaitingNextQuestion}
        waitingElapsedSeconds={waitingElapsedSeconds}
        liveScores={liveScores}
        audioBlobUrl={audioBlobUrl}
        onZoomImage={(imageUrl) => {
          setZoomLevel(1);
          setZoomedImageUrl(imageUrl);
        }}
      />
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

export default QuizPage;
