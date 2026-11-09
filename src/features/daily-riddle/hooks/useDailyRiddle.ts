import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../../../context/UserContext";
import {
  fetchDailyRiddle,
  fetchDailyRiddleStats,
  submitDailyRiddleGuess,
} from "../../../services/dailyRiddleApi";
import type {
  DailyRiddle,
  DailyRiddleGuessResponse,
  DailyRiddleHint,
  DailyRiddleStats,
} from "../../../types/dailyRiddle";

const STORAGE_KEY = "dailyRiddleProgress";
// Le back plafonne au nombre réel d'indices.
const ALL_HINTS = 99;

export type DailyRiddleStatus = "playing" | "won" | "lost";

interface StoredProgress {
  date: string;
  guesses: string[];
  status: DailyRiddleStatus;
  answer: string | null;
}

const readProgress = (): StoredProgress | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredProgress) : null;
  } catch {
    return null;
  }
};

const writeProgress = (progress: StoredProgress) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Stockage indisponible (navigation privée...) : la partie reste jouable.
  }
};

const statusOf = (result: DailyRiddleGuessResponse): DailyRiddleStatus =>
  result.correct ? "won" : result.answer ? "lost" : "playing";

export const normalizeGuess = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/’/g, "'")
    .trim()
    .toLowerCase();

/**
 * Anonyme : progression dans le localStorage. Connecté : la progression
 * enregistrée côté serveur fait foi (synchronisée entre appareils), et une
 * partie commencée en anonyme le jour même est rejouée pour être enregistrée.
 */
export const useDailyRiddle = () => {
  const { user } = useUser();
  const jwt = user?.jwt;

  const [riddle, setRiddle] = useState<DailyRiddle | null>(null);
  const [hints, setHints] = useState<DailyRiddleHint[]>([]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [status, setStatus] = useState<DailyRiddleStatus>("playing");
  const [answer, setAnswer] = useState<string | null>(null);
  const [stats, setStats] = useState<DailyRiddleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const applyProgress = useCallback((progress: StoredProgress) => {
    setGuesses(progress.guesses);
    setStatus(progress.status);
    setAnswer(progress.answer);
    writeProgress(progress);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = readProgress();
      const revealed = stored
        ? stored.status === "playing"
          ? stored.guesses.length + 1
          : ALL_HINTS
        : 1;
      const data = await fetchDailyRiddle(revealed, jwt);
      setRiddle(data);

      if (data.progress) {
        setHints(data.hints);
        applyProgress({
          date: data.date,
          guesses: data.progress.guesses,
          status: data.progress.status.toLowerCase() as DailyRiddleStatus,
          answer: data.progress.answer,
        });
        return;
      }

      const local: StoredProgress =
        stored?.date === data.date
          ? stored
          : { date: data.date, guesses: [], status: "playing", answer: null };

      if (jwt && local.guesses.length > 0) {
        let last: DailyRiddleGuessResponse | null = null;
        for (const [i, guess] of local.guesses.entries()) {
          last = await submitDailyRiddleGuess(data.date, guess, i + 1, jwt);
        }
        if (last) {
          setHints(last.hints);
          applyProgress({
            date: data.date,
            guesses: last.guesses ?? local.guesses,
            status: statusOf(last),
            answer: last.answer,
          });
          return;
        }
      }

      // Progression d'un jour précédent : on ne garde que le premier indice.
      setHints(local === stored ? data.hints : data.hints.slice(0, 1));
      applyProgress(local);
    } catch {
      setError("Impossible de charger l'énigme du jour.");
    } finally {
      setLoading(false);
    }
  }, [jwt, applyProgress]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!jwt || status === "playing") {
      setStats(null);
      return;
    }
    fetchDailyRiddleStats(jwt)
      .then(setStats)
      .catch(() => setStats(null));
  }, [jwt, status]);

  const submitGuess = async (rawGuess: string): Promise<boolean> => {
    if (!riddle || status !== "playing") return false;
    const normalized = normalizeGuess(rawGuess);
    const candidate = riddle.candidates.find(
      (c) => normalizeGuess(c) === normalized,
    );
    if (!candidate) {
      setError("Choisis une proposition dans la liste.");
      return false;
    }
    if (guesses.some((g) => normalizeGuess(g) === normalized)) {
      setError("Tu as déjà proposé cette réponse.");
      return false;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const result = await submitDailyRiddleGuess(
        riddle.date,
        candidate,
        guesses.length + 1,
        jwt,
      );
      if (!result.known) {
        setError("Choisis une proposition dans la liste.");
        return false;
      }
      setHints(result.hints);
      applyProgress({
        date: riddle.date,
        guesses: result.guesses ?? [...guesses, candidate],
        status: statusOf(result),
        answer: result.answer,
      });
      return true;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setInfo("Une nouvelle énigme est disponible !");
        await load();
      } else {
        setError("Erreur lors de l'envoi de ta proposition.");
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    riddle,
    hints,
    guesses,
    status,
    answer,
    stats,
    isLoggedIn: !!jwt,
    loading,
    submitting,
    error,
    info,
    submitGuess,
  };
};
