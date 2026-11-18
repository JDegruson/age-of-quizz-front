import type { DailyRiddleStats } from "./dailyRiddle";

/** Public stats of a player, from GET /users/profile/{id}/stats. */
export interface UserStats {
  overview: {
    questionsAnswered: number;
    correctAnswers: number;
    averageResponseTimeSeconds: number;
  };
  /** One entry per theme / civilisation answered, most answered first. */
  byTheme: CategoryStat[];
  byCivilisation: CategoryStat[];
  /** Last 12 weeks, oldest first, weeks without answers included. */
  progress: WeeklyProgress[];
  multiplayer: {
    gamesPlayed: number;
    wins: number;
    podiums: number;
    /** Games with every answer right. */
    perfectGames: number;
    bestPoints: number;
    /** 0-100 */
    averageAccuracy: number;
    recentGames: RecentGame[];
  };
  /** Null when the player never played the daily riddle. */
  dailyRiddle: DailyRiddleStats | null;
  /** Null when the player never created a question. */
  author: {
    created: number;
    validated: number;
    inReview: number;
    rejected: number;
    /** Distinct themes / civilisations covered by validated questions. */
    validatedThemes: number;
    validatedCivilisations: number;
    /** Validated image or sound questions. */
    validatedMedia: number;
    /** Answers given by other players to this author's questions. */
    timesAnswered: number;
  } | null;
  /** Null when the player never reviewed a question. */
  reviewer: {
    /** Validations + rejections. */
    decisions: number;
    validated: number;
    rejected: number;
    /** Questions of other authors corrected. */
    modified: number;
    /** Distinct other authors whose questions were reviewed. */
    authorsHelped: number;
  } | null;
}

export interface CategoryStat {
  /** Enum value (theme or civilisation). */
  key: string;
  answered: number;
  correct: number;
}

export interface WeeklyProgress {
  /** Monday of the week, "YYYY-MM-DD". */
  weekStart: string;
  answered: number;
  correct: number;
}

export interface RecentGame {
  gameSessionId: string;
  playedAt: string | null;
  rank: number;
  playerCount: number;
  points: number;
  correctAnswers: number;
  totalQuestions: number;
}
