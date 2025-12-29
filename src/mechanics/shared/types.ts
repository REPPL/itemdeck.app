/**
 * Shared types for game mechanics.
 *
 * Common interfaces used across all game mechanics for consistent
 * settings, stats, and display configuration.
 */

/**
 * Base game settings interface.
 * All mechanics that have configurable settings should extend this.
 */
export interface BaseGameSettings {
  /** Whether to show the timer during gameplay */
  showTimer?: boolean;
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Game statistics interface for export/import.
 * Common stats that can be tracked across mechanics.
 */
export interface GameStats {
  /** Total score achieved */
  totalScore: number;
  /** Maximum possible score */
  maxScore: number;
  /** Percentage complete/correct (0-100) */
  percentage: number;
  /** Total time taken in milliseconds */
  totalTimeMs: number;
  /** Number of correct answers/matches */
  correctCount: number;
  /** Number of incorrect answers/attempts */
  incorrectCount: number;
  /** Best streak achieved */
  maxStreak?: number;
  /** Timestamp when game started */
  startedAt: number;
  /** Timestamp when game ended */
  endedAt: number;
}

// Display configuration types are defined in hooks/useDisplayConfig.ts
// to avoid circular dependencies and keep hook-specific types together.
// Import them from there or from the main shared index.

/**
 * Standard button labels for consistent UI.
 */
export const BUTTON_LABELS = {
  /** Start a new game */
  START: "Start",
  /** Replay the same game/configuration */
  PLAY_AGAIN: "Play Again",
  /** Exit current game and return to main view */
  EXIT: "Exit",
  /** Go back to previous screen/selection */
  BACK: "Back",
  /** Choose a different game mode */
  CHOOSE_DIFFERENT: "Choose Different",
  /** Continue to next step */
  CONTINUE: "Continue",
  /** Skip current item */
  SKIP: "Skip",
  /** Confirm an action */
  CONFIRM: "Confirm",
  /** Cancel an action */
  CANCEL: "Cancel",
} as const;

/**
 * Type for button label keys.
 */
export type ButtonLabelKey = keyof typeof BUTTON_LABELS;

/**
 * Standard time format options.
 */
export interface TimeFormatOptions {
  /** Whether to pad minutes with leading zero */
  padMinutes?: boolean;
  /** Whether to show seconds */
  showSeconds?: boolean;
  /** Separator between minutes and seconds */
  separator?: string;
}

/**
 * Default time format options (MM:SS).
 */
export const DEFAULT_TIME_FORMAT: TimeFormatOptions = {
  padMinutes: true,
  showSeconds: true,
  separator: ":",
};

/**
 * Progress display format.
 */
export interface ProgressFormat {
  /** Current value */
  current: number;
  /** Total value */
  total: number;
}

/**
 * Format progress as "X/Y" string.
 */
export function formatProgress(progress: ProgressFormat): string {
  return `${String(progress.current)}/${String(progress.total)}`;
}

/**
 * Format progress as percentage string.
 */
export function formatProgressPercent(progress: ProgressFormat): string {
  const percent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;
  return `${String(percent)}%`;
}
