import { useEffect, useRef, useState } from "react";

const QUESTION_DURATION_SECONDS = 15;

/**
 * Countdown timer for the quiz screen. Resets to 15s whenever `resetKey`
 * changes (pass `[currentQuestionIndex, questions]`) and calls `onExpire`
 * once when it reaches 0, unless `isPaused` is true.
 */
export function useQuizTimer({
  resetKey,
  isPaused,
  onExpire,
}: {
  resetKey: unknown[];
  isPaused: boolean;
  onExpire: () => void;
}) {
  const [timer, setTimer] = useState(QUESTION_DURATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset + (re)start the countdown whenever the question changes.
  useEffect(() => {
    setTimer(QUESTION_DURATION_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKey);

  // Auto-advance once the countdown hits 0.
  useEffect(() => {
    if (timer === 0 && !isPaused) {
      // Pour éviter les appels multiples
      setTimeout(() => {
        if (timer === 0 && !isPaused) {
          onExpire();
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, isPaused]);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
  };

  return { timer, stopTimer };
}
