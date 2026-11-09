import axios from "axios";
import BACKEND_URL from "../config";
import { buildAuthHeaders, buildJsonHeaders } from "./http";
import type {
  DailyRiddle,
  DailyRiddleEntry,
  DailyRiddleEntryRequest,
  DailyRiddleGuessResponse,
  DailyRiddleImportResult,
  DailyRiddleStats,
} from "../types/dailyRiddle";

const API_URL = BACKEND_URL;

/** Avec un JWT, la progression enregistrée de l'utilisateur est incluse. */
export const fetchDailyRiddle = async (
  revealed: number,
  jwt?: string,
): Promise<DailyRiddle> => {
  const response = await axios.get(`${API_URL}/daily-riddle`, {
    params: { revealed },
    headers: buildAuthHeaders(jwt),
  });
  return response.data;
};

/**
 * Rejette avec un statut 409 si l'énigme a changé depuis `date`. Avec un JWT,
 * la tentative est enregistrée et `attempt` est ignoré par le serveur.
 */
export const submitDailyRiddleGuess = async (
  date: string,
  guess: string,
  attempt: number,
  jwt?: string,
): Promise<DailyRiddleGuessResponse> => {
  const response = await axios.post(
    `${API_URL}/daily-riddle/guess`,
    { date, guess, attempt },
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data;
};

export const fetchDailyRiddleStats = async (
  jwt: string,
): Promise<DailyRiddleStats> => {
  const response = await axios.get(`${API_URL}/daily-riddle/stats`, {
    headers: buildAuthHeaders(jwt),
  });
  return response.data;
};

// ---------- Administration (ADMIN) ----------

export const fetchDailyRiddleEntries = async (
  jwt?: string,
): Promise<DailyRiddleEntry[]> => {
  const response = await axios.get(`${API_URL}/daily-riddle/admin/entries`, {
    headers: buildAuthHeaders(jwt),
  });
  return response.data;
};

export const createDailyRiddleEntry = async (
  request: DailyRiddleEntryRequest,
  jwt?: string,
): Promise<DailyRiddleEntry> => {
  const response = await axios.post(
    `${API_URL}/daily-riddle/admin/entries`,
    request,
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data;
};

export const updateDailyRiddleEntry = async (
  id: number,
  request: DailyRiddleEntryRequest,
  jwt?: string,
): Promise<DailyRiddleEntry> => {
  const response = await axios.put(
    `${API_URL}/daily-riddle/admin/entries/${id}`,
    request,
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data;
};

/**
 * `data` = data/data.json et `strings` = data/locales/fr/strings.json
 * du dépôt SiegeEngineers/aoe2techtree.
 */
export const importDailyRiddleTechTree = async (
  data: File,
  strings: File,
  keepManualEdits: boolean,
  jwt?: string,
): Promise<DailyRiddleImportResult> => {
  const formData = new FormData();
  formData.append("data", data);
  formData.append("strings", strings);
  formData.append("keepManualEdits", String(keepManualEdits));
  const response = await axios.post(
    `${API_URL}/daily-riddle/admin/import`,
    formData,
    { headers: buildAuthHeaders(jwt) },
  );
  return response.data;
};
