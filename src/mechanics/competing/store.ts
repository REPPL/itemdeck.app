/**
 * Zustand store for Competing (Top Trumps) mechanic.
 *
 * Manages game state for card-versus-card stat comparison battles.
 */

import { create } from "zustand";
import { shuffle } from "@/utils/shuffle";
import type {
  CompetingState,
  CompetingSettings,
  CompetingGameConfig,
  GamePhase,
  Difficulty,
  RoundResult,
  CardData,
  GameContext,
  RoundLimitOption,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { getCardValue, compareValues } from "./utils";
import { getAIStrategy, resetPatternTracker, recordPlayerSelection } from "./ai";

/**
 * Timeout IDs for cleanup - stored outside store to avoid serialisation issues.
 */
let pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

/**
 * Clear all pending timeouts.
 */
function clearPendingTimeouts(): void {
  for (const id of pendingTimeouts) {
    clearTimeout(id);
  }
  pendingTimeouts = [];
}

/**
 * Register a timeout for later cleanup.
 */
function registerTimeout(id: ReturnType<typeof setTimeout>): void {
  pendingTimeouts.push(id);
}

/**
 * Extended store state with actions.
 */
interface CompetingStore extends CompetingState, CompetingSettings {
  // Lifecycle
  activate: () => void;
  deactivate: () => void;
  resetGame: () => void;
  initGame: (config: CompetingGameConfig) => void;

  // Game actions
  selectStat: (fieldKey: string) => void;
  cpuSelectStat: () => void;
  confirmCpuSelection: () => void;
  revealAndCompare: () => void;
  collectCards: () => void;
  nextRound: () => void;

  // Settings
  setDifficulty: (difficulty: Difficulty) => void;
  setRoundLimit: (limit: RoundLimitOption) => void;
  setShowCpuThinking: (show: boolean) => void;
  setAutoAdvance: (auto: boolean) => void;

  // Queries
  getWinner: () => "player" | "cpu" | "draw" | null;
  isGameOver: () => boolean;
  getProgress: () => { playerCards: number; cpuCards: number; round: number };
  getGameContext: () => GameContext;
}

/**
 * Initial state.
 */
const INITIAL_STATE: CompetingState = {
  isActive: false,
  phase: "setup",
  difficulty: DEFAULT_SETTINGS.difficulty,
  roundLimit: DEFAULT_SETTINGS.roundLimit,
  playerDeck: [],
  cpuDeck: [],
  tiePile: [],
  currentRound: 0,
  currentTurn: "player",
  playerCard: null,
  cpuCard: null,
  selectedStat: null,
  roundResult: null,
  roundsWon: { player: 0, cpu: 0 },
  cardsWon: { player: 0, cpu: 0 },
  gameStartedAt: 0,
  gameEndedAt: null,
  numericFields: [],
  cardData: {},
  playerSelectionHistory: [],
  errorMessage: null,
};

/**
 * Competing store.
 */
export const useCompetingStore = create<CompetingStore>((set, get) => ({
  // Initial state
  ...INITIAL_STATE,
  ...DEFAULT_SETTINGS,

  // Lifecycle
  activate: () => {
    set({ isActive: true });
  },

  deactivate: () => {
    clearPendingTimeouts();
    set({ isActive: false, phase: "setup" });
  },

  resetGame: () => {
    clearPendingTimeouts();
    const { numericFields, cardData, difficulty, roundLimit, showCpuThinking, autoAdvance } = get();

    // Reset pattern tracker for new game
    resetPatternTracker();

    // Get all card IDs and shuffle
    const cardIds = Object.keys(cardData);
    const shuffled = shuffle(cardIds);

    // Deal cards evenly
    const midpoint = Math.floor(shuffled.length / 2);
    const playerDeck = shuffled.slice(0, midpoint);
    const cpuDeck = shuffled.slice(midpoint, midpoint * 2);

    // Odd card goes to tie pile
    const tiePile = shuffled.length % 2 !== 0 ? shuffled.slice(-1) : [];

    // Draw first cards
    const playerCard = playerDeck.shift() ?? null;
    const cpuCard = cpuDeck.shift() ?? null;

    set({
      ...INITIAL_STATE,
      isActive: true,
      phase: playerCard && cpuCard ? "player_select" : "game_over",
      numericFields,
      cardData,
      difficulty,
      roundLimit,
      showCpuThinking,
      autoAdvance,
      playerDeck,
      cpuDeck,
      tiePile,
      playerCard,
      cpuCard,
      currentRound: 1,
      currentTurn: "player",
      gameStartedAt: Date.now(),
    });
  },

  initGame: (config: CompetingGameConfig) => {
    const state = get();

    // Check minimum card count
    if (config.cards.length < 4) {
      set({
        ...INITIAL_STATE,
        isActive: state.isActive,
        difficulty: state.difficulty,
        roundLimit: state.roundLimit,
        showCpuThinking: state.showCpuThinking,
        autoAdvance: state.autoAdvance,
        errorMessage: config.errorMessage ?? "Need at least 4 cards to play.",
        numericFields: config.numericFields,
      });
      return;
    }

    if (config.numericFields.length === 0) {
      set({
        ...INITIAL_STATE,
        isActive: state.isActive,
        difficulty: state.difficulty,
        roundLimit: state.roundLimit,
        showCpuThinking: state.showCpuThinking,
        autoAdvance: state.autoAdvance,
        errorMessage: "No numeric fields found for stat comparison.",
        numericFields: [],
      });
      return;
    }

    // Build card data map, filtering out cards with missing values
    const cardData: Record<string, CardData> = {};
    for (const card of config.cards) {
      const id = card[config.idField];
      if (typeof id !== "string") continue;

      // Check if card has valid values for ALL numeric fields
      const hasAllValues = config.numericFields.every((field) => {
        const value = getCardValue(card, field.key);
        return value !== null;
      });

      if (hasAllValues) {
        cardData[id] = card;
      }
    }

    // Check if we have enough valid cards
    const validCardCount = Object.keys(cardData).length;
    if (validCardCount < 4) {
      set({
        ...INITIAL_STATE,
        isActive: state.isActive,
        difficulty: state.difficulty,
        roundLimit: state.roundLimit,
        showCpuThinking: state.showCpuThinking,
        autoAdvance: state.autoAdvance,
        errorMessage: `Only ${String(validCardCount)} cards have all stat values. Need at least 4.`,
        numericFields: config.numericFields,
      });
      return;
    }

    // Reset pattern tracker for new game
    resetPatternTracker();

    // Shuffle and deal
    const cardIds = Object.keys(cardData);
    const shuffled = shuffle(cardIds);

    const midpoint = Math.floor(shuffled.length / 2);
    const playerDeck = shuffled.slice(0, midpoint);
    const cpuDeck = shuffled.slice(midpoint, midpoint * 2);
    const tiePile = shuffled.length % 2 !== 0 ? shuffled.slice(-1) : [];

    // Draw first cards
    const playerCard = playerDeck.shift() ?? null;
    const cpuCard = cpuDeck.shift() ?? null;

    set({
      ...INITIAL_STATE,
      isActive: state.isActive,
      phase: playerCard && cpuCard ? "player_select" : "game_over",
      numericFields: config.numericFields,
      cardData,
      difficulty: state.difficulty,
      roundLimit: state.roundLimit,
      showCpuThinking: state.showCpuThinking,
      autoAdvance: state.autoAdvance,
      playerDeck,
      cpuDeck,
      tiePile,
      playerCard,
      cpuCard,
      currentRound: 1,
      currentTurn: "player",
      gameStartedAt: Date.now(),
    });
  },

  // Game actions
  selectStat: (fieldKey: string) => {
    const state = get();
    if (!state.isActive || state.phase !== "player_select") return;

    // Record selection for pattern tracking (used by Hard AI)
    recordPlayerSelection(fieldKey);

    set({
      selectedStat: fieldKey,
      playerSelectionHistory: [...state.playerSelectionHistory, fieldKey],
      phase: "reveal",
    });

    // Auto-trigger reveal and compare
    const timeoutId = setTimeout(() => {
      get().revealAndCompare();
    }, 500);
    registerTimeout(timeoutId);
  },

  cpuSelectStat: () => {
    const state = get();
    if (!state.isActive || state.phase !== "cpu_select") return;
    if (!state.cpuCard) return;

    const cpuCardData = state.cardData[state.cpuCard];
    if (!cpuCardData) return;

    // Get AI strategy based on difficulty
    const ai = getAIStrategy(state.difficulty);
    const gameContext = get().getGameContext();

    // CPU selects stat and waits for player confirmation
    const selectedStat = ai.selectStat(cpuCardData, state.numericFields, gameContext);

    set({
      selectedStat,
      phase: "cpu_reveal", // Wait for player to confirm
    });
  },

  confirmCpuSelection: () => {
    const state = get();
    if (!state.isActive || state.phase !== "cpu_reveal") return;
    if (!state.selectedStat) return;

    set({ phase: "reveal" });

    // Auto-trigger reveal and compare after short delay
    const timeoutId = setTimeout(() => {
      get().revealAndCompare();
    }, 300);
    registerTimeout(timeoutId);
  },

  revealAndCompare: () => {
    const state = get();
    if (state.phase !== "reveal") return;
    if (!state.playerCard || !state.cpuCard || !state.selectedStat) return;

    const playerCardData = state.cardData[state.playerCard];
    const cpuCardData = state.cardData[state.cpuCard];
    if (!playerCardData || !cpuCardData) return;

    const field = state.numericFields.find((f) => f.key === state.selectedStat);
    if (!field) return;

    const playerValue = getCardValue(playerCardData, field.key);
    const cpuValue = getCardValue(cpuCardData, field.key);

    if (playerValue === null || cpuValue === null) {
      // Handle missing values - treat as tie
      const result: RoundResult = {
        winner: "tie",
        playerValue: playerValue ?? 0,
        cpuValue: cpuValue ?? 0,
        stat: field.key,
        cardsWon: 0,
      };
      set({ roundResult: result, phase: "collecting" });
      return;
    }

    const comparison = compareValues(playerValue, cpuValue, field);
    const winner: "player" | "cpu" | "tie" =
      comparison === 1 ? "player" : comparison === -1 ? "cpu" : "tie";

    // Calculate cards won (both battle cards + tie pile)
    const cardsWon = winner !== "tie" ? 2 + state.tiePile.length : 0;

    const result: RoundResult = {
      winner,
      playerValue,
      cpuValue,
      stat: field.key,
      cardsWon,
    };

    set({
      roundResult: result,
      phase: "collecting",
    });

    // Auto-trigger collect after delay
    const timeoutId = setTimeout(() => {
      get().collectCards();
    }, 1500);
    registerTimeout(timeoutId);
  },

  collectCards: () => {
    const state = get();
    if (state.phase !== "collecting") return;
    if (!state.playerCard || !state.cpuCard || !state.roundResult) return;

    const { winner } = state.roundResult;
    // Copy deck arrays for modification
    const playerDeck = [...state.playerDeck];
    const cpuDeck = [...state.cpuDeck];
    let tiePile = [...state.tiePile];
    const roundsWon = { ...state.roundsWon };
    const cardsWon = { ...state.cardsWon };

    const battleCards = [state.playerCard, state.cpuCard];
    const allWonCards = [...battleCards, ...tiePile];

    if (winner === "player") {
      // Player wins - add cards to bottom of player deck
      playerDeck.push(...shuffle(allWonCards));
      tiePile = [];
      roundsWon.player++;
      cardsWon.player += allWonCards.length;
    } else if (winner === "cpu") {
      // CPU wins - add cards to bottom of CPU deck
      cpuDeck.push(...shuffle(allWonCards));
      tiePile = [];
      roundsWon.cpu++;
      cardsWon.cpu += allWonCards.length;
    } else {
      // Tie - add battle cards to tie pile
      tiePile = [...tiePile, ...battleCards];
    }

    set({
      playerDeck,
      cpuDeck,
      tiePile,
      roundsWon,
      cardsWon,
      phase: "round_end",
    });

    // Note: Auto-advance is now handled by the RoundResultOverlay component
    // which shows feedback and auto-dismisses after 2 seconds
  },

  nextRound: () => {
    const state = get();
    if (state.phase !== "round_end") return;

    const { currentRound, roundLimit } = state;
    let { playerDeck, cpuDeck, currentTurn } = state;

    // Draw next cards
    playerDeck = [...playerDeck];
    cpuDeck = [...cpuDeck];
    const playerCard = playerDeck.shift() ?? null;
    const cpuCard = cpuDeck.shift() ?? null;

    // Check win conditions
    const nextRound = currentRound + 1;

    // Knockout: one player has no cards
    if (!playerCard || !cpuCard) {
      set({
        playerDeck,
        cpuDeck,
        playerCard: null,
        cpuCard: null,
        currentRound: nextRound,
        phase: "game_over",
        gameEndedAt: Date.now(),
      });
      return;
    }

    // Round limit reached
    if (roundLimit > 0 && nextRound > roundLimit) {
      set({
        playerDeck,
        cpuDeck,
        playerCard: null,
        cpuCard: null,
        currentRound: nextRound,
        phase: "game_over",
        gameEndedAt: Date.now(),
      });
      return;
    }

    // Alternate turns (winner of previous round selects next, or alternate on tie)
    const prevWinner = state.roundResult?.winner;
    if (prevWinner === "player") {
      currentTurn = "player";
    } else if (prevWinner === "cpu") {
      currentTurn = "cpu";
    } else {
      // Tie - alternate
      currentTurn = currentTurn === "player" ? "cpu" : "player";
    }

    const nextPhase: GamePhase = currentTurn === "player" ? "player_select" : "cpu_select";

    set({
      playerDeck,
      cpuDeck,
      playerCard,
      cpuCard,
      currentRound: nextRound,
      currentTurn,
      selectedStat: null,
      roundResult: null,
      phase: nextPhase,
    });

    // If CPU turn, trigger CPU selection after short delay
    if (currentTurn === "cpu") {
      const timeoutId = setTimeout(() => {
        get().cpuSelectStat();
      }, 500);
      registerTimeout(timeoutId);
    }
  },

  // Settings
  setDifficulty: (difficulty: Difficulty) => {
    set({ difficulty });
  },

  setRoundLimit: (limit: RoundLimitOption) => {
    set({ roundLimit: limit });
  },

  setShowCpuThinking: (show: boolean) => {
    set({ showCpuThinking: show });
  },

  setAutoAdvance: (auto: boolean) => {
    set({ autoAdvance: auto });
  },

  // Queries
  getWinner: () => {
    const state = get();
    if (state.phase !== "game_over") return null;

    // Count total cards (deck + current card if any)
    const playerTotal = state.playerDeck.length + (state.playerCard ? 1 : 0);
    const cpuTotal = state.cpuDeck.length + (state.cpuCard ? 1 : 0);

    // Also count captured cards
    if (playerTotal === 0 && cpuTotal === 0) {
      // Both ran out - use rounds won
      if (state.roundsWon.player > state.roundsWon.cpu) return "player";
      if (state.roundsWon.cpu > state.roundsWon.player) return "cpu";
      return "draw";
    }

    if (playerTotal > cpuTotal) return "player";
    if (cpuTotal > playerTotal) return "cpu";

    // Equal cards - use rounds won
    if (state.roundsWon.player > state.roundsWon.cpu) return "player";
    if (state.roundsWon.cpu > state.roundsWon.player) return "cpu";

    return "draw";
  },

  isGameOver: () => {
    return get().phase === "game_over";
  },

  getProgress: () => {
    const state = get();
    return {
      playerCards: state.playerDeck.length + (state.playerCard ? 1 : 0),
      cpuCards: state.cpuDeck.length + (state.cpuCard ? 1 : 0),
      round: state.currentRound,
    };
  },

  getGameContext: (): GameContext => {
    const state = get();
    return {
      round: state.currentRound,
      playerDeckSize: state.playerDeck.length + (state.playerCard ? 1 : 0),
      cpuDeckSize: state.cpuDeck.length + (state.cpuCard ? 1 : 0),
      tiePileSize: state.tiePile.length,
      playerSelectionHistory: state.playerSelectionHistory,
    };
  },
}));
