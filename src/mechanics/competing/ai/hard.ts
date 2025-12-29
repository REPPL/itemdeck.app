/**
 * Hard AI strategy for Competing mechanic.
 *
 * Tracks player's stat selection patterns and exploits weaknesses.
 * Falls back to Medium strategy when uncertain.
 */

import type { AIStrategy } from "./types";
import type { CardData, NumericFieldInfo, GameContext, PatternTracker } from "../types";
import { getCardValue, getRelativeStrength } from "../utils";
import { mediumAI } from "./medium";

/**
 * Exponential decay factor for weighting recent selections.
 * Higher values mean more emphasis on recent choices.
 */
const DECAY_FACTOR = 0.8;

/**
 * Minimum confidence threshold for prediction.
 * If no pattern is strong enough, fall back to medium strategy.
 */
const PREDICTION_THRESHOLD = 0.3;

/**
 * Create a pattern tracker instance.
 */
export function createPatternTracker(): PatternTracker {
  const selectionCounts = new Map<string, number>();
  const weightedCounts = new Map<string, number>();
  let totalSelections = 0;

  return {
    recordSelection(fieldKey: string): void {
      // Decay existing weights
      for (const [key, weight] of weightedCounts) {
        weightedCounts.set(key, weight * DECAY_FACTOR);
      }

      // Add new selection with full weight
      const currentWeight = weightedCounts.get(fieldKey) ?? 0;
      weightedCounts.set(fieldKey, currentWeight + 1);

      // Update raw counts
      const currentCount = selectionCounts.get(fieldKey) ?? 0;
      selectionCounts.set(fieldKey, currentCount + 1);
      totalSelections++;
    },

    predictNextSelection(): string | null {
      if (totalSelections < 3) {
        // Not enough data for reliable prediction
        return null;
      }

      let bestKey: string | null = null;
      let bestWeight = 0;
      let totalWeight = 0;

      for (const [key, weight] of weightedCounts) {
        totalWeight += weight;
        if (weight > bestWeight) {
          bestWeight = weight;
          bestKey = key;
        }
      }

      // Check if prediction is confident enough
      if (totalWeight > 0 && bestWeight / totalWeight >= PREDICTION_THRESHOLD) {
        return bestKey;
      }

      return null;
    },

    getSelectionHistory(): Map<string, number> {
      return new Map(selectionCounts);
    },

    reset(): void {
      selectionCounts.clear();
      weightedCounts.clear();
      totalSelections = 0;
    },
  };
}

// Module-level pattern tracker (shared across game)
let patternTracker: PatternTracker | null = null;

/**
 * Get or create the pattern tracker.
 */
export function getPatternTracker(): PatternTracker {
  patternTracker ??= createPatternTracker();
  return patternTracker;
}

/**
 * Reset the pattern tracker (call when starting new game).
 */
export function resetPatternTracker(): void {
  if (patternTracker) {
    patternTracker.reset();
  }
}

/**
 * Record a player selection (call from store when player selects stat).
 */
export function recordPlayerSelection(fieldKey: string): void {
  getPatternTracker().recordSelection(fieldKey);
}

/**
 * Hard AI: Pattern tracking and exploitation.
 */
export const hardAI: AIStrategy = {
  id: "hard",
  name: "Hard",

  selectStat(
    cpuCard: CardData,
    numericFields: NumericFieldInfo[],
    gameContext: GameContext
  ): string {
    if (numericFields.length === 0) {
      throw new Error("No numeric fields available for selection");
    }

    // Try to predict player's likely choice
    const predictedField = getPatternTracker().predictNextSelection();

    if (predictedField) {
      // Find a counter-strategy: pick a stat where we're strong
      // AND the player's predicted field shows relative weakness
      const counterStrategies: { field: NumericFieldInfo; score: number }[] = [];

      for (const field of numericFields) {
        const cpuValue = getCardValue(cpuCard, field.key);
        if (cpuValue === null) {
          continue;
        }

        const cpuStrength = getRelativeStrength(cpuValue, field);

        // Calculate counter score:
        // - High when we're strong in this stat
        // - Bonus if this is NOT the predicted field (surprise factor)
        let counterScore = cpuStrength;

        if (field.key !== predictedField) {
          // Add surprise bonus
          counterScore += 0.1;
        }

        counterStrategies.push({ field, score: counterScore });
      }

      // Sort by counter score
      counterStrategies.sort((a, b) => b.score - a.score);

      // Pick the best counter-strategy if we have one
      const bestCounter = counterStrategies[0];
      if (bestCounter && bestCounter.score > 0.5) {
        return bestCounter.field.key;
      }
    }

    // Fall back to medium strategy when uncertain
    return mediumAI.selectStat(cpuCard, numericFields, gameContext);
  },
};
