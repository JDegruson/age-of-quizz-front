export interface QuizQuestion {
  id: number;
  intitule: string;
  authorName?: string;
  options: string[];
  optionIds: number[];
  correctAnswers: string[];
  correctAnswerIds: number[];
  type: string; // MULTIPLE, TRUE_FALSE, etc.
  fileUrl?: string;
  explication?: string;
}

/** Converts a raw backend question payload into the shape the quiz screen renders. */
export function normalizeQuestions(rawQuestions: any[]): QuizQuestion[] {
  return (rawQuestions || []).map((q: any) => {
    // Get question text
    const intitule = q.libelle || "";
    const authorName = q.authorUsername || undefined;

    // Handle options and correct answers
    let options: string[] = [];
    let optionIds: number[] = [];
    let correctAnswers: string[] = [];
    let correctAnswerIds: number[] = [];

    if (Array.isArray(q.answers)) {
      options = q.answers.map((a: any) => a.value || "");
      optionIds = q.answers.map((a: any) => a.id || 0);
      correctAnswers = q.answers
        .filter((a: any) => a.correct === true)
        .map((a: any) => a.value || "");
      correctAnswerIds = q.answers
        .filter((a: any) => a.correct === true)
        .map((a: any) => a.id || 0);
    }

    // Fallback: TRUE_FALSE type
    if ((!options || options.length === 0) && q.type === "TRUE_FALSE") {
      options = ["Vrai", "Faux"];
      optionIds = [1, 2]; // Default IDs for TRUE_FALSE
    }

    const fileUrl = q.fileUrl || null;
    const explication = q.explication || undefined;
    return {
      id: q.id,
      intitule,
      authorName,
      options: options || [],
      optionIds: optionIds || [],
      correctAnswers: correctAnswers || [],
      correctAnswerIds: correctAnswerIds || [],
      type: q.type || "MULTIPLE",
      fileUrl: fileUrl || undefined,
      explication,
    };
  });
}
