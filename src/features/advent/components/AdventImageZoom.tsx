import React from "react";
import styles from "../AdventCalendar.module.css";

interface AdventImageZoomProps {
  url: string;
  onClose: () => void;
}

/**
 * Agrandissement d'une image de question, au-dessus de la fenêtre de la case.
 * Échap est géré par AdventDayModal (ferme le zoom avant la fenêtre).
 */
const AdventImageZoom: React.FC<AdventImageZoomProps> = ({ url, onClose }) => (
  <div
    className={styles.zoomBackdrop}
    onClick={onClose}
    role="dialog"
    aria-modal="true"
    aria-label="Image agrandie"
  >
    <img src={url} alt="" className={styles.zoomImage} />
    <button
      type="button"
      className={styles.zoomClose}
      onClick={onClose}
      aria-label="Fermer l'agrandissement"
      autoFocus
    >
      <i className="bi bi-x-lg" aria-hidden="true"></i>
    </button>
  </div>
);

export default AdventImageZoom;
