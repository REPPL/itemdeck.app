/**
 * AI type definitions for Competing mechanic.
 */

import type { CardData, NumericFieldInfo, GameContext } from "../types";

/**
 * AI strategy interface.
 */
export interface AIStrategy {
  /** Strategy identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /**
   * Select a stat to compare.
   *
   * @param cpuCard - The CPU's current card data
   * @param numericFields - Available numeric fields for comparison
   * @param gameContext - Current game context
   * @returns The field key to use for comparison
   */
  selectStat(
    cpuCard: CardData,
    numericFields: NumericFieldInfo[],
    gameContext: GameContext
  ): string;
}
