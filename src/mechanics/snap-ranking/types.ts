/**
 * Type definitions for Snap Ranking mechanic.
 */

import type { MechanicState } from "../types";

/**
 * Tier rating options (S-tier through F-tier).
 */
export type TierRating = "S" | "A" | "B" | "C" | "D" | "F";

/**
 * All available tiers in order from best to worst.
 */
export const TIER_ORDER: TierRating[] = ["S", "A", "B", "C", "D", "F"];

/**
 * Tier display metadata.
 */
export interface TierInfo {
  label: string;
  colour: string;
  bgColour: string;
  shortcut: string;
}

/**
 * Tier metadata mapping.
 */
export const TIER_INFO: Record<TierRating, TierInfo> = {
  S: { label: "S Tier", colour: "#FFD700", bgColour: "#4A4000", shortcut: "S" },
  A: { label: "A Tier", colour: "#2ECC71", bgColour: "#1A4A2E", shortcut: "A" },
  B: { label: "B Tier", colour: "#3498DB", bgColour: "#1A3A4A", shortcut: "B" },
  C: { label: "C Tier", colour: "#9B59B6", bgColour: "#3A2A4A", shortcut: "C" },
  D: { label: "D Tier", colour: "#E67E22", bgColour: "#4A3020", shortcut: "D" },
  F: { label: "F Tier", colour: "#E74C3C", bgColour: "#4A2020", shortcut: "F" },
};

/**
 * Individual card rating with timestamp.
 */
export interface CardRating {
  cardId: string;
  tier: TierRating;
  ratedAt: number;
  timeToRate: number; // milliseconds
}

/**
 * Snap Ranking game state.
 */
export interface SnapRankingState extends MechanicState {
  /** Whether the game is active */
  isActive: boolean;
  /** All card IDs to rate (shuffled order) */
  cardIds: string[];
  /** Current card index being rated */
  currentIndex: number;
  /** Ratings made so far */
  ratings: CardRating[];
  /** When the current card was shown */
  cardShownAt: number;
  /** Game start time */
  gameStartedAt: number;
  /** Game end time (null if not finished) */
  gameEndedAt: number | null;
  /** Reset counter for re-shuffling */
  resetCount: number;
}

/**
 * Snap Ranking settings.
 */
export interface SnapRankingSettings {
  /** Show confirmation before rating */
  confirmRating: boolean;
  /** Auto-advance to next card after rating */
  autoAdvance: boolean;
  /** Show timer */
  showTimer: boolean;
}

/**
 * Default settings.
 */
export const DEFAULT_SETTINGS: SnapRankingSettings = {
  confirmRating: false,
  autoAdvance: true,
  showTimer: true,
};
