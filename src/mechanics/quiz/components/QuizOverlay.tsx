/**
 * Quiz overlay component.
 *
 * Full-screen overlay containing the quiz UI.
 * Uses shared ErrorOverlay component.
 */

import { useEffect } from "react";
import { useQuizStore } from "../store";
import { useCollectionData } from "@/context/CollectionDataContext";
import { ErrorOverlay } from "../../shared";
import { useMechanicActions } from "../../shared/hooks";
import { ProgressIndicator } from "./ProgressIndicator";
import { QuestionDisplay } from "./QuestionDisplay";
import { AnswerOptions } from "./AnswerOptions";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { ResultsScreen } from "./ResultsScreen";
import { TimerBar } from "./TimerBar";
import type { GeneratorCardData } from "../generators";
import styles from "../Quiz.module.css";

/**
 * Skip button component.
 * Stays visible during feedback to prevent layout shift.
 */
function SkipButton() {
  const feedbackVisible = useQuizStore((s) => s.feedbackVisible);
  const skipQuestion = useQuizStore((s) => s.skipQuestion);
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);

  const question = getCurrentQuestion();

  if (!question) return null;

  // Keep button visible but disabled during feedback to prevent layout shift
  return (
    <button
      type="button"
      className={styles.skipButton}
      onClick={skipQuestion}
      disabled={feedbackVisible}
      style={{ visibility: feedbackVisible ? "hidden" : "visible" }}
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
  const { handleExit } = useMechanicActions();

  // Start quiz when activated with cards
  useEffect(() => {
    if (isActive && questions.length === 0 && !errorMessage && cards.length > 0) {
      // Convert DisplayCard to GeneratorCardData
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
    return (
      <ErrorOverlay
        title="Cannot Start Quiz"
        message={errorMessage}
        hint="Make sure you have at least 4 cards in your collection to play the quiz."
        onExit={handleExit}
        visible={true}
      />
    );
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
