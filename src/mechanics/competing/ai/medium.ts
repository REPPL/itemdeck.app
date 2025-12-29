/**
 * Medium AI strategy for Competing mechanic.
 *
 * Selects the stat where the CPU card has the highest relative value.
 * A fair challenge that plays optimally based on current card.
 */

import type { AIStrategy } from "./types";
import type { CardData, NumericFieldInfo, GameContext } from "../types";
import { getCardValue, getRelativeStrength } from "../utils";

/**
 * Medium AI: Select highest relative value stat.
 */
export const mediumAI: AIStrategy = {
  id: "medium",
  name: "Medium",

  selectStat(
    cpuCard: CardData,
    numericFields: NumericFieldInfo[],
    _gameContext: GameContext
  ): string {
    if (numericFields.length === 0) {
      throw new Error("No numeric fields available for selection");
    }

    let bestField: NumericFieldInfo | null = null;
    let bestStrength = -1;

    for (const field of numericFields) {
      const value = getCardValue(cpuCard, field.key);
      if (value === null) {
        continue;
      }

      const strength = getRelativeStrength(value, field);
      if (strength > bestStrength) {
        bestStrength = strength;
        bestField = field;
      }
    }

    // Fallback to first field if no valid values found
    if (!bestField) {
      const firstField = numericFields[0];
      if (!firstField) {
        throw new Error("No numeric fields available for selection");
      }
      return firstField.key;
    }

    return bestField.key;
  },
};
