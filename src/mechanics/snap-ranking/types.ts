/**
 * Type definitions for Snap Ranking mechanic.
 *
 * A field value guessing game where players guess the value of a hidden
 * field (configured via topBadgeField) for each card.
 *
 * Supports both numeric fields (distance-based scoring) and categorical
 * fields (exact-match-only scoring).
 */

import type { MechanicState } from "../types";

/**
 * A guess value can be any string or number from the field.
 */
export type GuessValue = string | number;

/**
 * Value type determines scoring strategy.
 */
export type ValueType = "numeric" | "categorical";

/**
 * Scoring configuration.
 */
export interface ScoringConfig {
  exactMatch: number;
  offByOne?: number; // Only for numeric
  offByTwo?: number; // Only for numeric
  wrong: number;
}

/**
 * Scoring for numeric fields (distance-based).
 */
export const NUMERIC_SCORING: ScoringConfig = {
  exactMatch: 10,
  offByOne: 5,
  offByTwo: 2,
  wrong: 0,
};

/**
 * Scoring for categorical fields (exact match only).
 */
export const CATEGORICAL_SCORING: ScoringConfig = {
  exactMatch: 10,
  wrong: 0,
};

/**
 * Calculate score for a guess.
 *
 * @param guess - The player's guess
 * @param actual - The actual value
 * @param valueType - Whether the field is numeric or categorical
 * @param allValues - All unique values (for calculating distance in numeric)
 */
export function calculateScore(
  guess: GuessValue,
  actual: GuessValue,
  valueType: ValueType,
  allValues: GuessValue[]
): number {
  // Exact match
  if (guess === actual) {
    return valueType === "numeric"
      ? NUMERIC_SCORING.exactMatch
      : CATEGORICAL_SCORING.exactMatch;
  }

  // Categorical: wrong if not exact
  if (valueType === "categorical") {
    return CATEGORICAL_SCORING.wrong;
  }

  // Numeric: calculate distance based on position in sorted values
  const guessIndex = allValues.indexOf(guess);
  const actualIndex = allValues.indexOf(actual);

  if (guessIndex === -1 || actualIndex === -1) {
    return NUMERIC_SCORING.wrong;
  }

  const distance = Math.abs(guessIndex - actualIndex);

  if (distance === 1) return NUMERIC_SCORING.offByOne!;
  if (distance === 2) return NUMERIC_SCORING.offByTwo!;
  return NUMERIC_SCORING.wrong;
}

/**
 * Get feedback text for a guess result.
 */
export function getGuessFeedback(
  guess: GuessValue,
  actual: GuessValue,
  valueType: ValueType,
  allValues: GuessValue[]
): { text: string; type: "correct" | "close" | "wrong" } {
  if (guess === actual) {
    return { text: "Correct!", type: "correct" };
  }

  if (valueType === "categorical") {
    return { text: `Wrong - was ${String(actual)}`, type: "wrong" };
  }

  // Numeric: check distance
  const guessIndex = allValues.indexOf(guess);
  const actualIndex = allValues.indexOf(actual);
  const distance = Math.abs(guessIndex - actualIndex);

  if (distance <= 2) {
    return { text: `Close! Was ${String(actual)}`, type: "close" };
  }

  return { text: `Wrong - was ${String(actual)}`, type: "wrong" };
}

/**
 * Individual card guess with scoring.
 */
export interface CardGuess {
  cardId: string;
  guess: GuessValue;
  actualValue: GuessValue;
  score: number;
  guessedAt: number;
  timeToGuess: number; // milliseconds
}

/**
 * Game initialisation configuration.
 */
export interface GameConfig {
  /** The field being guessed (from topBadgeField) */
  guessField: string;
  /** Cards with their values */
  cards: { id: string; value: GuessValue }[];
  /** Whether values are numeric or categorical */
  valueType: ValueType;
  /** All unique values for the guess field */
  uniqueValues: GuessValue[];
  /** Error message if game cannot be played */
  errorMessage?: string;
}

/**
 * Snap Ranking game state.
 */
export interface SnapRankingState extends MechanicState {
  /** Whether the game is active */
  isActive: boolean;

  /** The field being guessed (from topBadgeField) */
  guessField: string;

  /** All unique values for the guess field */
  uniqueValues: GuessValue[];

  /** Whether values are numeric (distance scoring) or categorical (exact match) */
  valueType: ValueType;

  /** All card IDs to guess (shuffled order) - only cards with the field */
  cardIds: string[];

  /** Mapping of card IDs to their actual values */
  cardValues: Record<string, GuessValue>;

  /** Current card index being guessed */
  currentIndex: number;

  /** Guesses made so far */
  guesses: CardGuess[];

  /** When the current card was shown (after flip) */
  cardShownAt: number;

  /** Game start time */
  gameStartedAt: number;

  /** Game end time (null if not finished) */
  gameEndedAt: number | null;

  /** Reset counter for re-shuffling */
  resetCount: number;

  /** Whether the current card has been flipped (revealed) */
  isCurrentCardFlipped: boolean;

  /** Error message if game cannot be played */
  errorMessage: string | null;
}

/**
 * Card count options.
 */
export const CARD_COUNT_OPTIONS = [5, 10, 15, 20, 25, 0] as const;
export type CardCountOption = (typeof CARD_COUNT_OPTIONS)[number];

/**
 * Get label for card count option.
 */
export function getCardCountLabel(count: CardCountOption): string {
  return count === 0 ? "All" : String(count);
}

/**
 * Snap Ranking settings.
 */
export interface SnapRankingSettings {
  /** Show timer */
  showTimer: boolean;
  /** Maximum number of cards to include (0 = all) */
  cardCount: CardCountOption;
}

/**
 * Default settings.
 */
export const DEFAULT_SETTINGS: SnapRankingSettings = {
  showTimer: true,
  cardCount: 0, // All cards by default
};
