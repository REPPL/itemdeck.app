/**
 * Memory game UI components.
 *
 * Card and grid overlays for the memory game mechanic.
 */

import { useCallback } from "react";
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
  const flippedCards = useMemoryStore((s) => s.flippedCards);
  const matchedPairs = useMemoryStore((s) => s.matchedPairs);

  // Derive flipped/matched status from subscribed state
  const isFlipped = flippedCards.includes(cardId);
  const isMatched = matchedPairs.some((pair) => pair.includes(cardId));

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
    </AnimatePresence>
  );
}

/**
 * Grid overlay for memory game.
 * Shows score, timer, and controls.
 */
export function MemoryGridOverlay({ position }: GridOverlayProps) {
  const isComplete = useMemoryStore((s) => s.isComplete);
  const score = useMemoryStore((s) => s.score);
  const attempts = useMemoryStore((s) => s.attempts);
  const matchedPairs = useMemoryStore((s) => s.matchedPairs);
  const cardIds = useMemoryStore((s) => s.cardIds);
  const startTime = useMemoryStore((s) => s.startTime);
  const resetGame = useMemoryStore((s) => s.resetGame);
  const { deactivateMechanic } = useMechanicContext();

  const totalPairs = Math.floor(cardIds.length / 2);
  const foundPairs = matchedPairs.length;

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Calculate elapsed time
  const elapsedSeconds = startTime
    ? Math.floor((Date.now() - startTime) / 1000)
    : 0;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (position === "top") {
    return (
      <div className={styles.statsBar}>
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
      </div>
    );
  }

  // Bottom position - game complete modal
  return (
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
            <p className={styles.completeScore}>
              Final Score: {score}
            </p>
            <button
              type="button"
              className={styles.playAgainButton}
              onClick={handlePlayAgain}
            >
              Play Again
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
