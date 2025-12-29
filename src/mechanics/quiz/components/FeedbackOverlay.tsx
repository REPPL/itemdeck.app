/**
 * Feedback overlay component.
 *
 * Shows correct/incorrect feedback after answering.
 */

import { useEffect, useCallback } from "react";
import { useQuizStore } from "../store";
import { TIMER } from "../types";
import styles from "../Quiz.module.css";

/**
 * Feedback overlay shown after answering a question.
 */
export function FeedbackOverlay() {
  const feedbackVisible = useQuizStore((s) => s.feedbackVisible);
  const lastAnswerCorrect = useQuizStore((s) => s.lastAnswerCorrect);
  const lastCorrectAnswer = useQuizStore((s) => s.lastCorrectAnswer);
  const answers = useQuizStore((s) => s.answers);
  const dismissFeedback = useQuizStore((s) => s.dismissFeedback);

  // Get the last answer's points
  const lastAnswer = answers[answers.length - 1];
  const pointsEarned = lastAnswer?.pointsEarned ?? 0;
  const wasSkipped = lastAnswer?.selectedAnswerId === null;

  const handleDismiss = useCallback(() => {
    dismissFeedback();
  }, [dismissFeedback]);

  // Auto-dismiss after delay
  useEffect(() => {
    if (!feedbackVisible) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, TIMER.feedbackDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [feedbackVisible, handleDismiss]);

  // Keyboard dismiss (any key)
  useEffect(() => {
    if (!feedbackVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      handleDismiss();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [feedbackVisible, handleDismiss]);

  if (!feedbackVisible) return null;

  return (
    <div className={styles.feedbackOverlay} onClick={handleDismiss}>
      <div
        className={[styles.feedbackContent, lastAnswerCorrect ? styles.correct : styles.incorrect].filter(Boolean).join(" ")}
      >
        <div className={styles.feedbackIcon}>
          {lastAnswerCorrect ? "✓" : wasSkipped ? "⏭" : "✗"}
        </div>
        <div className={styles.feedbackText}>
          {lastAnswerCorrect
            ? "Correct!"
            : wasSkipped
            ? "Skipped"
            : "Incorrect"}
        </div>

        {lastAnswerCorrect && pointsEarned > 0 && (
          <div className={styles.feedbackPoints}>+{pointsEarned} points</div>
        )}

        {!lastAnswerCorrect && lastCorrectAnswer && (
          <div className={styles.feedbackCorrectAnswer}>
            Correct answer: {lastCorrectAnswer.label}
          </div>
        )}

        <div className={styles.feedbackHint}>Click or press any key to continue</div>
      </div>
    </div>
  );
}
