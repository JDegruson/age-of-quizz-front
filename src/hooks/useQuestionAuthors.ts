import { useEffect, useState } from "react";
import { fetchQuestionAuthors } from "../services/questionsApi";

/**
 * Authors that can be picked as a quiz filter. On error the list stays empty:
 * the filter simply offers "all authors".
 */
export const useQuestionAuthors = (): string[] => {
  const [authors, setAuthors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchQuestionAuthors()
      .then((list) => {
        if (!cancelled) setAuthors(list);
      })
      .catch((error) => {
        console.error("Error fetching question authors:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return authors;
};
