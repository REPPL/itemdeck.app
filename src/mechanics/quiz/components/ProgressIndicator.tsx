/**
 * Progress indicator component for quiz.
 *
 * Shows question number, score, and streak.
 */

import { useCallback } from "react";
import { useQuizStore } from "../store";
import { useMechanicContext } from "../../context";
import styles from "../Quiz.module.css";

/**
 * Progress indicator with score and streak display.
 */
export function ProgressIndicator() {
  const getProgress = useQuizStore((s) => s.getProgress);
  const score = useQuizStore((s) => s.score);
  const streak = useQuizStore((s) => s.streak);
  const isActive = useQuizStore((s) => s.isActive);
  const questions = useQuizStore((s) => s.questions);

  const { deactivateMechanic } = useMechanicContext();

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  // Don't render if quiz not started
  if (!isActive || questions.length === 0) return null;

  const progress = getProgress();

  return (
    <div className={styles.progressHeader}>
      <div className={styles.progressInfo}>
        <span className={styles.progressText}>
          Question{" "}
          <span className={styles.progressCurrent}>{progress.current}</span>
          {" "}of {progress.total}
        </span>

        {streak > 0 && (
          <div className={styles.streakDisplay}>
            <span className={styles.streakIcon}>🔥</span>
            <span className={styles.streakValue}>{streak}</span>
          </div>
        )}
      </div>

      <div className={styles.scoreDisplay}>
        <span className={styles.scoreValue}>{score}</span>
        <span className={styles.scoreLabel}>pts</span>
      </div>

      <button
        type="button"
        className={styles.exitButton}
        onClick={handleExit}
        aria-label="Exit quiz"
      >
        Exit
      </button>
    </div>
  );
}
