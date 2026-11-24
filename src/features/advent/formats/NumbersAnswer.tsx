import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import { ADVENT_NUMBER_SEPARATOR } from "../../../types/advent";
import type { AnswerFormatProps } from ".";
import ZoomButton from "../components/ZoomButton";
import styles from "../AdventCalendar.module.css";

/** Un nombre entier à saisir par élément ; envoie les valeurs dans l'ordre. */
const NumbersAnswer: React.FC<AnswerFormatProps> = ({
  day,
  submitting,
  onSubmit,
  onZoom,
}) => {
  const [values, setValues] = useState<string[]>(() =>
    day.choices.map(() => ""),
  );
  const complete = values.every((v) => /^\d+$/.test(v.trim()));
  const percent = day.tolerance ? Math.round(day.tolerance * 100) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (complete)
          onSubmit(values.map((v) => Number(v.trim())).join(ADVENT_NUMBER_SEPARATOR));
      }}
    >
      {percent !== null && day.minCorrect !== null && (
        <p className={styles.matchHint}>
          <i className="bi bi-bullseye me-1" aria-hidden="true"></i>
          Marge d'erreur de ±{percent} % par valeur. Il en faut au moins{" "}
          {day.minCorrect} sur {day.choices.length} dans la marge pour réussir.
        </p>
      )}
      <ul className={styles.numbersList}>
        {day.choices.map((label, i) => (
          <li key={label} className={styles.numbersRow}>
            {day.choiceImages[i] && (
              <span className={styles.zoomable}>
                <img src={day.choiceImages[i]} alt="" className={styles.numbersImage} />
                <ZoomButton url={day.choiceImages[i]} onZoom={onZoom} />
              </span>
            )}
            <label htmlFor={`advent-number-${i}`} className={styles.numbersLabel}>
              {label}
            </label>
            <input
              id={`advent-number-${i}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={7}
              className={`form-control ${styles.numbersInput}`}
              value={values[i]}
              disabled={submitting}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value.replace(/\D/g, "");
                setValues(next);
              }}
            />
          </li>
        ))}
      </ul>
      <Button
        type="submit"
        className="w-100 rounded-pill mt-3"
        disabled={!complete}
        loading={submitting}
        loadingLabel="Envoi..."
      >
        Valider mes réponses
      </Button>
    </form>
  );
};

export default NumbersAnswer;
