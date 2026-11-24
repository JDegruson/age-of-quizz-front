import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Spinner from "../../../components/ui/Spinner";
import {
  fetchAdventDay,
  revealAdventAnswer,
  submitAdventAnswer,
} from "../../../services/adventApi";
import {
  ADVENT_INDEX_SEPARATOR,
  ADVENT_NUMBER_SEPARATOR,
  adventMargin,
  ADVENT_ORDER_SEPARATOR,
  ADVENT_PAIR_LINK,
  ADVENT_PAIR_SEPARATOR,
  type AdventDay,
  type AdventJokers,
  type AdventResult,
} from "../../../types/advent";
import { ANSWER_FORMATS } from "../formats";
import { adventErrorMessage } from "../hooks/useAdventCalendar";
import AdventImageZoom from "./AdventImageZoom";
import QuestionMedia from "../../../components/QuestionMedia";
import { GridTiles, type GridMark } from "../formats/GridAnswer";
import styles from "../AdventCalendar.module.css";

interface AdventDayModalProps {
  dayNumber: number;
  jwt: string;
  /** Jokers du joueur, tels que connus par la grille. */
  jokers: AdventJokers | null;
  onClose: () => void;
  /** Appelé après chaque réponse / révélation, pour rafraîchir la grille. */
  onAnswered: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

const AdventDayModal: React.FC<AdventDayModalProps> = ({
  dayNumber,
  jwt,
  jokers,
  onClose,
  onAnswered,
}) => {
  const [day, setDay] = useState<AdventDay | null>(null);
  const [result, setResult] = useState<AdventResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  /** Le joueur a choisi de dépenser un joker : la saisie réapparaît. */
  const [retrying, setRetrying] = useState(false);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdventDay(dayNumber, jwt)
      .then((data) => {
        if (cancelled) return;
        setDay(data);
        setResult(data.result);
      })
      .catch((e) => {
        if (!cancelled)
          setError(adventErrorMessage(e, "Impossible d'ouvrir cette case."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dayNumber, jwt]);

  useEffect(() => {
    // Échap ferme d'abord l'image agrandie, puis la fenêtre
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (zoomUrl) setZoomUrl(null);
      else if (!submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting, zoomUrl]);

  /** Recharge l'état enregistré (ex. réponse déjà envoyée depuis un autre onglet). */
  const resync = () =>
    fetchAdventDay(dayNumber, jwt)
      .then((data) => {
        if (data.result) {
          setDay(data);
          setResult(data.result);
          setRetrying(false);
          onAnswered();
        }
      })
      .catch(() => undefined);

  const run = async (action: () => Promise<AdventResult>, fallback: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await action();
      setResult(r);
      // ZOOM : l'image suivante (dézoomée) après une erreur
      if (r.mediaUrl) {
        const mediaUrl = r.mediaUrl;
        setDay((d) => (d ? { ...d, mediaUrl } : d));
      }
      setRetrying(false);
      setConfirmReveal(false);
      onAnswered();
    } catch (e) {
      setError(adventErrorMessage(e, fallback));
      resync();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (answer: string) =>
    run(
      () => submitAdventAnswer(dayNumber, answer, retrying, jwt),
      "Ta réponse n'a pas pu être envoyée.",
    );

  const handleReveal = () =>
    run(
      () => revealAdventAnswer(dayNumber, jwt),
      "La réponse n'a pas pu être affichée.",
    );

  const AnswerInput = day ? ANSWER_FORMATS[day.format] : undefined;
  /** ZOOM : erreur avec encore des essais gratuits, sans passer par un joker. */
  const freeRetry = !!result && !result.correct && result.attemptsLeft > 0;
  const showInput = !result || retrying || freeRetry;
  const jokersLeft = jokers?.available ?? 0;

  const renderInput = () =>
    AnswerInput && day ? (
      <>
        <p className={styles.oneShot}>
          {freeRetry && result ? (
            <>
              <i className="bi bi-zoom-out me-1" aria-hidden="true"></i>«{" "}
              {result.answer} » : raté ! L'image se dézoome, plus que{" "}
              {plural(result.attemptsLeft, "essai")}.
            </>
          ) : retrying ? (
            <>
              <i className="bi bi-magic me-1" aria-hidden="true"></i>
              Joker utilisé à l'envoi de ta réponse.
            </>
          ) : day.maxAttempts > 1 ? (
            <>
              <i className="bi bi-zoom-out me-1" aria-hidden="true"></i>
              {day.maxAttempts} essais : l'image se dézoome à chaque erreur.
            </>
          ) : (
            <>
              <i
                className="bi bi-exclamation-circle me-1"
                aria-hidden="true"
              ></i>
              Un seul essai par case, réfléchis bien !
            </>
          )}
        </p>
        {/* key : une saisie neuve à chaque essai */}
        <AnswerInput
          key={`${retrying ? "retry" : "free"}-${result?.attempts ?? 0}`}
          day={day}
          submitting={submitting}
          onSubmit={handleSubmit}
          onZoom={setZoomUrl}
        />
        {retrying && (
          <Button
            variant="link"
            className="w-100 mt-1 text-light"
            onClick={() => setRetrying(false)}
            disabled={submitting}
          >
            Annuler, garder mon joker
          </Button>
        )}
      </>
    ) : (
      <p className={styles.oneShot}>
        Ce type de question n'est pas pris en charge par ta version du site :
        recharge la page.
      </p>
    );

  /** Un classement s'affiche en liste numérotée plutôt qu'en « A → B → C ». */
  const renderAnswer = (label: string, value: string, className: string) =>
    day?.format === "MATCH" ? (
      <div className={className}>
        {label} :
        <ul className={styles.matchResult}>
          {value.split(ADVENT_PAIR_SEPARATOR.trim()).map((pair) => {
            const [left, right] = pair
              .split(ADVENT_PAIR_LINK.trim())
              .map((s) => s.trim());
            const leftImage = day.choiceImages[day.choices.indexOf(left)];
            const rightImage = day.targetImages[day.targets.indexOf(right)];
            return (
              <li key={pair}>
                <span
                  className={
                    day.choiceImages.length === 0 || left.length > 1
                      ? styles.matchLeftLabel
                      : styles.matchLetter
                  }
                >
                  {left}
                </span>
                {leftImage && (
                  <img
                    src={leftImage}
                    alt=""
                    className={`${styles.matchResultImage} ${styles.zoomIn}`}
                    onClick={() => setZoomUrl(leftImage)}
                    title="Agrandir"
                  />
                )}
                <i className="bi bi-arrow-right" aria-hidden="true"></i>
                {rightImage && (
                  <img
                    src={rightImage}
                    alt=""
                    className={styles.matchResultEmblem}
                  />
                )}
                <strong>{right}</strong>
              </li>
            );
          })}
        </ul>
      </div>
    ) : day?.format === "SELECT" ? (
      <div className={className}>
        {label} :
        <ul className={styles.orderResult}>
          {value.split(" / ").map((part) => (
            <li key={part}>
              <strong>{part}</strong>
            </li>
          ))}
        </ul>
      </div>
    ) : day?.format === "ORDER" ? (
      <div className={className}>
        {label} :
        <ol className={styles.orderResult}>
          {value.split(ADVENT_ORDER_SEPARATOR.trim()).map((part) => (
            <li key={part}>
              <strong>{part.trim()}</strong>
            </li>
          ))}
        </ol>
      </div>
    ) : (
      <p className={className}>
        {label} : <strong>{value}</strong>
      </p>
    );

  /**
   * NUMBERS : tableau élément / ta valeur, puis la valeur attendue et ✓/✗
   * une fois la réponse révélée (sinon on ne dévoile rien avant un joker).
   */
  /**
   * GRID : la grille avec la sélection du joueur ; une fois la réponse
   * révélée, cases justes (vert), au choix (doré), en trop ou oubliées (rouge).
   */
  const renderGrid = (r: AdventResult) => {
    if (!day) return null;
    const parse = (text: string) =>
      new Set(
        text
          .split(ADVENT_INDEX_SEPARATOR)
          .filter((s) => s.trim() !== "")
          .map(Number),
      );
    const given = parse(r.answer);
    const marks = new Map<number, GridMark>();
    if (r.correctAnswer) {
      const [requiredText, optionalText = ""] = r.correctAnswer.split("|");
      const required = parse(requiredText);
      const optional = parse(optionalText);
      day.choices.forEach((_, i) => {
        if (given.has(i))
          marks.set(
            i,
            required.has(i) ? "good" : optional.has(i) ? "optional" : "wrong",
          );
        else if (required.has(i)) marks.set(i, "missed");
      });
    } else {
      given.forEach((i) => marks.set(i, "selected"));
    }
    return (
      <div className="mt-2">
        <GridTiles day={day} marks={marks} />
        {r.correctAnswer && (
          <p className={styles.gridLegend}>
            <span className={styles.grid_good}>coché, juste</span>
            <span className={styles.grid_optional}>coché, au choix</span>
            <span className={styles.grid_wrong}>coché à tort</span>
            <span className={styles.grid_missed}>oublié</span>
          </p>
        )}
      </div>
    );
  };

  const renderNumbers = (r: AdventResult) => {
    if (!day) return null;
    const given = r.answer.split(ADVENT_NUMBER_SEPARATOR).map(Number);
    const expected = r.correctAnswer
      ? r.correctAnswer.split(ADVENT_NUMBER_SEPARATOR).map(Number)
      : null;
    const tolerance = day.tolerance ?? 0;
    return (
      <table className={styles.numbersTable}>
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Toi</th>
            {expected && <th scope="col">Attendu</th>}
            {expected && <th scope="col"></th>}
          </tr>
        </thead>
        <tbody>
          {day.choices.map((label, i) => {
            const ok =
              expected &&
              Math.abs(given[i] - expected[i]) <=
                adventMargin(expected[i], tolerance);
            return (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{Number.isFinite(given[i]) ? given[i] : "–"}</td>
                {expected && (
                  <td>
                    {expected[i]}
                    <small> ±{adventMargin(expected[i], tolerance)}</small>
                  </td>
                )}
                {expected && (
                  <td>
                    <i
                      className={`bi ${
                        ok ? "bi-check-lg text-success" : "bi-x-lg text-danger"
                      }`}
                      aria-label={ok ? "dans la marge" : "hors de la marge"}
                    ></i>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderResult = (r: AdventResult) => {
    const pending = !r.correct && !r.revealed;
    return (
      <div
        className={`${styles.result} ${
          r.correct ? styles.resultWin : styles.resultLose
        }`}
        role="status"
      >
        <p className={styles.resultTitle}>
          {r.correct ? (
            <>
              <i className="bi bi-stars me-2" aria-hidden="true"></i>
              Bravo, bonne réponse !
            </>
          ) : (
            <>
              <i className="bi bi-snow me-2" aria-hidden="true"></i>
              Raté…
            </>
          )}
        </p>
        {r.correct && r.jokersUsed > 0 && (
          <p className={styles.jokerNote}>
            <i className="bi bi-magic me-1" aria-hidden="true"></i>
            Trouvée grâce à {plural(r.jokersUsed, "joker")}.
          </p>
        )}
        {day?.format === "NUMBERS" ? (
          renderNumbers(r)
        ) : day?.format === "GRID" ? (
          renderGrid(r)
        ) : (
          <>
            {!r.correct && renderAnswer("Ta réponse", r.answer, "mb-1")}
            {r.correctAnswer &&
              renderAnswer("Bonne réponse", r.correctAnswer, "mb-0")}
          </>
        )}
        {r.explanation && <p className={styles.explanation}>{r.explanation}</p>}

        {pending && (
          <div className={styles.retryBox}>
            {r.canRetry ? (
              <Button
                className="w-100 rounded-pill"
                onClick={() => setRetrying(true)}
                disabled={submitting}
              >
                <i className="bi bi-magic me-2" aria-hidden="true"></i>
                Rejouer avec un joker ({jokersLeft} restant
                {jokersLeft > 1 ? "s" : ""})
              </Button>
            ) : (
              <p className={styles.jokerNote}>
                <i className="bi bi-magic me-1" aria-hidden="true"></i>
                Pas de joker pour l'instant. Joue encore{" "}
                {plural(jokers?.nextJokerIn ?? 10, "question")} de{" "}
                <Link to="/quizz/solo">quiz</Link> pour en gagner un et retenter
                ta chance.
              </p>
            )}

            {confirmReveal ? (
              <div className={styles.revealConfirm}>
                <p className="mb-2">
                  Tu ne pourras plus rejouer cette case, même avec un joker.
                </p>
                <div className="d-flex gap-2">
                  <Button
                    variant="danger"
                    className="flex-fill rounded-pill"
                    onClick={handleReveal}
                    loading={submitting}
                  >
                    Voir la réponse
                  </Button>
                  <Button
                    variant="outline-light"
                    className="flex-fill rounded-pill"
                    onClick={() => setConfirmReveal(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="link"
                className="w-100 mt-1 text-light"
                onClick={() => setConfirmReveal(true)}
                disabled={submitting}
              >
                Abandonner et voir la réponse
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={(e) =>
          e.target === e.currentTarget && !submitting && onClose()
        }
      >
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="advent-day-title"
        >
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
          >
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>

          <p className={styles.dialogKicker}>
            <i className="bi bi-gift-fill me-2" aria-hidden="true"></i>
            Case n°{dayNumber}
          </p>

          {loading && (
            <div className="text-center my-4">
              <Spinner />
            </div>
          )}

          {day && (
            <>
              {(day.title || day.intro) && (
                <div className={styles.intro}>
                  {day.title && (
                    <p className={styles.introTitle}>
                      <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
                      {day.title}
                    </p>
                  )}
                  {day.intro && <p className="mb-0">{day.intro}</p>}
                </div>
              )}
              {/* Captcha : la consigne est dans son bandeau pendant la saisie */}
              <h2
                id="advent-day-title"
                className={
                  day.format === "GRID" && showInput
                    ? "visually-hidden"
                    : styles.prompt
                }
              >
                {day.format === "GRID"
                  ? `Sélectionne toutes les cases contenant ${day.prompt}`
                  : day.prompt}
              </h2>
              {day.quizFileUrl && (
                <div className={styles.quizMedia}>
                  <QuestionMedia
                    fileUrl={day.quizFileUrl}
                    type={day.quizMediaType ?? undefined}
                    onImageClick={setZoomUrl}
                  />
                </div>
              )}
              {day.mediaUrl && (
                <button
                  type="button"
                  className={styles.mediaButton}
                  onClick={() => setZoomUrl(day.mediaUrl)}
                  aria-label="Agrandir l'image"
                  title="Agrandir"
                >
                  <img
                    src={day.mediaUrl}
                    alt=""
                    className={styles.media}
                    loading="lazy"
                  />
                  <i
                    className={`bi bi-zoom-in ${styles.mediaZoomIcon}`}
                    aria-hidden="true"
                  ></i>
                </button>
              )}
              {showInput ? renderInput() : result && renderResult(result)}
            </>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          {((result && !retrying && !freeRetry) || (!loading && !day)) && (
            <Button
              variant="outline-light"
              className="w-100 rounded-pill mt-3"
              onClick={onClose}
            >
              Retour au calendrier
            </Button>
          )}
        </div>
      </div>
      {/* Hors de .dialog : son animation (transform) piégerait le position: fixed */}
      {zoomUrl && (
        <AdventImageZoom url={zoomUrl} onClose={() => setZoomUrl(null)} />
      )}
    </>
  );
};

export default AdventDayModal;
