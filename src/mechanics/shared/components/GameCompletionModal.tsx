/**
 * Game completion modal component.
 *
 * Displays game results with consistent styling across all game mechanics.
 * Supports customisable stats, actions, and children for mechanic-specific content.
 */

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "../shared.module.css";

/**
 * A single stat item to display in the results.
 */
export interface StatItem {
  /** Label for the stat (e.g., "Time", "Score") */
  label: string;
  /** Value to display (e.g., "01:23", 100) */
  value: string | number;
}

/**
 * An action button configuration.
 */
export interface ActionButton {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
}

/**
 * Props for the GameCompletionModal component.
 */
export interface GameCompletionModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Modal title (e.g., "Complete!", "Game Over!") */
  title: string;
  /** Optional subtitle/summary text */
  subtitle?: string;
  /** Array of stat items to display */
  stats: StatItem[];
  /** Primary action button (e.g., "Play Again") */
  primaryAction: ActionButton;
  /** Secondary action button (optional, e.g., "Choose Different") */
  secondaryAction?: ActionButton;
  /** Exit handler */
  onExit: () => void;
  /** Exit button label (default: "Exit") */
  exitLabel?: string;
  /** Custom content below stats (for mechanic-specific content) */
  children?: ReactNode;
}

/**
 * Game completion modal component.
 *
 * Displays game results in a standardised format with stats grid
 * and action buttons. Supports custom children for mechanic-specific
 * content like guess breakdowns.
 *
 * Button layout:
 * - Row 1: End Game (outline) | Play Again (filled)
 * - Row 2: "Choose a different game" (small text link, centred)
 * - Close X button in top right corner
 *
 * @example
 * <GameCompletionModal
 *   isOpen={isComplete}
 *   title="Complete!"
 *   subtitle="You found all 10 pairs!"
 *   stats={[
 *     { label: "Time", value: "01:23" },
 *     { label: "Score", value: 850 },
 *   ]}
 *   primaryAction={{ label: "Play Again", onClick: handlePlayAgain }}
 *   secondaryAction={{ label: "Choose Different", onClick: handleChoose }}
 *   onExit={handleExit}
 * />
 */
export function GameCompletionModal({
  isOpen,
  title,
  subtitle,
  stats,
  primaryAction,
  secondaryAction,
  onExit,
  exitLabel = "End Game",
  children,
}: GameCompletionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.modalContent}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Close button in top right */}
            <button
              type="button"
              className={styles.closeButton}
              onClick={onExit}
              aria-label="Close"
            >
              ×
            </button>

            <h2 className={styles.modalTitle}>{title}</h2>

            {subtitle && (
              <p className={styles.modalSubtitle}>{subtitle}</p>
            )}

            <div className={styles.statsGrid}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.statItem}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                </div>
              ))}
            </div>

            {children}

            {/* Main action buttons: End Game | Play Again */}
            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.exitButton}
                onClick={onExit}
              >
                {exitLabel}
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </button>
            </div>

            {/* Secondary action as small text link below */}
            {secondaryAction && (
              <button
                type="button"
                className={styles.textLink}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
