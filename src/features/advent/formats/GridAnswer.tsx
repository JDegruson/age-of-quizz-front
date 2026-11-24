import React, { useEffect, useState } from "react";
import { ADVENT_INDEX_SEPARATOR, type AdventDay } from "../../../types/advent";
import type { AnswerFormatProps } from ".";
import styles from "../AdventCalendar.module.css";

export type GridMark = "selected" | "good" | "optional" | "wrong" | "missed";

interface GridTilesProps {
  day: AdventDay;
  marks?: Map<number, GridMark>;
  onToggle?: (index: number) => void;
  disabled?: boolean;
}

/**
 * Image découpée en cases par CSS (une seule image, décalée dans chaque case).
 * Sert à la saisie et à la correction.
 */
export const GridTiles: React.FC<GridTilesProps> = ({
  day,
  marks,
  onToggle,
  disabled,
}) => {
  const columns = day.gridColumns ?? 1;
  const rows = Math.ceil(day.choices.length / columns);
  // Proportions d'une case = celles de l'image divisée en colonnes × lignes
  const [cellRatio, setCellRatio] = useState<number | null>(null);
  useEffect(() => {
    if (!day.gridImage) return;
    const img = new Image();
    img.onload = () =>
      setCellRatio(img.naturalWidth / columns / (img.naturalHeight / rows));
    img.src = day.gridImage;
  }, [day.gridImage, columns, rows]);

  return (
    <div
      className={styles.gridTiles}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {day.choices.map((label, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const mark = marks?.get(index);
        const style: React.CSSProperties = {
          backgroundImage: day.gridImage ? `url("${day.gridImage}")` : undefined,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: `${columns > 1 ? (col / (columns - 1)) * 100 : 0}% ${
            rows > 1 ? (row / (rows - 1)) * 100 : 0
          }%`,
          aspectRatio: cellRatio ? String(cellRatio) : "1.2",
        };
        const className = [styles.gridTile, mark && styles[`grid_${mark}`]]
          .filter(Boolean)
          .join(" ");
        return onToggle ? (
          <button
            key={label}
            type="button"
            className={className}
            style={style}
            onClick={() => onToggle(index)}
            disabled={disabled}
            aria-pressed={mark === "selected"}
            aria-label={`Case ${label}`}
          >
            {mark === "selected" && (
              <i className={`bi bi-check-circle-fill ${styles.gridCheck}`} aria-hidden="true"></i>
            )}
          </button>
        ) : (
          <span key={label} className={className} style={style} aria-label={`Case ${label}`}>
            {mark && mark !== "selected" && (
              <i
                className={`bi ${
                  mark === "wrong" || mark === "missed" ? "bi-x-circle-fill" : "bi-check-circle-fill"
                } ${styles.gridCheck}`}
                aria-hidden="true"
              ></i>
            )}
          </span>
        );
      })}
    </div>
  );
};

/** Façon captcha : cocher les cases, puis « Vérifier ». */
const GridAnswer: React.FC<AnswerFormatProps> = ({ day, submitting, onSubmit }) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (index: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const marks = new Map<number, GridMark>(
    Array.from(selected).map((i) => [i, "selected" as GridMark]),
  );

  return (
    <div className={styles.captcha}>
      <div className={styles.captchaHeader}>
        <p className={styles.captchaKicker}>Sélectionne toutes les cases contenant</p>
        <p className={styles.captchaTitle}>{day.prompt}</p>
        <p className={styles.captchaHelp}>
          Clique sur « Vérifier » une fois terminé. Un seul essai !
        </p>
      </div>

      <div className={styles.captchaBody}>
        <GridTiles day={day} marks={marks} onToggle={toggle} disabled={submitting} />
      </div>

      <div className={styles.captchaFooter}>
        <span className={styles.captchaCount}>
          {selected.size === 0
            ? "Aucune case sélectionnée"
            : `${selected.size} case${selected.size > 1 ? "s" : ""} sélectionnée${
                selected.size > 1 ? "s" : ""
              }`}
        </span>
        <button
          type="button"
          className={styles.captchaReset}
          onClick={() => setSelected(new Set())}
          disabled={submitting || selected.size === 0}
        >
          Réinitialiser
        </button>
        <button
          type="button"
          className={styles.captchaVerify}
          onClick={() =>
            onSubmit(
              Array.from(selected)
                .sort((a, b) => a - b)
                .join(ADVENT_INDEX_SEPARATOR),
            )
          }
          disabled={submitting || selected.size === 0}
        >
          {submitting ? "Vérification…" : "Vérifier"}
        </button>
      </div>
    </div>
  );
};

export default GridAnswer;
