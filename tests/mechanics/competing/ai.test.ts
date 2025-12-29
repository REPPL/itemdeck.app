/**
 * Tests for AI strategies.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { simpleAI } from "@/mechanics/competing/ai/simple";
import { mediumAI } from "@/mechanics/competing/ai/medium";
import {
  hardAI,
  createPatternTracker,
  resetPatternTracker,
  recordPlayerSelection,
  getPatternTracker,
} from "@/mechanics/competing/ai/hard";
import { getAIStrategy } from "@/mechanics/competing/ai";
import type { NumericFieldInfo, GameContext, CardData } from "@/mechanics/competing/types";

describe("AI strategies", () => {
  // Sample test data
  const numericFields: NumericFieldInfo[] = [
    { key: "attack", label: "Attack", min: 50, max: 100, higherIsBetter: true },
    { key: "defence", label: "Defence", min: 30, max: 90, higherIsBetter: true },
    { key: "speed", label: "Speed", min: 10, max: 50, higherIsBetter: true },
  ];

  const gameContext: GameContext = {
    round: 1,
    playerDeckSize: 10,
    cpuDeckSize: 10,
    tiePileSize: 0,
    playerSelectionHistory: [],
  };

  beforeEach(() => {
    resetPatternTracker();
  });

  describe("simpleAI", () => {
    it("should return a valid field key", () => {
      const cpuCard: CardData = { attack: 75, defence: 60, speed: 30 };

      const selectedKey = simpleAI.selectStat(cpuCard, numericFields, gameContext);

      const validKeys = numericFields.map((f) => f.key);
      expect(validKeys).toContain(selectedKey);
    });

    it("should have roughly uniform distribution over many calls", () => {
      const cpuCard: CardData = { attack: 75, defence: 60, speed: 30 };
      const selections: Record<string, number> = {};

      // Run many selections
      for (let i = 0; i < 300; i++) {
        const key = simpleAI.selectStat(cpuCard, numericFields, gameContext);
        selections[key] = (selections[key] ?? 0) + 1;
      }

      // Each field should be selected at least some times (within reasonable variance)
      for (const field of numericFields) {
        expect(selections[field.key]).toBeGreaterThan(50);
        expect(selections[field.key]).toBeLessThan(150);
      }
    });

    it("should throw error when no fields available", () => {
      const cpuCard: CardData = { attack: 75 };

      expect(() => {
        simpleAI.selectStat(cpuCard, [], gameContext);
      }).toThrow("No numeric fields available");
    });
  });

  describe("mediumAI", () => {
    it("should select the stat with highest relative value", () => {
      // Card with clearly highest attack (100 = max of range)
      const cpuCard: CardData = { attack: 100, defence: 50, speed: 25 };

      const selected = mediumAI.selectStat(cpuCard, numericFields, gameContext);

      expect(selected).toBe("attack");
    });

    it("should compare relative strength, not absolute values", () => {
      // Speed: 50 is max (1.0 strength)
      // Attack: 90 is high but not max (0.8 strength)
      // Defence: 60 is medium (0.5 strength)
      const cpuCard: CardData = { attack: 90, defence: 60, speed: 50 };

      const selected = mediumAI.selectStat(cpuCard, numericFields, gameContext);

      expect(selected).toBe("speed");
    });

    it("should handle missing values gracefully", () => {
      const cpuCard: CardData = { defence: 90 };

      const selected = mediumAI.selectStat(cpuCard, numericFields, gameContext);

      expect(selected).toBe("defence");
    });

    it("should fall back to first field if all values missing", () => {
      const cpuCard: CardData = { name: "Hero" }; // No numeric fields

      const selected = mediumAI.selectStat(cpuCard, numericFields, gameContext);

      expect(selected).toBe("attack"); // First field as fallback
    });
  });

  describe("hardAI", () => {
    describe("pattern tracker", () => {
      it("should create a new pattern tracker", () => {
        const tracker = createPatternTracker();
        expect(tracker.getSelectionHistory().size).toBe(0);
      });

      it("should record selections", () => {
        const tracker = createPatternTracker();
        tracker.recordSelection("attack");
        tracker.recordSelection("attack");
        tracker.recordSelection("defence");

        const history = tracker.getSelectionHistory();
        expect(history.get("attack")).toBe(2);
        expect(history.get("defence")).toBe(1);
      });

      it("should not predict with insufficient data", () => {
        const tracker = createPatternTracker();
        tracker.recordSelection("attack");
        tracker.recordSelection("attack");

        expect(tracker.predictNextSelection()).toBeNull();
      });

      it("should predict based on pattern", () => {
        const tracker = createPatternTracker();
        // Record many attack selections
        for (let i = 0; i < 10; i++) {
          tracker.recordSelection("attack");
        }

        expect(tracker.predictNextSelection()).toBe("attack");
      });

      it("should reset correctly", () => {
        const tracker = createPatternTracker();
        tracker.recordSelection("attack");
        tracker.recordSelection("attack");

        tracker.reset();

        expect(tracker.getSelectionHistory().size).toBe(0);
        expect(tracker.predictNextSelection()).toBeNull();
      });
    });

    it("should fall back to medium strategy with no pattern", () => {
      // With no history, hard AI should behave like medium AI
      const cpuCard: CardData = { attack: 100, defence: 50, speed: 25 };

      const hardSelection = hardAI.selectStat(cpuCard, numericFields, gameContext);
      const mediumSelection = mediumAI.selectStat(cpuCard, numericFields, gameContext);

      expect(hardSelection).toBe(mediumSelection);
    });

    it("should use counter strategy when pattern detected", () => {
      // Establish a strong pattern of attack selections
      for (let i = 0; i < 10; i++) {
        recordPlayerSelection("attack");
      }

      // Card where defence is strong
      const cpuCard: CardData = { attack: 60, defence: 90, speed: 25 };

      const selected = hardAI.selectStat(cpuCard, numericFields, gameContext);

      // Should pick defence (high relative strength) as counter
      expect(selected).toBe("defence");
    });
  });

  describe("getAIStrategy", () => {
    it("should return simple AI for simple difficulty", () => {
      expect(getAIStrategy("simple")).toBe(simpleAI);
    });

    it("should return medium AI for medium difficulty", () => {
      expect(getAIStrategy("medium")).toBe(mediumAI);
    });

    it("should return hard AI for hard difficulty", () => {
      expect(getAIStrategy("hard")).toBe(hardAI);
    });

    it("should default to medium for unknown difficulty", () => {
      // Type assertion needed for testing invalid input
      expect(getAIStrategy("invalid" as never)).toBe(mediumAI);
    });
  });
});
