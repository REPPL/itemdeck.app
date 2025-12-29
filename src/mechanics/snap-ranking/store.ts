/**
 * Zustand store for Snap Ranking mechanic.
 *
 * A field value guessing game where players guess the value of a hidden
 * field for each card. Supports numeric (distance scoring) and categorical
 * (exact match) fields.
 */

import { create } from "zustand";
import { shuffle } from "@/utils/shuffle";
import type {
  GuessValue,
  CardGuess,
  GameConfig,
  SnapRankingState,
  SnapRankingSettings,
} from "./types";
import {
  DEFAULT_SETTINGS,
  NUMERIC_SCORING,
  calculateScore,
} from "./types";

/**
 * Extended store state with actions.
 */
interface SnapRankingStore extends SnapRankingState, SnapRankingSettings {
  // Lifecycle
  activate: () => void;
  deactivate: () => void;
  resetGame: () => void;
  initGame: (config: GameConfig) => void;

  // Game actions
  flipCurrentCard: () => void;
  submitGuess: (guess: GuessValue) => void;
  getCurrentCardId: () => string | null;
  isGameComplete: () => boolean;
  getProgress: () => { current: number; total: number };

  // Results
  getTotalScore: () => number;
  getMaxPossibleScore: () => number;
  getScoreBreakdown: () => { exact: number; close: number; wrong: number };
  getAverageGuessTime: () => number;
  getTotalTime: () => number;

  // Settings
  setShowTimer: (value: boolean) => void;
  setCardCount: (value: number) => void;
}

/**
 * Initial state.
 */
const INITIAL_STATE: SnapRankingState = {
  isActive: false,
  guessField: "",
  uniqueValues: [],
  valueType: "categorical",
  cardIds: [],
  cardValues: {},
  currentIndex: 0,
  guesses: [],
  cardShownAt: 0,
  gameStartedAt: 0,
  gameEndedAt: null,
  resetCount: 0,
  isCurrentCardFlipped: false,
  errorMessage: null,
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
    });
  },

  deactivate: () => {
    set({
      isActive: false,
      isCurrentCardFlipped: false,
    });
  },

  resetGame: () => {
    const { cardIds, resetCount } = get();
    const shuffled = shuffle([...cardIds]);
    set({
      cardIds: shuffled,
      currentIndex: 0,
      guesses: [],
      cardShownAt: 0,
      gameStartedAt: Date.now(),
      gameEndedAt: null,
      resetCount: resetCount + 1,
      isCurrentCardFlipped: false,
      errorMessage: null,
    });
  },

  initGame: (config: GameConfig) => {
    const state = get();

    // Handle error state
    if (config.errorMessage || config.cards.length === 0) {
      set({
        ...INITIAL_STATE,
        isActive: state.isActive, // Preserve current active state
        guessField: config.guessField,
        errorMessage: config.errorMessage ?? "No cards available to play.",
      });
      return;
    }

    // Build card values map
    const cardValues: Record<string, GuessValue> = {};
    for (const card of config.cards) {
      cardValues[card.id] = card.value;
    }

    // Shuffle card IDs
    let shuffledIds = shuffle(config.cards.map((c) => c.id));

    // Apply card count limit if set (0 = all cards)
    if (state.cardCount > 0 && shuffledIds.length > state.cardCount) {
      shuffledIds = shuffledIds.slice(0, state.cardCount);
    }

    set({
      isActive: state.isActive, // Preserve current active state (avoid race with onActivate)
      guessField: config.guessField,
      uniqueValues: config.uniqueValues,
      valueType: config.valueType,
      cardIds: shuffledIds,
      cardValues,
      currentIndex: 0,
      guesses: [],
      cardShownAt: 0,
      gameStartedAt: 0,
      gameEndedAt: null,
      isCurrentCardFlipped: false,
      errorMessage: null,
    });
  },

  // Game actions
  flipCurrentCard: () => {
    const state = get();
    if (!state.isActive || state.isCurrentCardFlipped) return;
    if (state.currentIndex >= state.cardIds.length) return;

    const now = Date.now();

    // Start timer on first card flip
    const gameStartedAt = state.gameStartedAt === 0 ? now : state.gameStartedAt;

    set({
      isCurrentCardFlipped: true,
      cardShownAt: now,
      gameStartedAt,
    });
  },

  submitGuess: (guess: GuessValue) => {
    const state = get();
    if (!state.isActive || !state.isCurrentCardFlipped) return;
    if (state.currentIndex >= state.cardIds.length) return;

    const cardId = state.cardIds[state.currentIndex];
    if (!cardId) return;

    const actualValue = state.cardValues[cardId];
    if (actualValue === undefined) return;

    const now = Date.now();
    const score = calculateScore(
      guess,
      actualValue,
      state.valueType,
      state.uniqueValues
    );

    const cardGuess: CardGuess = {
      cardId,
      guess,
      actualValue,
      score,
      guessedAt: now,
      timeToGuess: now - state.cardShownAt,
    };

    const newGuesses = [...state.guesses, cardGuess];
    const newIndex = state.currentIndex + 1;
    const isComplete = newIndex >= state.cardIds.length;

    set({
      guesses: newGuesses,
      currentIndex: newIndex,
      isCurrentCardFlipped: false, // Reset for next card
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
  getTotalScore: () => {
    const { guesses } = get();
    return guesses.reduce((sum, g) => sum + g.score, 0);
  },

  getMaxPossibleScore: () => {
    const { cardIds } = get();
    const maxPerCard = NUMERIC_SCORING.exactMatch; // Same for both types
    return cardIds.length * maxPerCard;
  },

  getScoreBreakdown: () => {
    const { guesses, valueType, uniqueValues } = get();
    let exact = 0;
    let close = 0;
    let wrong = 0;

    for (const guess of guesses) {
      if (guess.guess === guess.actualValue) {
        exact++;
      } else if (valueType === "numeric") {
        // Check if close (within 2 positions)
        const guessIndex = uniqueValues.indexOf(guess.guess);
        const actualIndex = uniqueValues.indexOf(guess.actualValue);
        const distance = Math.abs(guessIndex - actualIndex);
        if (distance <= 2) {
          close++;
        } else {
          wrong++;
        }
      } else {
        wrong++;
      }
    }

    return { exact, close, wrong };
  },

  getAverageGuessTime: () => {
    const { guesses } = get();
    if (guesses.length === 0) return 0;
    const total = guesses.reduce((sum, g) => sum + g.timeToGuess, 0);
    return total / guesses.length;
  },

  getTotalTime: () => {
    const { gameStartedAt, gameEndedAt, isActive } = get();
    if (!gameStartedAt) return 0;
    const endTime = gameEndedAt ?? (isActive ? Date.now() : gameStartedAt);
    return endTime - gameStartedAt;
  },

  // Settings
  setShowTimer: (value: boolean) => {
    set({ showTimer: value });
  },

  setCardCount: (value: number) => {
    set({ cardCount: value as SnapRankingSettings["cardCount"] });
  },
}));
