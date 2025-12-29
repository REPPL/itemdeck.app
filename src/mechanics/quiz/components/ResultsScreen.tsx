/**
 * Results screen component.
 *
 * Shows final quiz results with statistics.
 * Uses shared GameCompletionModal component.
 */

import { useQuizStore } from "../store";
import { GameCompletionModal } from "../../shared";
import { useMechanicActions, formatTime } from "../../shared";
import styles from "../Quiz.module.css";

/**
 * Results screen shown at end of quiz.
 */
export function ResultsScreen() {
  const isActive = useQuizStore((s) => s.isActive);
  const isQuizComplete = useQuizStore((s) => s.isQuizComplete);
  const getResults = useQuizStore((s) => s.getResults);
  const questions = useQuizStore((s) => s.questions);

  const { handleExit, handlePlayAgain } = useMechanicActions();

  // Don't show if not complete
  if (!isActive || !isQuizComplete() || questions.length === 0) return null;

  const results = getResults();

  return (
    <GameCompletionModal
      isOpen={true}
      title="Quiz Complete!"
      subtitle={`${results.totalScore}/${results.maxScore} (${results.percentage}%)`}
      stats={[
        { label: "Correct", value: results.correctCount },
        { label: "Incorrect", value: results.incorrectCount },
        { label: "Best Streak", value: results.maxStreak },
        { label: "Total Time", value: formatTime(results.totalTime) },
      ]}
      primaryAction={{ label: "Play Again", onClick: handlePlayAgain }}
      onExit={handleExit}
    >
      {results.skippedCount > 0 && (
        <div className={styles.skippedNote}>
          {results.skippedCount} question{results.skippedCount > 1 ? "s" : ""} skipped
        </div>
      )}
    </GameCompletionModal>
  );
}
