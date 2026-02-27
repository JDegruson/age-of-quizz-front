// ...existing code...
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BACKEND_URL from "../config";
import { submitAnswers } from "../services/api";
import { useUser } from "../components/Context/UserContext";

// Types
interface QuizQuestion {
  id: number;
  intitule: string;
  options: string[];
  optionIds: number[];
  correctAnswers: string[];
  correctAnswerIds: number[];
  type: string; // MULTIPLE, TRUE_FALSE, etc.
  fileUrl?: string;
}

interface QuizResult {
  questionId: number;
  selected: string[];
  correct: string[];
  intitule: string;
  options: string[];
}

// Robust normalization function for backend question formats
function normalizeQuestions(rawQuestions: any[]): QuizQuestion[] {
  return (rawQuestions || []).map((q: any) => {
    // Get question text
    const intitule = q.intitule || q.libelle || q.questionText || "";

    // Handle options and correct answers
    let options: string[] = [];
    let optionIds: number[] = [];
    let correctAnswers: string[] = [];
    let correctAnswerIds: number[] = [];

    // Case 1: Backend provides 'reponses' array (AoE format)
    if (Array.isArray(q.reponses)) {
      options = q.reponses.map((r: any) => r.intitule || r.value || "");
      optionIds = q.reponses.map((r: any) => r.id || 0);
      correctAnswers = q.reponses
        .filter((r: any) => r.bonne === true || r.correct === true)
        .map((r: any) => r.intitule || r.value || "");
      correctAnswerIds = q.reponses
        .filter((r: any) => r.bonne === true || r.correct === true)
        .map((r: any) => r.id || 0);
    }
    // Case 2: 'answers' array (from types/index.ts)
    else if (Array.isArray(q.answers)) {
      options = q.answers.map((a: any) => a.value || a.intitule || "");
      optionIds = q.answers.map((a: any) => a.id || 0);
      correctAnswers = q.answers
        .filter((a: any) => a.correct === true || a.bonne === true)
        .map((a: any) => a.value || a.intitule || "");
      correctAnswerIds = q.answers
        .filter((a: any) => a.correct === true || a.bonne === true)
        .map((a: any) => a.id || 0);
    }
    // Case 3: Already normalized
    else if (Array.isArray(q.options)) {
      options = q.options;
      optionIds = Array.isArray(q.optionIds)
        ? q.optionIds
        : q.options.map((_: string, i: number) => i);
      correctAnswers = Array.isArray(q.correctAnswers)
        ? q.correctAnswers
        : q.correctAnswer
          ? [q.correctAnswer]
          : [];
      correctAnswerIds = Array.isArray(q.correctAnswerIds)
        ? q.correctAnswerIds
        : [];
    }

    // Fallback: TRUE_FALSE type
    if (
      (!options || options.length === 0) &&
      (q.type === "TRUE_FALSE" || q.type === "VRAI_FAUX")
    ) {
      options = ["Vrai", "Faux"];
      optionIds = [1, 2]; // Default IDs for TRUE_FALSE
      if (typeof q.correctAnswer === "string") {
        correctAnswers = [q.correctAnswer];
        correctAnswerIds = [q.correctAnswer === "Vrai" ? 1 : 2];
      }
    }

    // Robustly get fileUrl for media questions
    let fileUrl = q.fileUrl || q.url || q.mediaUrl || null;
    // If in reponses/answers, check for fileUrl there (for sound/image)
    if (!fileUrl && Array.isArray(q.reponses)) {
      const found = q.reponses.find(
        (r: any) => r.fileUrl || r.url || r.mediaUrl,
      );
      if (found) fileUrl = found.fileUrl || found.url || found.mediaUrl;
    }
    if (!fileUrl && Array.isArray(q.answers)) {
      const found = q.answers.find(
        (a: any) => a.fileUrl || a.url || a.mediaUrl,
      );
      if (found) fileUrl = found.fileUrl || found.url || found.mediaUrl;
    }
    return {
      id: q.id,
      intitule,
      options: options || [],
      optionIds: optionIds || [],
      correctAnswers: correctAnswers || [],
      correctAnswerIds: correctAnswerIds || [],
      type: q.type || "MULTIPLE",
      fileUrl: fileUrl || undefined,
    };
  });
}

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [questionPoints, setQuestionPoints] = useState<number[]>([]);
  const [answerTimers, setAnswerTimers] = useState<number[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Avance automatique à la fin du timer
  useEffect(() => {
    if (timer === 0 && !showCorrection) {
      // Pour éviter les appels multiples
      setTimeout(() => {
        if (timer === 0 && !showCorrection) {
          handleNext();
        }
      }, 100);
    }
    // eslint-disable-next-line
  }, [timer, showCorrection]);
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
  }, [current, questions.length]);

  // On mount, fetch questions (or get from location.state)
  useEffect(() => {
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
    // Save the current timer value for this question before moving
    const updatedTimers = [...answerTimers];
    updatedTimers[current] = Math.max(1, 15 - timer); // Temps écoulé (1 à 15 secondes)
    setAnswerTimers(updatedTimers);

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
        if (!jwt) {
          console.warn("JWT not found, skipping answer submission");
        } else {
          await submitAnswers(submitData, jwt);
          console.log("Answers submitted successfully");
        }
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

  // Correction view
  if (showCorrection) {
    return (
      <div className="container" style={{ maxWidth: 700, marginTop: 40 }}>
        <div className="card p-4">
          <h2 className="mb-4 text-center">Correction</h2>
          {results.map((r, idx) => {
            // Points et temps pour cette question
            const questionIsCorrect =
              r.selected.length === r.correct.length &&
              r.selected.every((ans) => r.correct.includes(ans));
            const savedTime = answerTimers[idx] || 0; // Temps écoulé pour répondre
            const pts = questionIsCorrect ? Math.max(1, 16 - savedTime) : 0; // Plus rapide = plus de points
            const time = savedTime; // Affiche le temps écoulé
            return (
              <div key={r.questionId} className="mb-4">
                <div className="fw-bold mb-2">
                  {idx + 1}. {r.intitule}
                </div>
                <div
                  style={{ fontSize: 15, marginBottom: 6, color: "#a3a3a3" }}
                >
                  Points obtenus :{" "}
                  <span style={{ color: "#4ade80", fontWeight: 600 }}>
                    {pts}
                  </span>{" "}
                  &nbsp;|&nbsp; Temps de réponse :{" "}
                  <span style={{ color: "#60a5fa", fontWeight: 600 }}>
                    {time}s
                  </span>
                </div>
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
                      bgColor = "#2d3a2e"; // vert/gris très foncé
                      borderColor = "#4ade80"; // vert pastel
                      textColor = "#d1fae5"; // vert très pâle
                    } else if (isCorrect && !isSelected) {
                      bgColor = "#353535"; // gris foncé
                      borderColor = "#a3a3a3"; // gris moyen
                      textColor = "#bdbdbd";
                    } else if (isWrong) {
                      bgColor = "#3a2323"; // rouge/gris très foncé
                      borderColor = "#f87171"; // rouge pastel
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
                          <span
                            style={{
                              marginLeft: 8,
                              color: isWrong
                                ? "#fff"
                                : isCorrect
                                  ? "#fff"
                                  : "#222",
                              fontWeight: isCorrect ? 400 : 700,
                            }}
                          >
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
            );
          })}
          <div className="text-center mt-4">
            <h3>
              Score : {score} / {results.length}
            </h3>
            <h4 style={{ marginTop: 10, color: "#4ade80" }}>
              Points : {points}
            </h4>
            <button
              className="btn btn-bg-theme mt-3"
              onClick={() => navigate("/")}
            >
              Retour accueil
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

  // Helper to extract file name from fileUrl
  const getFileName = (fileUrl?: string) => {
    if (!fileUrl) return "";
    return fileUrl.split(/[/\\]/).pop() || "";
  };

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
        {media}
        <div className="mb-4">
          {q.options.map((opt, idx) => {
            const optionId = q.optionIds[idx];
            return (
              <button
                key={opt}
                className={`btn w-100 mb-2 ${selected.includes(optionId) ? "btn-bg-theme" : "btn-outline-gold"}`}
                style={{ fontWeight: 600, fontSize: 18 }}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div className="text-end">
          <button className="btn btn-bg-theme" onClick={handleNext}>
            {current === questions.length - 1
              ? "Voir la correction"
              : "Question suivante"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
