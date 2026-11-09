export type DailyRiddleTargetType = "CIVILIZATION" | "UNIT";

export interface DailyRiddleHint {
  label: string;
  text: string;
}

export interface DailyRiddle {
  date: string;
  number: number;
  targetType: DailyRiddleTargetType;
  maxAttempts: number;
  totalHints: number;
  hints: DailyRiddleHint[];
  candidates: string[];
  /** Progression enregistrée côté serveur (utilisateur connecté ayant déjà joué). */
  progress: DailyRiddleProgress | null;
}

export type DailyRiddleServerStatus = "PLAYING" | "WON" | "LOST";

export interface DailyRiddleProgress {
  guesses: string[];
  status: DailyRiddleServerStatus;
  answer: string | null;
}

export interface DailyRiddleStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  /** distribution[i] = victoires en i + 1 tentatives. */
  distribution: number[];
}

export interface DailyRiddleEntry {
  id: number;
  name: string;
  type: DailyRiddleTargetType;
  active: boolean;
  manuallyEdited: boolean;
  lastPlayedOn: string | null;
  hints: DailyRiddleHint[];
}

export interface DailyRiddleEntryRequest {
  name: string;
  type: DailyRiddleTargetType;
  active: boolean;
  hints: DailyRiddleHint[];
}

export interface DailyRiddleImportResult {
  civilizations: number;
  units: number;
  created: number;
  updated: number;
  skipped: number;
  warnings: string[];
}

export interface DailyRiddleGuessResponse {
  known: boolean;
  correct: boolean;
  answer: string | null;
  hints: DailyRiddleHint[];
  /** Propositions enregistrées côté serveur, null pour un anonyme. */
  guesses: string[] | null;
}
