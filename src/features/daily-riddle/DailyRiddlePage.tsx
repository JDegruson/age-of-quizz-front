import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Spinner from "../../components/ui/Spinner";
import { normalizeGuess, useDailyRiddle } from "./hooks/useDailyRiddle";
import GuessAutocomplete from "./components/GuessAutocomplete";
import styles from "./DailyRiddle.module.css";

const DailyRiddlePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    riddle,
    hints,
    guesses,
    status,
    answer,
    stats,
    isLoggedIn,
    loading,
    submitting,
    error,
    info,
    submitGuess,
  } = useDailyRiddle();
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  if (loading && !riddle) {
    return (
      <div className="text-center mt-5">
        <Spinner />
      </div>
    );
  }

  if (!riddle) {
    return (
      <div className="container page-md mt-5">
        <Alert>{error ?? "Énigme indisponible."}</Alert>
      </div>
    );
  }

  const isUnit = riddle.targetType === "UNIT";
  const totalHints = Math.max(riddle.totalHints, hints.length);
  const guessed = new Set(guesses.map(normalizeGuess));
  const remainingCandidates = riddle.candidates.filter(
    (c) => !guessed.has(normalizeGuess(c)),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await submitGuess(input)) setInput("");
  };

  const handleSelect = async (candidate: string) => {
    setInput(candidate);
    if (await submitGuess(candidate)) setInput("");
  };

  const handleShare = async () => {
    const squares = guesses
      .map((_, i) =>
        status === "won" && i === guesses.length - 1 ? "🟩" : "🟥",
      )
      .join("");
    const score = status === "won" ? guesses.length : "X";
    const text = `Age of Quizz — Énigme #${riddle.number}\n${squares} ${score}/${riddle.maxAttempts}\n${window.location.origin}/daily-riddle`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="container page-fit page-md mt-5">
      <Card padding="lg">
        <h2 className={styles.title}>Énigme du jour #{riddle.number}</h2>
        <p className={styles.subtitle}>
          {isUnit
            ? "Trouve l'unité qui se cache derrière ces indices."
            : "Trouve la civilisation qui se cache derrière ces indices."}
        </p>

        <div
          className={styles.attempts}
          aria-label={`${guesses.length} tentative(s) sur ${riddle.maxAttempts}`}
        >
          {Array.from({ length: riddle.maxAttempts }, (_, i) => {
            const used = i < guesses.length;
            const won = status === "won" && i === guesses.length - 1;
            return (
              <span
                key={i}
                className={`${styles.attempt} ${
                  won ? styles.attemptWon : used ? styles.attemptUsed : ""
                }`}
              />
            );
          })}
        </div>

        <ol className={styles.hints}>
          {hints.map((hint, i) => (
            <li key={i} className={styles.hint}>
              <span className={styles.hintLabel}>
                Indice {i + 1} · {hint.label}
              </span>
              <span className={styles.hintText}>{hint.text}</span>
            </li>
          ))}
          {status === "playing" &&
            Array.from({ length: totalHints - hints.length }, (_, i) => (
              <li key={`locked-${i}`} className={styles.hintLocked}>
                <i className="bi bi-lock me-2"></i>
                Indice {hints.length + i + 1} — débloqué après une mauvaise
                réponse
              </li>
            ))}
        </ol>

        {info && <Alert variant="info">{info}</Alert>}
        {error && <Alert>{error}</Alert>}

        {status === "playing" ? (
          <form onSubmit={handleSubmit} className="d-flex gap-2">
            <GuessAutocomplete
              candidates={remainingCandidates}
              value={input}
              onChange={setInput}
              onSelect={handleSelect}
              placeholder={
                isUnit ? "Nom de l'unité..." : "Nom de la civilisation..."
              }
              disabled={submitting}
            />
            <Button
              type="submit"
              loading={submitting}
              disabled={!input.trim()}
            >
              Valider
            </Button>
          </form>
        ) : (
          <div className={styles.result}>
            <p className="mb-1">
              {status === "won"
                ? `Bravo ! Trouvé en ${guesses.length} tentative${guesses.length > 1 ? "s" : ""}.`
                : "Perdu ! La réponse était :"}
            </p>
            <p className={styles.answer}>{answer}</p>
            <p className="text-secondary mb-3">
              Reviens demain pour une nouvelle énigme.
            </p>
            <Button variant="outline-theme" onClick={handleShare}>
              <i className="bi bi-share me-2"></i>
              {copied ? "Résultat copié !" : "Partager mon résultat"}
            </Button>

            {stats && (
              <div className={styles.stats}>
                <div className={styles.statTiles}>
                  <div>
                    <span className={styles.statValue}>{stats.played}</span>
                    <span className={styles.statLabel}>Parties</span>
                  </div>
                  <div>
                    <span className={styles.statValue}>
                      {stats.played
                        ? Math.round((stats.won / stats.played) * 100)
                        : 0}
                      %
                    </span>
                    <span className={styles.statLabel}>Victoires</span>
                  </div>
                  <div>
                    <span className={styles.statValue}>
                      {stats.currentStreak}
                    </span>
                    <span className={styles.statLabel}>Série en cours</span>
                  </div>
                  <div>
                    <span className={styles.statValue}>{stats.maxStreak}</span>
                    <span className={styles.statLabel}>Meilleure série</span>
                  </div>
                </div>
                <div className={styles.distribution}>
                  {stats.distribution.map((count, i) => {
                    const max = Math.max(1, ...stats.distribution);
                    const isToday =
                      status === "won" && guesses.length === i + 1;
                    return (
                      <div key={i} className={styles.distributionRow}>
                        <span>{i + 1}</span>
                        <div
                          className={`${styles.distributionBar} ${
                            isToday ? styles.distributionBarToday : ""
                          }`}
                          style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isLoggedIn && (
              <p className="text-secondary small mt-3 mb-0">
                <Link to="/login">Connecte-toi</Link> pour sauvegarder tes
                résultats et suivre tes séries.
              </p>
            )}
          </div>
        )}

        {guesses.length > 0 && (
          <div className={styles.guesses}>
            {guesses.map((g, i) => (
              <span
                key={g}
                className={`${styles.guess} ${
                  status === "won" && i === guesses.length - 1
                    ? styles.guessCorrect
                    : ""
                }`}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => navigate("/")}
            style={{ color: "#e0e0e0" }}
          >
            ← Retour à l'accueil
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DailyRiddlePage;
