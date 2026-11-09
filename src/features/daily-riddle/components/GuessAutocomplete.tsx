import React, { useId, useMemo, useRef, useState } from "react";
import { normalizeGuess } from "../hooks/useDailyRiddle";
import styles from "../DailyRiddle.module.css";

const MAX_SUGGESTIONS = 8;

interface GuessAutocompleteProps {
  /** Propositions encore possibles (déjà triées). */
  candidates: string[];
  value: string;
  onChange: (value: string) => void;
  /** Choix d'une suggestion (clic ou Entrée) : la tentative est envoyée directement. */
  onSelect: (candidate: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Met en évidence la partie saisie. La normalisation garde la longueur (NFD sans accents). */
const highlight = (candidate: string, query: string) => {
  const start = normalizeGuess(candidate).indexOf(query);
  if (start < 0 || !query) return candidate;
  return (
    <>
      {candidate.slice(0, start)}
      <mark className={styles.suggestionMatch}>
        {candidate.slice(start, start + query.length)}
      </mark>
      {candidate.slice(start + query.length)}
    </>
  );
};

/**
 * Champ de saisie avec suggestions, insensible aux accents et à la casse.
 * Remplace le <datalist> natif, dont le rendu varie selon les navigateurs.
 */
const GuessAutocomplete: React.FC<GuessAutocompleteProps> = ({
  candidates,
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
}) => {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const query = normalizeGuess(value);
  const suggestions = useMemo(() => {
    if (!query) return [];
    const matches = candidates.filter((c) =>
      normalizeGuess(c).includes(query),
    );
    // Les noms qui commencent par la saisie d'abord, puis ceux dont un mot commence par elle.
    const rank = (c: string) => {
      const n = normalizeGuess(c);
      if (n.startsWith(query)) return 0;
      return n.split(/[\s'-]+/).some((word) => word.startsWith(query)) ? 1 : 2;
    };
    return matches
      .map((c, i) => ({ c, i, r: rank(c) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .slice(0, MAX_SUGGESTIONS)
      .map((s) => s.c);
  }, [candidates, query]);

  const isOpen = open && suggestions.length > 0;

  const select = (candidate: string) => {
    setOpen(false);
    onSelect(candidate);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && suggestions.length) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(suggestions[activeIndex] ?? suggestions[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.autocomplete}>
      <input
        ref={inputRef}
        className="form-control"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus
      />
      {isOpen && (
        <ul id={listId} role="listbox" className={styles.suggestions}>
          {suggestions.map((candidate, i) => (
            <li
              key={candidate}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.suggestion} ${
                i === activeIndex ? styles.suggestionActive : ""
              }`}
              // mousedown plutôt que click : le champ ne perd pas le focus avant la sélection.
              onMouseDown={(e) => {
                e.preventDefault();
                select(candidate);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {highlight(candidate, query)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GuessAutocomplete;
