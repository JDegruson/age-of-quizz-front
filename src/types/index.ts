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
  fileUrl?: string | null;
  authorUsername?: string;
  answers?: Answer[];
  createdAt?: string;
  modifiedAt?: string;
}

export interface FormData {
  questionText: string;
  options: string[];
  correctAnswer: string;
}
