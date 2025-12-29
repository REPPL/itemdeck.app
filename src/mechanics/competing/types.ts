/**
 * Type definitions for Competing (Top Trumps) mechanic.
 *
 * A card-versus-card stat comparison game where players compete
 * against a CPU opponent by selecting stats to compare.
 */

import type { MechanicState } from "../types";

/**
 * Numeric field information for stat comparison.
 */
export interface NumericFieldInfo {
  /** Field key in card data */
  key: string;
  /** Human-readable label */
  label: string;
  /** Minimum value across all cards */
  min: number;
  /** Maximum value across all cards */
  max: number;
  /** Whether higher values are better (default: true) */
  higherIsBetter: boolean;
}

/**
 * Card data representation for the game.
 */
export type CardData = Record<string, unknown>;

/**
 * Game phase states.
 */
export type GamePhase =
  | "setup" // Preparing game
  | "player_select" // Player choosing stat
  | "cpu_select" // CPU is thinking/choosing stat
  | "cpu_reveal" // CPU has chosen, waiting for player confirmation
  | "reveal" // Showing comparison
  | "collecting" // Animating card collection
  | "round_end" // Brief pause between rounds
  | "game_over"; // Game complete

/**
 * Difficulty levels for AI opponent.
 */
export type Difficulty = "simple" | "medium" | "hard";

/**
 * Round result after comparison.
 */
export interface RoundResult {
  /** Winner of the round */
  winner: "player" | "cpu" | "tie";
  /** Player's stat value */
  playerValue: number;
  /** CPU's stat value */
  cpuValue: number;
  /** Stat that was compared */
  stat: string;
  /** Number of cards won (including tie pile) */
  cardsWon: number;
}

/**
 * Game context for AI strategies.
 */
export interface GameContext {
  /** Current round number */
  round: number;
  /** Player's deck size */
  playerDeckSize: number;
  /** CPU's deck size */
  cpuDeckSize: number;
  /** Number of cards in tie pile */
  tiePileSize: number;
  /** History of player's stat selections */
  playerSelectionHistory: string[];
}

/**
 * Pattern tracker for Hard AI.
 */
export interface PatternTracker {
  /** Record a player stat selection */
  recordSelection: (fieldKey: string) => void;
  /** Predict next player selection */
  predictNextSelection: () => string | null;
  /** Get selection frequency map */
  getSelectionHistory: () => Map<string, number>;
  /** Reset tracking data */
  reset: () => void;
}

/**
 * Game initialisation configuration.
 */
export interface CompetingGameConfig {
  /** All cards in the game */
  cards: CardData[];
  /** Card ID field name */
  idField: string;
  /** Detected numeric fields for comparison */
  numericFields: NumericFieldInfo[];
  /** Error message if game cannot be played */
  errorMessage?: string;
}

/**
 * Competing game state.
 */
export interface CompetingState extends MechanicState {
  /** Whether the mechanic is active */
  isActive: boolean;

  /** Current game phase */
  phase: GamePhase;

  /** AI difficulty level */
  difficulty: Difficulty;

  /** Round limit (0 = no limit, knockout only) */
  roundLimit: RoundLimitOption;

  /** Player's deck (card IDs) */
  playerDeck: string[];

  /** CPU's deck (card IDs) */
  cpuDeck: string[];

  /** Tie pile (card IDs) */
  tiePile: string[];

  /** Current round number */
  currentRound: number;

  /** Whose turn to select stat */
  currentTurn: "player" | "cpu";

  /** Current player card ID */
  playerCard: string | null;

  /** Current CPU card ID */
  cpuCard: string | null;

  /** Selected stat for comparison */
  selectedStat: string | null;

  /** Result of current round */
  roundResult: RoundResult | null;

  /** Rounds won by each player */
  roundsWon: { player: number; cpu: number };

  /** Cards won by each player (total captured) */
  cardsWon: { player: number; cpu: number };

  /** Game start timestamp */
  gameStartedAt: number;

  /** Game end timestamp */
  gameEndedAt: number | null;

  /** Detected numeric fields */
  numericFields: NumericFieldInfo[];

  /** Card data by ID */
  cardData: Record<string, CardData>;

  /** Player selection history for pattern tracking */
  playerSelectionHistory: string[];

  /** Error message if game cannot be played */
  errorMessage: string | null;
}

/**
 * Round limit options.
 */
export const ROUND_LIMIT_OPTIONS = [0, 10, 20, 30, 50] as const;
export type RoundLimitOption = (typeof ROUND_LIMIT_OPTIONS)[number];

/**
 * Get label for round limit option.
 */
export function getRoundLimitLabel(limit: RoundLimitOption): string {
  return limit === 0 ? "Knockout" : `${String(limit)} rounds`;
}

/**
 * Competing mechanic settings.
 */
export interface CompetingSettings {
  /** AI difficulty */
  difficulty: Difficulty;
  /** Round limit (0 = knockout mode) */
  roundLimit: RoundLimitOption;
  /** Show CPU "thinking" animation */
  showCpuThinking: boolean;
  /** Auto-advance to next round */
  autoAdvance: boolean;
}

/**
 * Default settings.
 */
export const DEFAULT_SETTINGS: CompetingSettings = {
  difficulty: "medium",
  roundLimit: 0,
  showCpuThinking: true,
  autoAdvance: true,
};

/**
 * Difficulty descriptions for UI.
 */
export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  simple: "CPU picks randomly. Good for learning.",
  medium: "CPU picks its best stat. A fair challenge.",
  hard: "CPU learns your patterns. Expert mode.",
};
