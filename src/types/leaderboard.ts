/** Rankings from GET /leaderboard (top 20 each, recomputed every 5 min). */
export interface Leaderboard {
  accuracy: LeaderboardEntry[];
  questionsAnswered: LeaderboardEntry[];
  multiplayerWins: LeaderboardEntry[];
  dailyRiddleStreak: LeaderboardEntry[];
  /** value = questions created, sampleSize = questions validated. */
  questionsCreated: LeaderboardEntry[];
  /** Minimum questions answered to appear in the accuracy ranking. */
  minQuestionsForAccuracy: number;
  computedAt: string;
}

export interface LeaderboardEntry {
  /** Ties share the same rank. */
  rank: number;
  userProfileId: number;
  pseudo: string;
  avatar: string | null;
  /** Ranked value: accuracy in %, count... */
  value: number;
  /** What the value is based on: questions answered, games played... */
  sampleSize: number;
}
