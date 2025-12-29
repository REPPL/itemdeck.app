/**
 * Memory game UI components.
 *
 * Card and grid overlays for the memory game mechanic.
 * Uses shared components for timer and completion modal.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useMemoryStore } from "./store";
import { FloatingTimer, GameCompletionModal } from "../shared";
import { useMechanicActions, useGameTimer } from "../shared/hooks";
import type { CardOverlayProps, GridOverlayProps } from "../types";
import styles from "./memory.module.css";

/**
 * Card overlay for memory game.
 * Shows match/selection indicators.
 */
export function MemoryCardOverlay({ cardId }: CardOverlayProps) {
  const visibleCards = useMemoryStore((s) => s.visibleCards);
  const matchedPairs = useMemoryStore((s) => s.matchedPairs);
  const firstCard = useMemoryStore((s) => s.firstCard);
  const phase = useMemoryStore((s) => s.phase);

  const isFlipped = visibleCards.includes(cardId);
  const isMatched = matchedPairs.some((pair) => pair.includes(cardId));

  // In Extreme mode, first card flips back but we still need to show it's selected
  const isHiddenFirstCard = firstCard === cardId &&
    !visibleCards.includes(cardId) &&
    phase === "first_selected";

  return (
    <AnimatePresence>
      {isMatched && (
        <motion.div
          className={styles.matchedOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className={styles.matchedIcon}>✓</span>
        </motion.div>
      )}
      {isFlipped && !isMatched && (
        <motion.div
          className={styles.selectedOverlay}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        />
      )}
      {isHiddenFirstCard && (
        <motion.div
          className={styles.firstCardIndicator}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * Grid overlay for memory game.
 * Shows floating timer during play, completion modal when done.
 */
export function MemoryGridOverlay({ position }: GridOverlayProps) {
  const isComplete = useMemoryStore((s) => s.isComplete);
  const score = useMemoryStore((s) => s.score);
  const attempts = useMemoryStore((s) => s.attempts);
  const matchedPairs = useMemoryStore((s) => s.matchedPairs);
  const cardIds = useMemoryStore((s) => s.cardIds);
  const startTime = useMemoryStore((s) => s.startTime);
  const endTime = useMemoryStore((s) => s.endTime);

  const { handleExit, handlePlayAgain, handleChooseDifferent } = useMechanicActions();
  const { elapsedMs, formattedTime } = useGameTimer({
    isRunning: !isComplete && startTime !== null,
    startTime,
    endTime,
  });

  const totalPairs = Math.floor(cardIds.length / 2);
  const foundPairs = matchedPairs.length;
  const isActivePlay = startTime !== null && !isComplete;

  // Top position - show floating timer during active play
  if (position === "top") {
    return (
      <FloatingTimer
        timeMs={elapsedMs}
        progressLabel={`${foundPairs}/${totalPairs}`}
        visible={isActivePlay}
      />
    );
  }

  // Bottom position - completion modal
  return (
    <GameCompletionModal
      isOpen={isComplete}
      title="Complete!"
      subtitle={`You found all ${totalPairs} pairs in ${attempts} attempts!`}
      stats={[
        { label: "Pairs", value: `${foundPairs}/${totalPairs}` },
        { label: "Attempts", value: attempts },
        { label: "Score", value: score },
        { label: "Time", value: formattedTime },
      ]}
      primaryAction={{ label: "Play Again", onClick: handlePlayAgain }}
      secondaryAction={{ label: "Choose Different", onClick: handleChooseDifferent }}
      onExit={handleExit}
    />
  );
}
