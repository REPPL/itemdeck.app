/**
 * AI strategy exports for Competing mechanic.
 */

export type { AIStrategy } from "./types";
export { simpleAI } from "./simple";
export { mediumAI } from "./medium";
export {
  hardAI,
  createPatternTracker,
  getPatternTracker,
  resetPatternTracker,
  recordPlayerSelection,
} from "./hard";

import type { Difficulty } from "../types";
import type { AIStrategy } from "./types";
import { simpleAI } from "./simple";
import { mediumAI } from "./medium";
import { hardAI } from "./hard";

/**
 * Get AI strategy by difficulty level.
 */
export function getAIStrategy(difficulty: Difficulty): AIStrategy {
  switch (difficulty) {
    case "simple":
      return simpleAI;
    case "medium":
      return mediumAI;
    case "hard":
      return hardAI;
    default:
      return mediumAI;
  }
}
