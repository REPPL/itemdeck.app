/**
 * Results screen component.
 *
 * Shows final quiz results with statistics.
 */

import { useCallback } from "react";
import { useQuizStore } from "../store";
import { useMechanicContext } from "../../context";
import styles from "../Quiz.module.css";

/**
 * Format milliseconds as MM:SS.
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes)}:${String(remainingSeconds).padStart(2, "0")}`;
}

/**
 * Results screen shown at end of quiz.
 */
export function ResultsScreen() {
  const isActive = useQuizStore((s) => s.isActive);
  const isQuizComplete = useQuizStore((s) => s.isQuizComplete);
  const getResults = useQuizStore((s) => s.getResults);
  const questions = useQuizStore((s) => s.questions);

  const { deactivateMechanic, openMechanicPanel } = useMechanicContext();

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  const handlePlayAgain = useCallback(() => {
    deactivateMechanic();
    openMechanicPanel();
  }, [deactivateMechanic, openMechanicPanel]);

  // Don't show if not complete
  if (!isActive || !isQuizComplete() || questions.length === 0) return null;

  const results = getResults();

  return (
    <div className={styles.resultsOverlay}>
      <div className={styles.resultsModal}>
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>Quiz Complete!</h2>
          <div className={styles.resultsScore}>
            <span className={styles.resultsScoreValue}>{results.totalScore}</span>
            <span className={styles.resultsScoreMax}>/ {results.maxScore}</span>
          </div>
          <div className={styles.resultsPercentage}>{results.percentage}%</div>
        </div>

        <div className={styles.statsGrid}>
          <div className={`${styles.statItem} ${styles.correct}`}>
            <span className={styles.statValue}>{results.correctCount}</span>
            <span className={styles.statLabel}>Correct</span>
          </div>
          <div className={`${styles.statItem} ${styles.incorrect}`}>
            <span className={styles.statValue}>{results.incorrectCount}</span>
            <span className={styles.statLabel}>Incorrect</span>
          </div>
          <div className={`${styles.statItem} ${styles.streak}`}>
            <span className={styles.statValue}>{results.maxStreak}</span>
            <span className={styles.statLabel}>Best Streak</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{formatTime(results.totalTime)}</span>
            <span className={styles.statLabel}>Total Time</span>
          </div>
        </div>

        {results.skippedCount > 0 && (
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <span style={{ color: "var(--colour-text-muted, #888)", fontSize: "0.875rem" }}>
              {results.skippedCount} question{results.skippedCount > 1 ? "s" : ""} skipped
            </span>
          </div>
        )}

        <div className={styles.resultsActions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={handleExit}
          >
            Exit
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
