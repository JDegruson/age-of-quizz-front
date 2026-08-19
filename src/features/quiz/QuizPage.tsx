import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BACKEND_URL from "../../config";
import { submitAnswers } from "../../services/quizApi";
import { requestRematch } from "../../services/multiplayer";
import { useUser } from "../../context/UserContext";
import {
  extractGameRecap,
  type QuizLocationState,
} from "../multiplayer/utils/gameEvents";
import { resolveOrGenerateParticipantId } from "../multiplayer/utils/participant";
import { useMultiplayerQuizSocket } from "./hooks/useMultiplayerQuizSocket";
import { useQuizTimer } from "./hooks/useQuizTimer";
import { useQuizAudio } from "./hooks/useQuizAudio";
import {
  normalizeQuestions,
  type QuizQuestion,
} from "./utils/normalizeQuestions";
import {
  buildQuizResults,
  computeScoreAndPoints,
  type QuizResult,
} from "./utils/scoring";
import MultiplayerRecapView from "./components/MultiplayerRecapView";
import SoloRecapView from "./components/SoloRecapView";
import SoloCorrectionView from "./components/SoloCorrectionView";
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

  const [soloQuizFinished, setSoloQuizFinished] = useState(false);
  const [correctionIndex, setCorrectionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
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

  const applyNewQuestions = (rawQuestions: any[]) => {
    const normalized = normalizeQuestions(rawQuestions);
    setQuestions(normalized);
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
      applyNewQuestions(location.state.questions);
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
    updatedTimers[current] = Math.max(1, 15 - timer); // Temps écoulé (1 à 15 secondes)
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

      // Score et points - ONLY if ALL correct answers are selected
      const { score: sc, points: pts } = computeScoreAndPoints(
        questions,
        answers,
        updatedTimers,
      );
      setScore(sc);
      setPoints(pts);
    }
  };

  const { timer, stopTimer } = useQuizTimer({
    resetKey: [current, questions],
    isPaused: showCorrection || isWaitingNextQuestion,
    onExpire: handleNext,
  });

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

    // If we've gone through all questions, show final summary
    if (correctionIndex >= results.length) {
      return (
        <SoloRecapView
          results={results}
          answerTimers={answerTimers}
          score={score}
          points={points}
          onBackHome={() => navigate("/")}
        />
      );
    }

    // Show one question at a time during review
    return (
      <SoloCorrectionView
        result={results[correctionIndex]}
        currentQuestion={questions[correctionIndex]}
        index={correctionIndex}
        total={results.length}
        savedTime={answerTimers[correctionIndex] || 0}
        onPrev={() => setCorrectionIndex(Math.max(0, correctionIndex - 1))}
        onNext={() => setCorrectionIndex(correctionIndex + 1)}
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
        index={current}
        total={questions.length}
        timer={timer}
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
