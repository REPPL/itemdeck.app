/**
 * Error overlay component.
 *
 * Displays error state when a mechanic cannot operate.
 * Used when the collection doesn't meet requirements for a game.
 */

import { AnimatePresence, motion } from "framer-motion";
import styles from "../shared.module.css";

/**
 * Props for the ErrorOverlay component.
 */
export interface ErrorOverlayProps {
  /** Error title */
  title: string;
  /** Error message */
  message: string;
  /** Hint text for resolving the error (optional) */
  hint?: string;
  /** Exit handler */
  onExit: () => void;
  /** Whether overlay is visible */
  visible: boolean;
}

/**
 * Error overlay component for game mechanics.
 *
 * Shows a modal explaining why the game cannot be played
 * and provides an exit button to return to the main view.
 *
 * @example
 * <ErrorOverlay
 *   title="Cannot Start Quiz"
 *   message="Not enough cards in collection."
 *   hint="Make sure you have at least 4 cards to play."
 *   onExit={handleExit}
 *   visible={!!errorMessage}
 * />
 */
export function ErrorOverlay({
  title,
  message,
  hint,
  onExit,
  visible,
}: ErrorOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.errorOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.errorModal}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className={styles.errorTitle}>{title}</h2>
            <p className={styles.errorMessage}>{message}</p>
            {hint && <p className={styles.errorHint}>{hint}</p>}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onExit}
            >
              Exit
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
