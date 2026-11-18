import axios from "axios";
import BACKEND_URL from "../config";
import { buildJsonHeaders } from "./http";
import type { AppNotification } from "../types/notification";

export const fetchNotifications = async (
  jwt: string,
): Promise<AppNotification[]> => {
  const response = await axios.get<AppNotification[]>(
    `${BACKEND_URL}/notifications`,
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data;
};

export const fetchUnreadNotificationCount = async (
  jwt: string,
): Promise<number> => {
  const response = await axios.get<{ count: number }>(
    `${BACKEND_URL}/notifications/unread-count`,
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data.count;
};

export const markNotificationRead = async (id: number, jwt: string) => {
  await axios.put(`${BACKEND_URL}/notifications/${id}/read`, null, {
    headers: buildJsonHeaders(jwt),
  });
};

export const markAllNotificationsRead = async (jwt: string) => {
  await axios.put(`${BACKEND_URL}/notifications/read-all`, null, {
    headers: buildJsonHeaders(jwt),
  });
};

const REFRESH_EVENT = "notifications:refresh";

/**
 * Asks the notification bell to refetch now (e.g. after a review action that
 * clears "to review" notifications) instead of waiting for the next poll.
 */
export const requestNotificationsRefresh = () =>
  window.dispatchEvent(new Event(REFRESH_EVENT));

export const onNotificationsRefreshRequested = (listener: () => void) => {
  window.addEventListener(REFRESH_EVENT, listener);
  return () => window.removeEventListener(REFRESH_EVENT, listener);
};
