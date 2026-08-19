import { useEffect, useState } from "react";
import { buildAudioMediaUrl } from "../../../utils/mediaUrl";
import type { QuizQuestion } from "../utils/normalizeQuestions";

/**
 * Loads the current SOUND question's audio as a blob (so the native
 * <audio> element can seek), falling back to the direct media URL if the
 * fetch fails. Returns the blob URL to use as the <audio> source.
 */
export function useQuizAudio(
  questions: QuizQuestion[],
  current: number,
): string | null {
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (questions.length > 0 && current < questions.length) {
      const q = questions[current];
      if (q.fileUrl) {
        const type = (q.type || "").toUpperCase();
        if (type === "SOUND") {
          const audioUrl = buildAudioMediaUrl(q.fileUrl);
          fetch(audioUrl)
            .then((response) => response.blob())
            .then((blob) => {
              // Revoke previous URL to free memory
              if (audioBlobUrl) {
                URL.revokeObjectURL(audioBlobUrl);
              }
              const blobUrl = URL.createObjectURL(blob);
              setAudioBlobUrl(blobUrl);
            })
            .catch((error) => {
              console.error("Error fetching audio:", error);
              setAudioBlobUrl(audioUrl); // Fallback to direct URL
            });
        } else if (audioBlobUrl) {
          // Not sound, clear blob URL
          URL.revokeObjectURL(audioBlobUrl);
          setAudioBlobUrl(null);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, current]);

  return audioBlobUrl;
}
