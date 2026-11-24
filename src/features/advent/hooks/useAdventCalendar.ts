import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../../../context/UserContext";
import {
  fetchAdventCalendar,
  fetchAdventLeaderboard,
} from "../../../services/adventApi";
import type {
  AdventCalendar,
  AdventLeaderboardEntry,
} from "../../../types/advent";

/** Message renvoyé par le back (texte brut), sinon `fallback`. */
export const adventErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) &&
  typeof error.response?.data === "string" &&
  error.response.data.trim()
    ? error.response.data
    : fallback;

/** Grille et classement ; `reload` après chaque réponse. */
export const useAdventCalendar = () => {
  const { user, isUserLoading } = useUser();
  const jwt = user?.jwt;

  const [calendar, setCalendar] = useState<AdventCalendar | null>(null);
  const [leaderboard, setLeaderboard] = useState<AdventLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [nextCalendar, nextLeaderboard] = await Promise.all([
        fetchAdventCalendar(jwt),
        fetchAdventLeaderboard(jwt),
      ]);
      setCalendar(nextCalendar);
      setLeaderboard(nextLeaderboard);
      setError(null);
    } catch (e) {
      setError(adventErrorMessage(e, "Le calendrier est indisponible."));
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    if (!isUserLoading) reload();
  }, [isUserLoading, reload]);

  return { calendar, leaderboard, loading, error, jwt, reload };
};
