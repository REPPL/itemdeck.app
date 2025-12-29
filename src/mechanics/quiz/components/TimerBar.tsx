/**
 * Timer bar component for timed quiz mode.
 *
 * Shows countdown progress for each question.
 */

import { useState, useEffect } from "react";
import { useQuizStore } from "../store";
import { getTimerDuration } from "../types";
import styles from "../Quiz.module.css";

/**
 * Timer bar shown during timed quiz mode.
 */
export function TimerBar() {
  const timerMode = useQuizStore((s) => s.timerMode);
  const difficulty = useQuizStore((s) => s.difficulty);
  const questionStartedAt = useQuizStore((s) => s.questionStartedAt);
  const feedbackVisible = useQuizStore((s) => s.feedbackVisible);
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);
  const skipQuestion = useQuizStore((s) => s.skipQuestion);

  const [progress, setProgress] = useState(100);

  const question = getCurrentQuestion();
  const timerDuration = getTimerDuration(difficulty);

  useEffect(() => {
    if (!timerMode || !question || feedbackVisible || !questionStartedAt) {
      setProgress(100);
      return;
    }

    const updateProgress = () => {
      const elapsed = Date.now() - questionStartedAt;
      const remaining = Math.max(0, 1 - elapsed / timerDuration);
      setProgress(remaining * 100);

      // Auto-skip if time expired
      if (remaining <= 0) {
        skipQuestion();
      }
    };

    // Update every 100ms
    updateProgress();
    const interval = setInterval(updateProgress, 100);

    return () => {
      clearInterval(interval);
    };
  }, [timerMode, question, feedbackVisible, questionStartedAt, skipQuestion, timerDuration]);

  if (!timerMode || !question) return null;

  // Determine colour based on remaining time
  let progressClass = styles.timerProgress;
  if (progress < 20) {
    progressClass = `${styles.timerProgress} ${styles.danger}`;
  } else if (progress < 40) {
    progressClass = `${styles.timerProgress} ${styles.warning}`;
  }

  return (
    <div className={styles.timerBar}>
      <div
        className={progressClass}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
