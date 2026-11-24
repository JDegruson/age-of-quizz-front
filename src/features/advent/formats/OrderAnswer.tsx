import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import { ADVENT_ORDER_SEPARATOR } from "../../../types/advent";
import type { AnswerFormatProps } from ".";
import ZoomButton from "../components/ZoomButton";
import styles from "../AdventCalendar.module.css";

interface Item {
  label: string;
  image?: string;
}

/**
 * Éléments à remettre dans l'ordre : glisser-déposer, ou flèches haut/bas
 * (mobile, clavier). Envoie les libellés joints par ADVENT_ORDER_SEPARATOR.
 */
const OrderAnswer: React.FC<AnswerFormatProps> = ({
  day,
  submitting,
  onSubmit,
  onZoom,
}) => {
  const [items, setItems] = useState<Item[]>(() =>
    day.choices.map((label, i) => ({ label, image: day.choiceImages[i] })),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(items.map((i) => i.label).join(ADVENT_ORDER_SEPARATOR));
      }}
    >
      <ol className={styles.orderList}>
        {items.map((item, index) => (
          <li
            key={item.label}
            className={[
              styles.orderItem,
              dragIndex === index && styles.orderDragging,
              overIndex === index && dragIndex !== index && styles.orderOver,
            ]
              .filter(Boolean)
              .join(" ")}
            draggable={!submitting}
            onDragStart={(e) => {
              setDragIndex(index);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              endDrag();
            }}
            onDragEnd={endDrag}
          >
            <span className={styles.orderRank}>{index + 1}</span>
            {item.image && (
              <span className={styles.zoomable}>
                <img
                  src={item.image}
                  alt=""
                  className={styles.orderImage}
                  draggable={false}
                />
                <ZoomButton url={item.image} onZoom={onZoom} />
              </span>
            )}
            <span className={styles.orderLabel}>{item.label}</span>
            <span className={styles.orderArrows}>
              <button
                type="button"
                className={styles.orderArrow}
                onClick={() => move(index, index - 1)}
                disabled={submitting || index === 0}
                aria-label={`Monter ${item.label}`}
              >
                <i className="bi bi-chevron-up" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                className={styles.orderArrow}
                onClick={() => move(index, index + 1)}
                disabled={submitting || index === items.length - 1}
                aria-label={`Descendre ${item.label}`}
              >
                <i className="bi bi-chevron-down" aria-hidden="true"></i>
              </button>
            </span>
          </li>
        ))}
      </ol>
      <Button
        type="submit"
        className="w-100 rounded-pill mt-3"
        loading={submitting}
        loadingLabel="Envoi..."
      >
        Valider mon classement
      </Button>
    </form>
  );
};

export default OrderAnswer;
