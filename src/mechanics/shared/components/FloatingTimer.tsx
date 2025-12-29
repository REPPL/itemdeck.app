/**
 * Floating timer component.
 *
 * Displays elapsed time and progress during active gameplay.
 * Positioned fixed in top-right corner with minimal visual footprint.
 */

import { AnimatePresence, motion } from "framer-motion";
import { formatTime } from "../utils";
import styles from "../shared.module.css";

/**
 * Props for the FloatingTimer component.
 */
export interface FloatingTimerProps {
  /** Elapsed time in milliseconds */
  timeMs: number;
  /** Progress indicator text (e.g., "5/10", "45%") */
  progressLabel?: string;
  /** Whether to show the timer */
  visible: boolean;
  /** Optional className for customisation */
  className?: string;
}

/**
 * Floating timer component for game mechanics.
 *
 * Shows elapsed time and optional progress during active gameplay.
 * Uses framer-motion for smooth enter/exit animations.
 *
 * @example
 * <FloatingTimer
 *   timeMs={elapsedMs}
 *   progressLabel="5/10"
 *   visible={isPlaying}
 * />
 */
export function FloatingTimer({
  timeMs,
  progressLabel,
  visible,
  className,
}: FloatingTimerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`${styles.floatingTimer ?? ""} ${className ?? ""}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span className={styles.timerIcon}>⏱</span>
          <span className={styles.timerValue}>{formatTime(timeMs)}</span>
          {progressLabel && (
            <span className={styles.progress}>{progressLabel}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
