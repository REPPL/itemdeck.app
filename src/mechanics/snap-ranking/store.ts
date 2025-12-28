/**
 * Zustand store for Snap Ranking mechanic.
 */

import { create } from "zustand";
import { shuffle } from "@/utils/shuffle";
import type { TierRating, CardRating, SnapRankingState, SnapRankingSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

/**
 * Extended store state with actions.
 */
interface SnapRankingStore extends SnapRankingState, SnapRankingSettings {
  // Lifecycle
  activate: () => void;
  deactivate: () => void;
  resetGame: () => void;
  initGame: (cardIds: string[]) => void;

  // Game actions
  rateCard: (tier: TierRating) => void;
  getCurrentCardId: () => string | null;
  isGameComplete: () => boolean;
  getProgress: () => { current: number; total: number };

  // Results
  getRatingsByTier: () => Record<TierRating, string[]>;
  getAverageRatingTime: () => number;
  getTotalTime: () => number;

  // Settings
  setConfirmRating: (value: boolean) => void;
  setAutoAdvance: (value: boolean) => void;
  setShowTimer: (value: boolean) => void;
}

/**
 * Initial state.
 */
const INITIAL_STATE: SnapRankingState = {
  isActive: false,
  cardIds: [],
  currentIndex: 0,
  ratings: [],
  cardShownAt: 0,
  gameStartedAt: 0,
  gameEndedAt: null,
  resetCount: 0,
};

/**
 * Snap Ranking store.
 */
export const useSnapRankingStore = create<SnapRankingStore>((set, get) => ({
  // Initial state
  ...INITIAL_STATE,
  ...DEFAULT_SETTINGS,

  // Lifecycle
  activate: () => {
    set({
      isActive: true,
      gameStartedAt: Date.now(),
      cardShownAt: Date.now(),
    });
  },

  deactivate: () => {
    set({ isActive: false });
  },

  resetGame: () => {
    const { cardIds, resetCount } = get();
    const shuffled = shuffle([...cardIds]);
    set({
      cardIds: shuffled,
      currentIndex: 0,
      ratings: [],
      cardShownAt: Date.now(),
      gameStartedAt: Date.now(),
      gameEndedAt: null,
      resetCount: resetCount + 1,
    });
  },

  initGame: (cardIds: string[]) => {
    const shuffled = shuffle([...cardIds]);
    set({
      cardIds: shuffled,
      currentIndex: 0,
      ratings: [],
      cardShownAt: Date.now(),
      gameStartedAt: Date.now(),
      gameEndedAt: null,
    });
  },

  // Game actions
  rateCard: (tier: TierRating) => {
    const state = get();
    if (!state.isActive || state.currentIndex >= state.cardIds.length) return;

    const cardId = state.cardIds[state.currentIndex];
    if (!cardId) return;

    const now = Date.now();
    const rating: CardRating = {
      cardId,
      tier,
      ratedAt: now,
      timeToRate: now - state.cardShownAt,
    };

    const newRatings = [...state.ratings, rating];
    const newIndex = state.currentIndex + 1;
    const isComplete = newIndex >= state.cardIds.length;

    set({
      ratings: newRatings,
      currentIndex: newIndex,
      cardShownAt: isComplete ? state.cardShownAt : now,
      gameEndedAt: isComplete ? now : null,
    });
  },

  getCurrentCardId: () => {
    const { cardIds, currentIndex, isActive } = get();
    if (!isActive || currentIndex >= cardIds.length) return null;
    return cardIds[currentIndex] ?? null;
  },

  isGameComplete: () => {
    const { currentIndex, cardIds } = get();
    return currentIndex >= cardIds.length && cardIds.length > 0;
  },

  getProgress: () => {
    const { currentIndex, cardIds } = get();
    return {
      current: Math.min(currentIndex + 1, cardIds.length),
      total: cardIds.length,
    };
  },

  // Results
  getRatingsByTier: () => {
    const { ratings } = get();
    const result: Record<TierRating, string[]> = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      F: [],
    };

    for (const rating of ratings) {
      result[rating.tier].push(rating.cardId);
    }

    return result;
  },

  getAverageRatingTime: () => {
    const { ratings } = get();
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, r) => sum + r.timeToRate, 0);
    return total / ratings.length;
  },

  getTotalTime: () => {
    const { gameStartedAt, gameEndedAt, isActive } = get();
    if (!gameStartedAt) return 0;
    const endTime = gameEndedAt ?? (isActive ? Date.now() : gameStartedAt);
    return endTime - gameStartedAt;
  },

  // Settings
  setConfirmRating: (value: boolean) => {
    set({ confirmRating: value });
  },

  setAutoAdvance: (value: boolean) => {
    set({ autoAdvance: value });
  },

  setShowTimer: (value: boolean) => {
    set({ showTimer: value });
  },
}));
