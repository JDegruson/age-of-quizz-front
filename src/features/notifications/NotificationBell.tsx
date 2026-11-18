import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AppNotification,
  NotificationType,
} from "../../types/notification";
import { useNotifications } from "./useNotifications";
import styles from "./NotificationBell.module.css";

const TYPE_DISPLAY: Record<
  NotificationType,
  { icon: string; tone: string; text: (actor: string) => string }
> = {
  QUESTION_VALIDATED: {
    icon: "bi-check-circle-fill",
    tone: styles.toneSuccess,
    text: (actor) => `Question validée par ${actor}`,
  },
  QUESTION_REJECTED: {
    icon: "bi-x-circle-fill",
    tone: styles.toneDanger,
    text: (actor) => `Question rejetée par ${actor}`,
  },
  QUESTION_MODIFIED: {
    icon: "bi-pencil-fill",
    tone: styles.toneInfo,
    text: (actor) => `Question modifiée par ${actor}`,
  },
  QUESTION_TO_REVIEW: {
    icon: "bi-hourglass-split",
    tone: styles.toneWarning,
    text: (actor) => `Nouvelle question de ${actor} à relire`,
  },
  QUESTION_RESUBMITTED: {
    icon: "bi-arrow-repeat",
    tone: styles.toneWarning,
    text: (actor) => `Question corrigée par ${actor}, à relire`,
  },
};

const relativeTime = (iso: string) => {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
};

interface NotificationBellProps {
  jwt: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  jwt,
  isOpen,
  onToggle,
  onClose,
}) => {
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications,
    loading,
    error,
    loadList,
    markRead,
    markAllRead,
  } = useNotifications(jwt);
  const wasOpen = useRef(false);

  // Fresh list every time the panel opens.
  useEffect(() => {
    if (isOpen && !wasOpen.current) loadList();
    wasOpen.current = isOpen;
  }, [isOpen, loadList]);

  const handleClick = (notification: AppNotification) => {
    markRead(notification.id);
    onClose();
    navigate(`/review-questions?question=${notification.questionId}`);
  };

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <li className={styles.wrapper}>
      <button
        type="button"
        className={styles.bellButton}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
            : "Notifications"
        }
        onClick={onToggle}
      >
        <i
          className={`bi ${unreadCount > 0 ? "bi-bell-fill" : "bi-bell"}`}
          aria-hidden="true"
        ></i>
        <span className={styles.mobileLabel}>Notifications</span>
        {unreadCount > 0 && <span className={styles.badge}>{badge}</span>}
      </button>

      {isOpen && (
        <div id="notification-panel" className={styles.panel}>
          <div className={styles.header}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAll}
                onClick={markAllRead}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {loading && notifications.length === 0 ? (
            <p className={styles.empty}>Chargement...</p>
          ) : error ? (
            <p className={styles.empty}>{error}</p>
          ) : notifications.length === 0 ? (
            <p className={styles.empty}>Aucune notification</p>
          ) : (
            <ul className={styles.list}>
              {notifications.map((notification) => {
                const display = TYPE_DISPLAY[notification.type];
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={`${styles.item} ${notification.read ? "" : styles.unread}`}
                      onClick={() => handleClick(notification)}
                    >
                      <i
                        className={`bi ${display?.icon ?? "bi-bell"} ${display?.tone ?? ""} ${styles.itemIcon}`}
                        aria-hidden="true"
                      ></i>
                      <span className={styles.itemBody}>
                        <span className={styles.itemTitle}>
                          {display
                            ? display.text(notification.actorName || "quelqu'un")
                            : "Notification"}
                        </span>
                        <span className={styles.itemLibelle}>
                          {notification.questionLibelle || "(Pas d'intitulé)"}
                        </span>
                        <span className={styles.itemTime}>
                          {relativeTime(notification.createdAt)}
                        </span>
                      </span>
                      {!notification.read && (
                        <span className={styles.dot} aria-label="Non lue"></span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </li>
  );
};

export default NotificationBell;
