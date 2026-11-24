import React from "react";
import type { AdventDaySummary } from "../../../types/advent";
import styles from "../AdventCalendar.module.css";

const PALETTES = [styles.red, styles.green, styles.gold, styles.blue];

interface AdventDoorProps {
  summary: AdventDaySummary;
  isToday: boolean;
  /** Ex. « 5 décembre », pour les cases encore fermées. */
  unlockLabel: string;
  big?: boolean;
  onOpen: (day: number) => void;
}

/**
 * Une case du calendrier. Répondue, sa porte reste entrouverte et laisse voir
 * le résultat ; elle se rouvre pour relire la question.
 */
const AdventDoor: React.FC<AdventDoorProps> = ({
  summary,
  isToday,
  unlockLabel,
  big = false,
  onOpen,
}) => {
  const { day, unlocked, available, correct, jokersUsed, inProgress } = summary;
  // Case ZOOM avec des essais restants : encore à jouer
  const answered = summary.answered && !inProgress;
  const playable = unlocked && available;
  const palette = PALETTES[(day * 7) % PALETTES.length];

  let label: string;
  if (!unlocked) label = `Case ${day}, s'ouvre le ${unlockLabel}`;
  else if (!available) label = `Case ${day}, bientôt remplie`;
  else if (answered)
    label = `Case ${day}, ${correct ? "bonne réponse" : "mauvaise réponse"}${
      jokersUsed > 0 ? ", avec joker" : ""
    }`;
  else if (inProgress) label = `Case ${day}, essais en cours`;
  else label = `Case ${day}, à ouvrir`;

  const classes = [
    styles.door,
    palette,
    big && styles.doorBig,
    !unlocked && styles.locked,
    unlocked && !available && styles.empty,
    answered && styles.opened,
    playable && !answered && styles.ready,
    isToday && styles.today,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={!playable}
      onClick={() => onOpen(day)}
      aria-label={label}
      title={label}
    >
      {/* Intérieur, visible une fois la porte ouverte */}
      <span className={styles.inside} aria-hidden="true">
        {answered &&
          (correct ? (
            <i className={`bi bi-star-fill ${styles.insideWin}`}></i>
          ) : (
            <i className={`bi bi-x-lg ${styles.insideLose}`}></i>
          ))}
        {answered && jokersUsed > 0 && (
          <i className={`bi bi-magic ${styles.insideJoker}`}></i>
        )}
      </span>

      <span className={styles.face} aria-hidden="true">
        <span className={styles.ribbon}></span>
        <span className={styles.number}>{day}</span>
        {!unlocked && <i className={`bi bi-lock-fill ${styles.lock}`}></i>}
        {unlocked && !available && (
          <i className={`bi bi-hourglass-split ${styles.lock}`}></i>
        )}
        {isToday && playable && !answered && (
          <i className={`bi bi-star-fill ${styles.todayStar}`}></i>
        )}
      </span>
    </button>
  );
};

export default AdventDoor;
