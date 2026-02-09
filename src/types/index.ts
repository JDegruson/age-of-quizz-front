export interface Answer {
  id: number;
  value: string;
  correct: boolean;
}

export interface Question {
  id: number;
  libelle: string;
  theme?: string;
  type?: string;
  status?: string;
  civilisation?: string;
  building?: string;
  fileUrl?: string;
  authorUsername?: string;
  answers?: Answer[];
  // Anciennes propriétés pour compatibilité
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  createdBy?: {
    id: number;
    username: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface FormData {
  questionText: string;
  options: string[];
  correctAnswer: string;
}
