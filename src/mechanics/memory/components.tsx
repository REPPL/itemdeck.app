/**
 * Memory game UI components.
 *
 * Card and grid overlays for the memory game mechanic.
 */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemoryStore } from "./store";
import { useMechanicContext } from "../context";
import type { CardOverlayProps, GridOverlayProps } from "../types";
import styles from "./memory.module.css";

/**
 * Card overlay for memory game.
 * Shows match/selection indicators.
 */
export function MemoryCardOverlay({ cardId }: CardOverlayProps) {
  // Subscribe to the actual arrays to ensure re-render on state changes
  const visibleCards = useMemoryStore((s) => s.visibleCards);
  const matchedPairs = useMemoryStore((s) => s.matchedPairs);
  const firstCard = useMemoryStore((s) => s.firstCard);
  const phase = useMemoryStore((s) => s.phase);

  // Derive flipped/matched status from subscribed state
  const isFlipped = visibleCards.includes(cardId);
  const isMatched = matchedPairs.some((pair) => pair.includes(cardId));

  // In Extreme mode, first card flips back but we still need to show it's selected
  // Show indicator when: this is the first card, it's not visible, and we're waiting for second
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
 * Shows score, timer, and controls.
 *
 * F-068: Top position hidden during active play for focus mode.
 * Stats shown in bottom bar only after game completion.
 */
export function MemoryGridOverlay({ position }: GridOverlayProps) {
  const isComplete = useMemoryStore((s) => s.isComplete);
  const score = useMemoryStore((s) => s.score);
  const attempts = useMemoryStore((s) => s.attempts);
  const matchedPairs = useMemoryStore((s) => s.matchedPairs);
  const cardIds = useMemoryStore((s) => s.cardIds);
  const startTime = useMemoryStore((s) => s.startTime);
  const endTime = useMemoryStore((s) => s.endTime);
  const { deactivateMechanic, openMechanicPanel } = useMechanicContext();

  const totalPairs = Math.floor(cardIds.length / 2);
  const foundPairs = matchedPairs.length;

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  const handlePlayAgain = useCallback(() => {
    // Go to config screen to let user adjust settings before playing again
    deactivateMechanic();
    openMechanicPanel();
  }, [deactivateMechanic, openMechanicPanel]);

  const handleChooseDifferent = useCallback(() => {
    deactivateMechanic();
    openMechanicPanel();
  }, [deactivateMechanic, openMechanicPanel]);

  // Force re-render every second to update timer
  const [, setTick] = useState(0);
  useEffect(() => {
    if (isComplete || !startTime) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => { clearInterval(interval); };
  }, [isComplete, startTime]);

  // Calculate elapsed time (use endTime if complete, otherwise current time)
  const endTimestamp = isComplete && endTime ? endTime : Date.now();
  const elapsedSeconds = startTime
    ? Math.floor((endTimestamp - startTime) / 1000)
    : 0;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Top position - show floating timer during active play
  if (position === "top") {
    // Only show during active play (game started but not complete)
    const isActivePlay = startTime !== null && !isComplete;
    return (
      <AnimatePresence>
        {isActivePlay && (
          <motion.div
            className={styles.floatingTimer}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className={styles.timerIcon}>⏱</span>
            <span className={styles.timerValue}>{timeString}</span>
            <span className={styles.pairsProgress}>{foundPairs}/{totalPairs}</span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Bottom position - stats bar on completion + modal
  return (
    <>
      {/* Bottom stats bar - appears after completion */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className={styles.bottomStatsBar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className={styles.stat}>
              <span className={styles.statLabel}>Pairs</span>
              <span className={styles.statValue}>{foundPairs}/{totalPairs}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Attempts</span>
              <span className={styles.statValue}>{attempts}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.statValue}>{score}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Time</span>
              <span className={styles.statValue}>{timeString}</span>
            </div>
            <button
              type="button"
              className={styles.exitButton}
              onClick={handleExit}
            >
              Exit
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion modal */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className={styles.completeModal}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className={styles.completeContent}>
              <h2 className={styles.completeTitle}>🎉 Complete!</h2>
              <p className={styles.completeStats}>
                You found all {totalPairs} pairs in {attempts} attempts!
              </p>
              <p className={styles.completeTime}>
                Time: {timeString}
              </p>
              <p className={styles.completeScore}>
                Final Score: {score}
              </p>
              <div className={styles.completeActions}>
                <button
                  type="button"
                  className={styles.exitButtonModal}
                  onClick={handleExit}
                >
                  Exit
                </button>
                <button
                  type="button"
                  className={`${styles.chooseDifferentButton} ${styles.hideOnMobile}`}
                  onClick={handleChooseDifferent}
                >
                  Choose Different Game
                </button>
                <button
                  type="button"
                  className={styles.playAgainButton}
                  onClick={handlePlayAgain}
                >
                  Play Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
