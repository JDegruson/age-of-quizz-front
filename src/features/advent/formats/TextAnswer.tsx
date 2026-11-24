import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import type { AnswerFormatProps } from ".";

/** Réponse libre, comparée côté back sans tenir compte des accents ni de la casse. */
const TextAnswer: React.FC<AnswerFormatProps> = ({ submitting, onSubmit }) => {
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <input
        type="text"
        className="form-control form-control-lg"
        placeholder="Ta réponse"
        aria-label="Ta réponse"
        maxLength={200}
        autoFocus
        value={value}
        disabled={submitting}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        type="submit"
        className="w-100 rounded-pill mt-3"
        disabled={!trimmed}
        loading={submitting}
        loadingLabel="Envoi..."
      >
        Valider ma réponse
      </Button>
    </form>
  );
};

export default TextAnswer;
