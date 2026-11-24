import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import type { AnswerFormatProps } from ".";
import styles from "../AdventCalendar.module.css";

/** Propositions à choisir, puis validation explicite (un seul essai). */
const ChoiceAnswer: React.FC<AnswerFormatProps> = ({
  day,
  submitting,
  onSubmit,
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (selected) onSubmit(selected);
      }}
    >
      <div className={styles.choices} role="radiogroup" aria-label="Réponses">
        {day.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={selected === choice}
            className={`${styles.choice} ${
              selected === choice ? styles.choiceSelected : ""
            }`}
            disabled={submitting}
            onClick={() => setSelected(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      <Button
        type="submit"
        className="w-100 rounded-pill mt-3"
        disabled={!selected}
        loading={submitting}
        loadingLabel="Envoi..."
      >
        Valider ma réponse
      </Button>
    </form>
  );
};

export default ChoiceAnswer;
