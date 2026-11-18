import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  onNotificationsRefreshRequested,
} from "../../services/notificationsApi";
import type { AppNotification } from "../../types/notification";

/** Unread count is polled; it is cheap and keeps the badge roughly live. */
const POLL_INTERVAL_MS = 60_000;

/**
 * Notifications of the logged-in user: unread badge count (polled, and
 * refreshed when the tab regains focus) and the list, loaded on demand when
 * the panel opens.
 */
export const useNotifications = (jwt: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    if (!jwt) return;
    try {
      setUnreadCount(await fetchUnreadNotificationCount(jwt));
    } catch (err) {
      // Silent: a failed poll must not disturb the page, the next one retries.
      console.error("Error fetching unread notifications:", err);
    }
  }, [jwt]);

  const loadList = useCallback(async () => {
    if (!jwt) return;
    try {
      setLoading(true);
      const list = await fetchNotifications(jwt);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
      setError(null);
    } catch (err) {
      setError("Impossible de charger les notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    if (!jwt) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    refreshCount();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshCount();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    const unsubscribe = onNotificationsRefreshRequested(refreshCount);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      unsubscribe();
    };
  }, [jwt, refreshCount]);

  const markRead = useCallback(
    async (id: number) => {
      if (!jwt) return;
      const target = notifications.find((n) => n.id === id);
      if (!target || target.read) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await markNotificationRead(id, jwt);
      } catch (err) {
        console.error(err);
        refreshCount();
      }
    },
    [jwt, notifications, refreshCount],
  );

  const markAllRead = useCallback(async () => {
    if (!jwt) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(jwt);
    } catch (err) {
      console.error(err);
      refreshCount();
    }
  }, [jwt, refreshCount]);

  return {
    unreadCount,
    notifications,
    loading,
    error,
    loadList,
    markRead,
    markAllRead,
  };
};
