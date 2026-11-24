/**
 * Calendrier de l'avent (back : package event.advent). Les formats de
 * réponse sont extensibles : voir src/features/advent/formats.
 */
export type AdventFormat =
  | "CHOICE"
  | "TEXT"
  | "ORDER"
  | "MATCH"
  | "QUIZ"
  | "NUMBERS"
  | "SELECT"
  | "GRID"
  | "ZOOM"
  | (string & {});

/** Réponse NUMBERS : un nombre par élément, ex. « 350,800 » (AdventQuestion.NUMBER_SEPARATOR). */
export const ADVENT_NUMBER_SEPARATOR = ",";

/** Écart accepté pour une valeur (même calcul que Numbers.marginFor côté back). */
export const adventMargin = (value: number, tolerance: number) =>
  Math.max(1, Math.round(Math.abs(value) * tolerance));

/** Réponse QUIZ : indices cochés, ex. « 0,2 » (AdventQuestion.INDEX_SEPARATOR). */
export const ADVENT_INDEX_SEPARATOR = ",";

/** Sépare les éléments d'une réponse ORDER (AdventQuestion.ORDER_SEPARATOR côté back). */
export const ADVENT_ORDER_SEPARATOR = " → ";
/** Réponse MATCH : « A = X | B = Y » (AdventQuestion.PAIR_SEPARATOR / PAIR_LINK). */
export const ADVENT_PAIR_SEPARATOR = " | ";
export const ADVENT_PAIR_LINK = " = ";

export interface AdventDaySummary {
  day: number;
  unlocked: boolean;
  /** Une question existe pour cette case. */
  available: boolean;
  answered: boolean;
  correct: boolean | null;
  /** Jokers dépensés pour rejouer cette case. */
  jokersUsed: number;
  /** ZOOM : erreur, mais il reste des essais gratuits. */
  inProgress: boolean;
}

/** 1 joker par tranche de `questionsPerJoker` questions de quiz jouées pendant l'event. */
export interface AdventJokers {
  available: number;
  earned: number;
  used: number;
  questionsPlayed: number;
  questionsPerJoker: number;
  nextJokerIn: number;
}

export interface AdventCalendar {
  active: boolean;
  startDate: string;
  endDate: string;
  today: string;
  totalDays: number;
  unlockedDays: number;
  days: AdventDaySummary[];
  /** null pour un visiteur non connecté. */
  score: number | null;
  answeredCount: number | null;
  jokers: AdventJokers | null;
  /** Admin en mode test : toutes les cases ouvertes, même hors période, hors classement. */
  preview: boolean;
}

/**
 * Après une erreur, `correctAnswer` et `explanation` restent null tant que
 * le joueur n'a pas révélé la réponse (ce qui ferme la case aux jokers).
 */
export interface AdventResult {
  answer: string;
  correct: boolean;
  revealed: boolean;
  correctAnswer: string | null;
  explanation: string | null;
  jokersUsed: number;
  /** Erreur non révélée, plus d'essai gratuit et au moins un joker disponible. */
  canRetry: boolean;
  /** Essais gratuits utilisés / restants (plusieurs seulement pour ZOOM). */
  attempts: number;
  attemptsLeft: number;
  /** ZOOM : image à afficher désormais (dézoomée après une erreur). */
  mediaUrl: string | null;
}

export interface AdventDay {
  day: number;
  format: AdventFormat;
  prompt: string;
  mediaUrl: string | null;
  choices: string[];
  /** Image de chaque proposition (même ordre que `choices`), ou vide. */
  choiceImages: string[];
  /** Colonne de droite d'une question à relier (MATCH), sinon vide. */
  targets: string[];
  targetImages: string[];
  /** Case rattrapage (QUIZ) : titre et introduction affichés avant la question. */
  title: string | null;
  intro: string | null;
  /** Média de la question du quiz (type IMAGE / SOUND et fichier stocké). */
  quizMediaType: string | null;
  quizFileUrl: string | null;
  /** Plusieurs bonnes réponses à cocher. */
  multiple: boolean;
  /** NUMBERS : marge relative (0.2 = ±20 %) et valeurs justes nécessaires. */
  tolerance: number | null;
  minCorrect: number | null;
  /** GRID (captcha) : image découpée en `gridColumns` colonnes, cases = `choices`. */
  gridImage: string | null;
  gridColumns: number | null;
  /** Essais gratuits : 1, sauf ZOOM (une image par essai). */
  maxAttempts: number;
  /** Rempli une fois que le joueur a répondu. */
  result: AdventResult | null;
}

export interface AdventLeaderboardEntry {
  rank: number;
  userId: number;
  userProfileId: number | null;
  username: string;
  score: number;
  answeredCount: number;
  jokersUsed: number;
  me: boolean;
}
