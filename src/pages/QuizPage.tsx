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
  const location = useLocation();
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

  // Helper to extract file name from fileUrl
  const getFileName = (fileUrl?: string) => {
    if (!fileUrl) return "";
    return fileUrl.split(/[/\\]/).pop() || "";
  };

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
