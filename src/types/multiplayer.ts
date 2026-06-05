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
