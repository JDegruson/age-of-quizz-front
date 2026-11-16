import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./SelectAutocomplete.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectAutocompleteProps {
  id?: string;
  options: SelectOption[];
  /** Selected option value (must match one of the options). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Lowercase, without accents: "Éthiopiens" matches "ethio". Keeps length. */
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/’/g, "'")
    .toLowerCase();

const highlight = (label: string, query: string) => {
  const start = normalize(label).indexOf(query);
  if (start < 0 || !query) return label;
  return (
    <>
      {label.slice(0, start)}
      <mark className={styles.suggestionMatch}>
        {label.slice(start, start + query.length)}
      </mark>
      {label.slice(start + query.length)}
    </>
  );
};

/**
 * Drop-in replacement for a <select>: shows the selected label, and filters
 * the options as you type (accent and case insensitive). Arrows + Enter to
 * pick, Escape to cancel; leaving the field without picking restores the
 * previous value.
 */
const SelectAutocomplete: React.FC<SelectAutocompleteProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}) => {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const [text, setText] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  // false tant que l'utilisateur n'a rien tapé : on montre alors toute la liste
  const [typed, setTyped] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Valeur changée de l'extérieur (réinitialisation, chargement...)
  useEffect(() => {
    if (!open) setText(selectedLabel);
  }, [selectedLabel, open]);

  const query = typed ? normalize(text.trim()) : "";
  const suggestions = useMemo(() => {
    if (!query) return options;
    const rank = (label: string) => {
      const n = normalize(label);
      if (n.startsWith(query)) return 0;
      return n.split(/[\s'-]+/).some((w) => w.startsWith(query)) ? 1 : 2;
    };
    return options
      .map((o, i) => ({ o, i, n: normalize(o.label) }))
      .filter((x) => x.n.includes(query))
      .sort((a, b) => rank(a.o.label) - rank(b.o.label) || a.i - b.i)
      .map((x) => x.o);
  }, [options, query]);

  // Garde l'option active visible pendant la navigation au clavier
  useEffect(() => {
    if (!open) return;
    const item = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openList = () => {
    const selectedIndex = options.findIndex((o) => o.value === value);
    setTyped(false);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const close = (restore = true) => {
    setOpen(false);
    setTyped(false);
    if (restore) setText(selectedLabel);
  };

  const select = (option: SelectOption) => {
    setText(option.label);
    setOpen(false);
    setTyped(false);
    if (option.value !== value) onChange(option.value);
  };

  const handleBlur = () => {
    // Texte tapé qui correspond exactement à une option : on la prend
    const exact = typed
      ? options.find((o) => normalize(o.label) === normalize(text.trim()))
      : undefined;
    if (exact) {
      select(exact);
    } else {
      close();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length)
        setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length)
        setActiveIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length,
        );
    } else if (e.key === "Enter") {
      // Ne soumet pas le formulaire englobant
      e.preventDefault();
      const option = suggestions[activeIndex] ?? suggestions[0];
      if (option) select(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const isOpen = open && !disabled;

  return (
    <div className={styles.wrapper}>
      <input
        id={id}
        ref={inputRef}
        className={`form-select ${className}`.trim()}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && suggestions.length ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        spellCheck={false}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          setTyped(true);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={(e) => {
          e.target.select();
          openList();
        }}
        onClick={() => {
          if (!open) openList();
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <ul id={listId} role="listbox" ref={listRef} className={styles.suggestions}>
          {suggestions.length === 0 ? (
            <li className={styles.empty} role="presentation">
              Aucun résultat
            </li>
          ) : (
            suggestions.map((option, i) => (
              <li
                key={option.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={option.value === value}
                className={`${styles.suggestion} ${
                  i === activeIndex ? styles.suggestionActive : ""
                } ${option.value === value ? styles.suggestionSelected : ""}`}
                // mousedown : le champ ne perd pas le focus avant la sélection
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(option);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {highlight(option.label, query)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SelectAutocomplete;
