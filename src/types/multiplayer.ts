export type GameMode = "MULTIPLAYER" | "SINGLEPLAYER";
export type GameStatus = "WAITING" | "IN_GAME" | "FINISHED";

export interface GameSessionMetadata {
  gameSessionId: string;
  gameMode: GameMode;
  status: GameStatus;
  startTime: string;
  endTime: string;
  totalDuration: number;
  questionCount: number;
  quizTheme?: string | null;
  quizDifficulty?: string | null;
}

export interface PlayerResult {
  userId: number;
  username: string;
  rank: number;
  score: number;
  points: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  totalTimeSeconds: number;
  averageTimePerQuestion: number;
  avatar?: string | null;
  /** Public profile of the player, null for guests. */
  userProfileId?: number | null;
}

export interface QuestionResponse {
  selected: string[];
  correct: string[];
  isCorrect: boolean;
  timeSeconds: number;
}

export interface QuestionDetail {
  questionId: number;
  questionText: string;
  playerResponses: Record<string, QuestionResponse>;
  fileUrl?: string | null;
  explanation?: string | null;
  /** MULTIPLE / TRUE_FALSE / SOUND / IMAGE: how to display fileUrl. */
  questionType?: string | null;
}

export interface GameRecapStatistics {
  fastestAnswerer?: {
    userId: number;
    timeSeconds: number;
  };
  slowestAnswerer?: {
    userId: number;
    timeSeconds: number;
  };
  mostDifficultQuestion?: number;
  easiestQuestion?: number;
  averageScoreAllPlayers?: number;
  [key: string]: unknown;
}

export interface GameRecapPayload {
  session: GameSessionMetadata;
  results: {
    playerResults: PlayerResult[];
  };
  questions: QuestionDetail[];
  statistics?: GameRecapStatistics;
  allowRematch?: boolean;
  rematchExpireIn?: number;
}

export interface GameEvent<T = unknown> {
  type: string;
  timestamp: string;
  data: T;
}

export interface AnswerProcessingResult {
  userId: number;
  questionId?: number;
  selected?: string[];
  correct?: string[];
  isCorrect?: boolean;
  pointsWon?: number;
  responseTimeSeconds?: number;
  [key: string]: unknown;
}
/** Game options chosen by the host in the lobby. */
export interface RoomSettings {
  numberOfQuestions: number;
  /** Seconds allowed per question. */
  questionDuration: number;
  /** Absent / null = no filter. */
  theme?: string | null;
  civilisation?: string | null;
  building?: string | null;
  /** Username of the questions' author. */
  authorUsername?: string | null;
  excludedThemes?: string[] | null;
}

export const ROOM_SETTINGS_LIMITS = {
  minQuestions: 1,
  maxQuestions: 50,
  minDuration: 5,
  maxDuration: 120,
} as const;

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  numberOfQuestions: 5,
  questionDuration: 15,
};

export type LobbyPlayer = {
  participantKey: string | null;
  userId: number;
  username: string;
  ready: boolean;
  isHost: boolean;
  avatar?: string | null;
  /** Public profile of the player, null for guests. */
  userProfileId?: number | null;
};
