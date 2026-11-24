import axios from "axios";
import BACKEND_URL from "../config";
import { buildAuthHeaders, buildJsonHeaders } from "./http";
import type {
  AdventCalendar,
  AdventDay,
  AdventLeaderboardEntry,
  AdventResult,
} from "../types/advent";

const ADVENT_URL = `${BACKEND_URL}/events/advent`;

/** Public ; avec un JWT, les cases déjà répondues et le score sont inclus. */
export const fetchAdventCalendar = async (
  jwt?: string,
): Promise<AdventCalendar> => {
  const response = await axios.get(ADVENT_URL, {
    headers: buildAuthHeaders(jwt),
  });
  return response.data;
};

export const fetchAdventLeaderboard = async (
  jwt?: string,
): Promise<AdventLeaderboardEntry[]> => {
  const response = await axios.get(`${ADVENT_URL}/leaderboard`, {
    headers: buildAuthHeaders(jwt),
  });
  return response.data;
};

/** 403 si la case n'est pas encore débloquée, 404 si elle est vide. */
export const fetchAdventDay = async (
  day: number,
  jwt: string,
): Promise<AdventDay> => {
  const response = await axios.get(`${ADVENT_URL}/days/${day}`, {
    headers: buildAuthHeaders(jwt),
  });
  return response.data;
};

/**
 * Un seul essai, sauf en dépensant un joker (`useJoker`) sur une case ratée
 * et non révélée. 409 sinon.
 */
export const submitAdventAnswer = async (
  day: number,
  answer: string,
  useJoker: boolean,
  jwt: string,
): Promise<AdventResult> => {
  const response = await axios.post(
    `${ADVENT_URL}/days/${day}/answer`,
    { answer, useJoker },
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data;
};

/** Mode test admin : efface ses réponses pour rejouer toutes les cases. */
export const resetAdventPreview = async (jwt: string): Promise<void> => {
  await axios.delete(`${ADVENT_URL}/preview/answers`, {
    headers: buildAuthHeaders(jwt),
  });
};

/** Affiche la bonne réponse d'une case ratée ; elle ne pourra plus être rejouée. */
export const revealAdventAnswer = async (
  day: number,
  jwt: string,
): Promise<AdventResult> => {
  const response = await axios.post(`${ADVENT_URL}/days/${day}/reveal`, null, {
    headers: buildAuthHeaders(jwt),
  });
  return response.data;
};
