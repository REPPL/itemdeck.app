/**
 * Simple AI strategy for Competing mechanic.
 *
 * Randomly selects a stat from available options.
 * Good for beginners and unpredictable gameplay.
 */

import type { AIStrategy } from "./types";
import type { CardData, NumericFieldInfo, GameContext } from "../types";

/**
 * Simple AI: Random stat selection.
 */
export const simpleAI: AIStrategy = {
  id: "simple",
  name: "Simple",

  selectStat(
    _cpuCard: CardData,
    numericFields: NumericFieldInfo[],
    _gameContext: GameContext
  ): string {
    if (numericFields.length === 0) {
      throw new Error("No numeric fields available for selection");
    }

    // Randomly select a field
    const randomIndex = Math.floor(Math.random() * numericFields.length);
    const field = numericFields[randomIndex];
    if (!field) {
      throw new Error("Failed to select a field");
    }
    return field.key;
  },
};
