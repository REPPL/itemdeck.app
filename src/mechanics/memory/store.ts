/**
 * Memory game state store.
 *
 * Zustand store for tracking memory game state.
 */

import { create } from "zustand";
import type { MechanicState } from "../types";

/**
 * Difficulty levels for Memory Game.
 * Controls how long cards stay visible before flipping back.
 */
export type MemoryDifficulty = "easy" | "medium" | "hard";

/**
 * Difficulty settings (flip delay in milliseconds).
 */
export const DIFFICULTY_SETTINGS: Record<MemoryDifficulty, { label: string; flipDelay: number }> = {
  easy: { label: "Easy", flipDelay: 1500 },
  medium: { label: "Medium", flipDelay: 1000 },
  hard: { label: "Hard", flipDelay: 600 },
};

/**
 * Available pair count options.
 */
export const PAIR_COUNT_OPTIONS = [4, 6, 8, 10, 12] as const;
export type PairCount = typeof PAIR_COUNT_OPTIONS[number];

/**
 * Memory game state.
 */
export interface MemoryGameState extends MechanicState {
  isActive: boolean;
  /** Currently flipped card IDs (max 2) */
  flippedCards: string[];
  /** Matched card pairs */
  matchedPairs: string[][];
  /** Number of flip attempts */
  attempts: number;
  /** Current score */
  score: number;
  /** Whether the game is complete */
  isComplete: boolean;
  /** Game start timestamp */
  startTime: number | null;
  /** Game end timestamp */
  endTime: number | null;
  /** Card IDs available for the game */
  cardIds: string[];
  /** Game reset counter - increments on each reset to trigger re-shuffle */
  resetCount: number;
  /** Difficulty level */
  difficulty: MemoryDifficulty;
  /** Number of pairs to play with */
  pairCount: PairCount;
}

/**
 * Memory game actions.
 */
interface MemoryGameActions {
  /** Initialise game with card IDs */
  initGame: (cardIds: string[]) => void;
  /** Flip a card */
  flipCard: (cardId: string) => void;
  /** Check if current flipped cards match */
  checkMatch: () => void;
  /** Reset the game */
  resetGame: () => void;
  /** Check if a card is currently flipped */
  isCardFlipped: (cardId: string) => boolean;
  /** Check if a card is matched */
  isCardMatched: (cardId: string) => boolean;
  /** Activate the mechanic */
  activate: () => void;
  /** Deactivate the mechanic */
  deactivate: () => void;
  /** Set difficulty level */
  setDifficulty: (difficulty: MemoryDifficulty) => void;
  /** Set number of pairs */
  setPairCount: (count: PairCount) => void;
}

export type MemoryStore = MemoryGameState & MemoryGameActions;

const INITIAL_STATE: MemoryGameState = {
  isActive: false,
  flippedCards: [],
  matchedPairs: [],
  attempts: 0,
  score: 0,
  isComplete: false,
  startTime: null,
  endTime: null,
  cardIds: [],
  resetCount: 0,
  difficulty: "easy",
  pairCount: 6,
};

/**
 * Memory game store.
 */
export const useMemoryStore = create<MemoryStore>((set, get) => ({
  ...INITIAL_STATE,

  initGame: (cardIds) => {
    // Shuffle and take pairs (need even number)
    const evenCount = cardIds.length - (cardIds.length % 2);
    const gameCards = cardIds.slice(0, evenCount);

    set({
      cardIds: gameCards,
      flippedCards: [],
      matchedPairs: [],
      attempts: 0,
      score: 0,
      isComplete: false,
      startTime: Date.now(),
      endTime: null,
    });
  },

  flipCard: (cardId) => {
    const state = get();

    // Can't flip if not active
    if (!state.isActive) return;

    // Can't flip if already matched
    if (state.isCardMatched(cardId)) return;

    // Can't flip if already flipped
    if (state.flippedCards.includes(cardId)) return;

    // Can't flip more than 2 cards
    if (state.flippedCards.length >= 2) return;

    // Start timer on first flip
    if (!state.startTime) {
      set({ startTime: Date.now() });
    }

    // Flip the card
    const newFlipped = [...state.flippedCards, cardId];
    set({ flippedCards: newFlipped });

    // If two cards are flipped, check match after a delay
    if (newFlipped.length === 2) {
      set({ attempts: state.attempts + 1 });

      // Auto-check after delay based on difficulty
      const flipDelay = DIFFICULTY_SETTINGS[state.difficulty].flipDelay;
      setTimeout(() => {
        get().checkMatch();
      }, flipDelay);
    }
  },

  checkMatch: () => {
    const state = get();

    if (state.flippedCards.length !== 2) return;

    const first = state.flippedCards[0];
    const second = state.flippedCards[1];

    if (!first || !second) return;

    // Extract base ID by removing the -a or -b suffix
    // Cards are duplicated in CardGrid as "original-id-a" and "original-id-b"
    const getBaseId = (cardId: string): string => {
      if (cardId.endsWith("-a") || cardId.endsWith("-b")) {
        return cardId.slice(0, -2);
      }
      return cardId;
    };

    const firstBaseId = getBaseId(first);
    const secondBaseId = getBaseId(second);

    // Cards match if they have the same base ID (but different suffixes)
    const isMatch = firstBaseId === secondBaseId && first !== second;

    if (isMatch) {
      // Match found!
      const newMatchedPairs: string[][] = [...state.matchedPairs, [first, second]];
      const newScore = state.score + 100;

      // Check if game is complete
      const totalPairs = state.cardIds.length / 2;
      const isComplete = newMatchedPairs.length === totalPairs;

      set({
        matchedPairs: newMatchedPairs,
        score: newScore,
        flippedCards: [],
        isComplete,
        endTime: isComplete ? Date.now() : null,
      });
    } else {
      // No match, flip cards back
      set({ flippedCards: [] });
    }
  },

  resetGame: () => {
    const state = get();
    set({
      flippedCards: [],
      matchedPairs: [],
      attempts: 0,
      score: 0,
      isComplete: false,
      startTime: null,
      endTime: null,
      resetCount: state.resetCount + 1, // Increment to trigger card re-shuffle
    });

    // Re-shuffle cards if we have them
    if (state.cardIds.length > 0) {
      const shuffled = [...state.cardIds].sort(() => Math.random() - 0.5);
      set({ cardIds: shuffled });
    }
  },

  isCardFlipped: (cardId) => {
    return get().flippedCards.includes(cardId);
  },

  isCardMatched: (cardId) => {
    return get().matchedPairs.some(
      (pair) => pair.includes(cardId)
    );
  },

  activate: () => {
    set({ isActive: true });
  },

  deactivate: () => {
    set({ ...INITIAL_STATE, isActive: false });
  },

  setDifficulty: (difficulty) => {
    set({ difficulty });
  },

  setPairCount: (count) => {
    set({ pairCount: count });
  },
}));
