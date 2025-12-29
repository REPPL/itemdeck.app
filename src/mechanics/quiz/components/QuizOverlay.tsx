/**
 * Quiz overlay component.
 *
 * Full-screen overlay containing the quiz UI.
 */

import { useEffect, useCallback } from "react";
import { useQuizStore } from "../store";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useMechanicContext } from "../../context";
import { ProgressIndicator } from "./ProgressIndicator";
import { QuestionDisplay } from "./QuestionDisplay";
import { AnswerOptions } from "./AnswerOptions";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { ResultsScreen } from "./ResultsScreen";
import { TimerBar } from "./TimerBar";
import type { GeneratorCardData } from "../generators";
import styles from "../Quiz.module.css";

/**
 * Error overlay shown when quiz cannot be played.
 */
function ErrorOverlay() {
  const errorMessage = useQuizStore((s) => s.errorMessage);
  const isActive = useQuizStore((s) => s.isActive);
  const { deactivateMechanic } = useMechanicContext();

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  if (!errorMessage || !isActive) return null;

  return (
    <div className={styles.errorOverlay}>
      <div className={styles.errorModal}>
        <h2 className={styles.errorTitle}>Cannot Start Quiz</h2>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <p className={styles.errorHint}>
          Make sure you have at least 4 cards in your collection to play the quiz.
        </p>
        <button
          type="button"
          className={styles.errorExitButton}
          onClick={handleExit}
        >
          Exit
        </button>
      </div>
    </div>
  );
}

/**
 * Skip button component.
 */
function SkipButton() {
  const feedbackVisible = useQuizStore((s) => s.feedbackVisible);
  const skipQuestion = useQuizStore((s) => s.skipQuestion);
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);

  const question = getCurrentQuestion();

  if (!question || feedbackVisible) return null;

  return (
    <button
      type="button"
      className={styles.skipButton}
      onClick={skipQuestion}
    >
      Skip Question
    </button>
  );
}

/**
 * Main quiz overlay component.
 */
export function QuizOverlay() {
  const isActive = useQuizStore((s) => s.isActive);
  const questions = useQuizStore((s) => s.questions);
  const errorMessage = useQuizStore((s) => s.errorMessage);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const isQuizComplete = useQuizStore((s) => s.isQuizComplete);

  const { cards } = useCollectionData();

  // Start quiz when activated with cards
  useEffect(() => {
    if (isActive && questions.length === 0 && !errorMessage && cards.length > 0) {
      // Convert DisplayCard to GeneratorCardData
      // Spread card first to get all fields, then override with explicit fields
      const generatorCards: GeneratorCardData[] = cards.map((card) => {
        const { id, title, imageUrl, year, categoryShort, categoryTitle, ...rest } = card;
        return {
          ...rest,
          id,
          title,
          imageUrl,
          year,
          categoryShort,
          categoryTitle,
        };
      });

      startQuiz(generatorCards);
    }
  }, [isActive, questions.length, errorMessage, cards, startQuiz]);

  if (!isActive) return null;

  // Show error overlay if there's an error
  if (errorMessage) {
    return <ErrorOverlay />;
  }

  // Show results if complete
  if (isQuizComplete()) {
    return <ResultsScreen />;
  }

  // Show quiz UI if questions exist
  if (questions.length === 0) {
    return null; // Still loading
  }

  return (
    <div className={styles.quizOverlay}>
      <TimerBar />
      <ProgressIndicator />

      <div className={styles.questionContent}>
        <QuestionDisplay />
        <AnswerOptions />
        <SkipButton />
      </div>

      <FeedbackOverlay />
    </div>
  );
}
