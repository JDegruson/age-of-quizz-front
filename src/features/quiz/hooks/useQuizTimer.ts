import { useEffect, useRef, useState } from "react";

export const DEFAULT_QUESTION_DURATION_SECONDS = 15;

/**
 * Timer for the quiz screen, reset whenever `resetKey` changes (pass
 * `[currentQuestionIndex, questions]`).
 *
 * - With a duration: counts down from `durationSeconds` and calls `onExpire`
 *   once when it reaches 0, unless `isPaused` is true.
 * - With `durationSeconds: null` (unlimited time): counts up from 0 and never
 *   expires; `timer` is then the elapsed time.
 */
export function useQuizTimer({
  resetKey,
  isPaused,
  onExpire,
  durationSeconds = DEFAULT_QUESTION_DURATION_SECONDS,
}: {
  resetKey: unknown[];
  isPaused: boolean;
  onExpire: () => void;
  durationSeconds?: number | null;
}) {
  const isUnlimited = durationSeconds === null;
  const [timer, setTimer] = useState(durationSeconds ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset + (re)start the timer whenever the question changes.
  useEffect(() => {
    setTimer(durationSeconds ?? 0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (isUnlimited) {
          return prev + 1;
        }
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

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Auto-advance once the countdown hits 0. The timeout is cancelled if the
  // timer is reset (or paused) in the meantime: in multiplayer, a new question
  // arrives while `timer` is still 0 from the previous one, and without this
  // cleanup the new question would be auto-submitted immediately.
  useEffect(() => {
    if (isUnlimited || timer !== 0 || isPaused) {
      return;
    }
    const timeout = setTimeout(() => onExpireRef.current(), 100);
    return () => clearTimeout(timeout);
  }, [timer, isPaused, isUnlimited]);

  // Freezes the countdown on its current value (e.g. once a multiplayer
  // answer is sent, while waiting for the next question).
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return { timer, stopTimer };
}
