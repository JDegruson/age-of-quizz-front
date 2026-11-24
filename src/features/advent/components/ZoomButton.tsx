import React from "react";
import styles from "../AdventCalendar.module.css";

interface ZoomButtonProps {
  url: string;
  onZoom: (url: string) => void;
  className?: string;
}

/** Petite loupe posée sur une image ; ne déclenche pas le clic de la ligne. */
const ZoomButton: React.FC<ZoomButtonProps> = ({ url, onZoom, className = "" }) => (
  <button
    type="button"
    className={`${styles.zoomButton} ${className}`.trim()}
    onClick={(e) => {
      e.stopPropagation();
      onZoom(url);
    }}
    onMouseDown={(e) => e.stopPropagation()}
    draggable={false}
    aria-label="Agrandir l'image"
    title="Agrandir"
  >
    <i className="bi bi-zoom-in" aria-hidden="true"></i>
  </button>
);

export default ZoomButton;
