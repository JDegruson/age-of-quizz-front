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

/** Returns a shuffled copy of the array (Fisher-Yates). */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
      // Randomize answer order so the correct one isn't always at the same spot.
      // TRUE_FALSE keeps its natural order (Vrai / Faux).
      const answers =
        q.type === "TRUE_FALSE" ? q.answers : shuffle(q.answers);
      options = answers.map((a: any) => a.value || "");
      optionIds = answers.map((a: any) => a.id || 0);
      correctAnswers = answers
        .filter((a: any) => a.correct === true)
        .map((a: any) => a.value || "");
      correctAnswerIds = answers
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
