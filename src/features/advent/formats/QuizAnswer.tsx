import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import { ADVENT_INDEX_SEPARATOR } from "../../../types/advent";
import type { AnswerFormatProps } from ".";
import styles from "../AdventCalendar.module.css";

/**
 * Question du quiz classique (case rattrapage) : une réponse à choisir, ou
 * plusieurs à cocher si `day.multiple`. Envoie les indices cochés.
 */
const QuizAnswer: React.FC<AnswerFormatProps> = ({
  day,
  submitting,
  onSubmit,
}) => {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (index: number) =>
    setSelected((current) =>
      day.multiple
        ? current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index]
        : [index],
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (selected.length > 0)
          onSubmit(
            [...selected].sort((a, b) => a - b).join(ADVENT_INDEX_SEPARATOR),
          );
      }}
    >
      {day.multiple && (
        <p className={styles.matchHint}>
          <i className="bi bi-check2-square me-1" aria-hidden="true"></i>
          {day.format === "SELECT"
            ? "Coche toutes celles qui conviennent : une ou plusieurs."
            : "Plusieurs bonnes réponses : coche-les toutes."}
        </p>
      )}
      <div
        className={styles.choices}
        role={day.multiple ? "group" : "radiogroup"}
        aria-label="Réponses"
      >
        {day.choices.map((choice, index) => {
          const checked = selected.includes(index);
          return (
            <button
              key={index}
              type="button"
              role={day.multiple ? "checkbox" : "radio"}
              aria-checked={checked}
              className={`${styles.choice} ${checked ? styles.choiceSelected : ""}`}
              disabled={submitting}
              onClick={() => toggle(index)}
            >
              {day.multiple && (
                <i
                  className={`bi ${checked ? "bi-check-square-fill" : "bi-square"} me-2`}
                  aria-hidden="true"
                ></i>
              )}
              {choice}
            </button>
          );
        })}
      </div>
      <Button
        type="submit"
        className="w-100 rounded-pill mt-3"
        disabled={selected.length === 0}
        loading={submitting}
        loadingLabel="Envoi..."
      >
        Valider ma réponse
      </Button>
    </form>
  );
};

export default QuizAnswer;
