/**
 * Memory game settings types.
 *
 * Type definitions for Memory mechanic settings (ADR-020).
 */

import type { MemoryDifficulty, PairCount } from "./store";

/**
 * Memory game settings.
 */
export interface MemorySettings {
  /** Difficulty level */
  difficulty: MemoryDifficulty;
  /** Number of pairs to play with */
  pairCount: PairCount;
}
