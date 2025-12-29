/**
 * Memory game state store.
 *
 * Zustand store for tracking memory game state.
 *
 * ## Architecture
 *
 * The memory game uses a state machine approach to handle the complex
 * interactions between card selection, matching, and animations:
 *
 * States:
 * - IDLE: No cards selected, waiting for first pick
 * - FIRST_SELECTED: One card selected, waiting for second pick
 * - CHECKING: Two cards selected, waiting for match check
 * - LOCKED: Temporarily locked during animation/transition
 *
 * The key insight is separating:
 * - Selection state (which cards player has picked)
 * - Visual state (which cards should show as flipped)
 * - Interaction state (whether new clicks are accepted)
 *
 * This prevents race conditions between fast clicks and animations.
 */

import { create } from "zustand";
import type { MechanicState } from "../types";

/**
 * Difficulty levels for Memory Game.
 * Controls how long cards stay visible before flipping back.
 */
export type MemoryDifficulty = "easy" | "medium" | "hard" | "expert" | "extreme";

/**
 * Difficulty settings.
 * - flipDelay: How long to show cards before checking match (ms)
 * - instant: If true, first card flips back immediately (Extreme mode)
 */
/**
 * Flip animation duration in ms (matches config.animation.flipDuration * 1000).
 * Cards need this time to complete their 3D rotation animation.
 */
const FLIP_ANIMATION_DURATION = 600;

/**
 * Scoring constants.
 * - BASE_SCORE: Starting points for each match
 * - TIME_PENALTY_PER_SECOND: Points deducted per second elapsed
 * - Final score is multiplied by pair count
 */
const SCORING = {
  BASE_SCORE: 1000,
  TIME_PENALTY_PER_SECOND: 50,
  MINIMUM_SCORE_PER_MATCH: 100, // Never go below this per match
};

export const DIFFICULTY_SETTINGS: Record<MemoryDifficulty, {
  label: string;
  flipDelay: number;
  instant?: boolean;
  /** For Extreme mode: how long first card stays visible before flipping back */
  firstCardViewTime?: number;
}> = {
  easy: { label: "Easy", flipDelay: 1500 },
  medium: { label: "Medium", flipDelay: 1000 },
  hard: { label: "Hard", flipDelay: 700 },
  expert: { label: "Expert", flipDelay: 500 },
  // Extreme: First card flips, shows briefly, then flips back
  // firstCardViewTime = animation (600ms) + view time (400ms) = 1000ms
  // flipDelay must also account for animation so second card fully shows
  extreme: { label: "Extreme", flipDelay: FLIP_ANIMATION_DURATION + 400, instant: true, firstCardViewTime: 1000 },
};

/**
 * Available pair count options.
 */
export const PAIR_COUNT_OPTIONS = [4, 6, 8, 10, 12] as const;
export type PairCount = (typeof PAIR_COUNT_OPTIONS)[number];

/**
 * Game phase for state machine.
 */
type GamePhase =
  | "idle"           // Waiting for first card
  | "first_selected" // First card picked, waiting for second
  | "checking"       // Two cards picked, checking match
  | "locked";        // Temporarily locked (animation in progress)

/**
 * Memory game state.
 */
export interface MemoryGameState extends MechanicState {
  isActive: boolean;

  /** Current game phase */
  phase: GamePhase;

  /** First selected card (persists until match check completes) */
  firstCard: string | null;

  /** Second selected card (persists until match check completes) */
  secondCard: string | null;

  /**
   * Cards that should visually appear flipped.
   * This is separate from selection to allow visual effects
   * independent of game logic.
   */
  visibleCards: string[];

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

  // Legacy compatibility
  /** @deprecated Use visibleCards instead */
  flippedCards: string[];

  /** @deprecated Use firstCard instead */
  pendingFirstCard: string | null;
}

/**
 * Memory game actions.
 */
interface MemoryGameActions {
  /** Initialise game with card IDs */
  initGame: (cardIds: string[]) => void;

  /** Select a card (player click) */
  selectCard: (cardId: string) => void;

  /** Legacy: Flip a card (alias for selectCard) */
  flipCard: (cardId: string) => void;

  /** Legacy: Check match (no-op, kept for compatibility) */
  checkMatch: () => void;

  /** Reset the game */
  resetGame: () => void;

  /** Check if a card is currently visible (flipped) */
  isCardFlipped: (cardId: string) => boolean;

  /** Check if a card is matched */
  isCardMatched: (cardId: string) => boolean;

  /** Check if a card can be interacted with */
  canSelectCard: (cardId: string) => boolean;

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
  phase: "idle",
  firstCard: null,
  secondCard: null,
  visibleCards: [],
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
  // Legacy
  flippedCards: [],
  pendingFirstCard: null,
};

/**
 * Extract base ID by removing the -a or -b suffix.
 * Cards are duplicated in CardGrid as "original-id-a" and "original-id-b".
 */
function getBaseId(cardId: string): string {
  if (cardId.endsWith("-a") || cardId.endsWith("-b")) {
    return cardId.slice(0, -2);
  }
  return cardId;
}

/**
 * Check if two cards match (same base ID, different instances).
 */
function cardsMatch(first: string, second: string): boolean {
  const firstBaseId = getBaseId(first);
  const secondBaseId = getBaseId(second);
  return firstBaseId === secondBaseId && first !== second;
}

/**
 * Memory game store.
 */
export const useMemoryStore = create<MemoryStore>((set, get) => ({
  ...INITIAL_STATE,

  initGame: (cardIds) => {
    const state = get();

    // If game is complete, don't reset - preserve completion state
    // until user explicitly clicks "Play Again" or settings change
    if (state.isComplete) {
      return;
    }

    // Limit to pairCount setting (pairCount is number of pairs, so *2 for cards)
    const maxCards = state.pairCount * 2;
    const availableCards = Math.min(cardIds.length, maxCards);
    const evenCount = availableCards - (availableCards % 2);
    const gameCards = cardIds.slice(0, evenCount);

    set({
      cardIds: gameCards,
      phase: "idle",
      firstCard: null,
      secondCard: null,
      visibleCards: [],
      matchedPairs: [],
      attempts: 0,
      score: 0,
      isComplete: false,
      startTime: Date.now(),
      endTime: null,
      // Legacy
      flippedCards: [],
      pendingFirstCard: null,
    });
  },

  selectCard: (cardId) => {
    const state = get();
    const settings = DIFFICULTY_SETTINGS[state.difficulty];
    const isExtremeMode = settings.instant === true;

    // Guard: Must be active
    if (!state.isActive) return;

    // Guard: Can't select already matched cards
    if (state.isCardMatched(cardId)) return;

    // Guard: Can't select already selected card
    if (state.firstCard === cardId || state.secondCard === cardId) return;

    // Guard: Can't select already visible card (except during locked phase interruption)
    if (state.phase !== "locked" && state.visibleCards.includes(cardId)) return;

    // Start timer on first selection
    if (!state.startTime) {
      set({ startTime: Date.now() });
    }

    // Handle interruption during locked phase (third card click)
    // Parallel animation: new card flips while previous cards flip back
    if (state.phase === "locked") {
      const first = state.firstCard!;
      const second = state.secondCard!;

      // Process the pending match immediately
      const isMatch = cardsMatch(first, second);

      if (isMatch) {
        // Match found - add to matched pairs
        const newMatchedPairs = [...state.matchedPairs, [first, second]];
        const totalPairs = state.cardIds.length / 2;
        const isComplete = newMatchedPairs.length === totalPairs;

        // Time-based scoring
        const elapsedSeconds = state.startTime
          ? Math.floor((Date.now() - state.startTime) / 1000)
          : 0;
        const timeBasedScore = Math.max(
          SCORING.MINIMUM_SCORE_PER_MATCH,
          SCORING.BASE_SCORE - (elapsedSeconds * SCORING.TIME_PENALTY_PER_SECOND)
        );

        let newScore = state.score + timeBasedScore;
        if (isComplete) {
          newScore = newScore * totalPairs;
        }

        // If game is complete, don't start new selection
        if (isComplete) {
          set({
            phase: "idle",
            firstCard: null,
            secondCard: null,
            visibleCards: [],
            matchedPairs: newMatchedPairs,
            score: newScore,
            isComplete: true,
            endTime: Date.now(),
            flippedCards: [],
            pendingFirstCard: null,
          });
          return;
        }

        // Parallel animation: show new card immediately while matched cards stay
        // The matched cards won't flip back since they're now in matchedPairs
        set({
          phase: "first_selected",
          firstCard: cardId,
          secondCard: null,
          visibleCards: [cardId], // New card flips up
          matchedPairs: newMatchedPairs, // Previous cards marked as matched
          score: newScore,
          flippedCards: [cardId],
          pendingFirstCard: null,
        });
      } else {
        // No match - show all three cards briefly for parallel animation
        // New card flips up while previous two flip back simultaneously
        set({
          phase: "first_selected",
          firstCard: cardId,
          secondCard: null,
          // Show new card (flips up); remove previous cards (flip back in parallel)
          visibleCards: [cardId],
          flippedCards: [cardId],
          pendingFirstCard: null,
        });
      }

      // Handle Extreme mode hide timer for the new first card
      if (isExtremeMode) {
        const hideDelay = settings.firstCardViewTime ?? (FLIP_ANIMATION_DURATION + 400);
        setTimeout(() => {
          const current = get();
          if (current.phase === "first_selected" && current.firstCard === cardId) {
            set({
              visibleCards: [],
              flippedCards: [],
            });
          }
        }, hideDelay);
      }
      return;
    }

    // Handle based on current phase
    if (state.phase === "idle") {
      // First card selection
      if (isExtremeMode) {
        // Extreme mode: Show card briefly, then hide but remember it
        set({
          phase: "first_selected",
          firstCard: cardId,
          visibleCards: [cardId],
          flippedCards: [cardId], // Legacy
          pendingFirstCard: cardId, // Legacy
        });

        // Hide after flip animation completes + brief view time
        const hideDelay = settings.firstCardViewTime ?? (FLIP_ANIMATION_DURATION + 400);
        setTimeout(() => {
          const current = get();
          // Only hide if we're still waiting for second card
          if (current.phase === "first_selected" && current.firstCard === cardId) {
            set({
              visibleCards: [],
              flippedCards: [], // Legacy
            });
          }
        }, hideDelay);
      } else {
        // Normal mode: Show card and wait for second
        set({
          phase: "first_selected",
          firstCard: cardId,
          visibleCards: [cardId],
          flippedCards: [cardId], // Legacy
        });
      }
    } else if (state.phase === "first_selected") {
      // Second card selection - lock but allow interruption
      const first = state.firstCard!;

      set({
        phase: "locked",
        secondCard: cardId,
        visibleCards: isExtremeMode ? [cardId] : [first, cardId],
        attempts: state.attempts + 1,
        flippedCards: isExtremeMode ? [cardId] : [first, cardId], // Legacy
      });

      // Check match after delay (can be interrupted by third card click)
      setTimeout(() => {
        const current = get();

        // Safety: Check if we're still in the expected locked state
        // If phase changed (e.g., interrupted by third card), skip
        if (current.phase !== "locked") return;
        if (current.firstCard !== first || current.secondCard !== cardId) return;

        const isMatch = cardsMatch(first, cardId);

        if (isMatch) {
          // Match found!
          const newMatchedPairs = [...current.matchedPairs, [first, cardId]];
          const totalPairs = current.cardIds.length / 2;
          const isComplete = newMatchedPairs.length === totalPairs;

          // Time-based scoring
          const elapsedSeconds = current.startTime
            ? Math.floor((Date.now() - current.startTime) / 1000)
            : 0;
          const timeBasedScore = Math.max(
            SCORING.MINIMUM_SCORE_PER_MATCH,
            SCORING.BASE_SCORE - (elapsedSeconds * SCORING.TIME_PENALTY_PER_SECOND)
          );

          let newScore = current.score + timeBasedScore;
          if (isComplete) {
            newScore = newScore * totalPairs;
          }

          set({
            phase: "idle",
            firstCard: null,
            secondCard: null,
            visibleCards: [],
            matchedPairs: newMatchedPairs,
            score: newScore,
            isComplete,
            endTime: isComplete ? Date.now() : null,
            flippedCards: [],
            pendingFirstCard: null,
          });
        } else {
          // No match - flip cards back
          set({
            phase: "idle",
            firstCard: null,
            secondCard: null,
            visibleCards: [],
            flippedCards: [],
            pendingFirstCard: null,
          });
        }
      }, settings.flipDelay);
    }
  },

  // Legacy alias
  flipCard: (cardId) => {
    get().selectCard(cardId);
  },

  // Legacy compatibility - no longer used internally
  checkMatch: () => {
    // No-op: Match checking is now integrated into selectCard
  },

  resetGame: () => {
    const state = get();
    const shuffled = state.cardIds.length > 0
      ? [...state.cardIds].sort(() => Math.random() - 0.5)
      : [];

    set({
      phase: "idle",
      firstCard: null,
      secondCard: null,
      visibleCards: [],
      matchedPairs: [],
      attempts: 0,
      score: 0,
      isComplete: false,
      startTime: null,
      endTime: null,
      cardIds: shuffled,
      resetCount: state.resetCount + 1,
      // Legacy
      flippedCards: [],
      pendingFirstCard: null,
    });
  },

  isCardFlipped: (cardId) => {
    const state = get();
    return state.visibleCards.includes(cardId);
  },

  isCardMatched: (cardId) => {
    return get().matchedPairs.some((pair) => pair.includes(cardId));
  },

  canSelectCard: (cardId) => {
    const state = get();

    if (!state.isActive) return false;
    if (state.phase === "locked" || state.phase === "checking") return false;
    if (state.isCardMatched(cardId)) return false;
    if (state.firstCard === cardId) return false;
    if (state.visibleCards.includes(cardId)) return false;

    return true;
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
