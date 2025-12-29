/**
 * Tests for numeric field detection utilities.
 */

import { describe, expect, it } from "vitest";
import {
  detectNumericFields,
  getCardValue,
  getRelativeStrength,
  compareValues,
  humaniseFieldName,
} from "@/mechanics/competing/utils/numericFields";
import type { NumericFieldInfo } from "@/mechanics/competing/types";

describe("numericFields", () => {
  describe("humaniseFieldName", () => {
    it("should convert camelCase to Title Case", () => {
      expect(humaniseFieldName("attackPower")).toBe("Attack Power");
      expect(humaniseFieldName("defenceValue")).toBe("Defence Value");
    });

    it("should convert snake_case to Title Case", () => {
      expect(humaniseFieldName("attack_power")).toBe("Attack Power");
      expect(humaniseFieldName("max_health")).toBe("Max Health");
    });

    it("should handle simple names", () => {
      expect(humaniseFieldName("speed")).toBe("Speed");
      expect(humaniseFieldName("health")).toBe("Health");
    });

    it("should handle kebab-case", () => {
      expect(humaniseFieldName("hit-points")).toBe("Hit Points");
    });
  });

  describe("getCardValue", () => {
    it("should return numeric values directly", () => {
      const card = { attack: 85, defence: 70 };
      expect(getCardValue(card, "attack")).toBe(85);
      expect(getCardValue(card, "defence")).toBe(70);
    });

    it("should parse string numbers", () => {
      const card = { attack: "85", defence: "70.5" };
      expect(getCardValue(card, "attack")).toBe(85);
      expect(getCardValue(card, "defence")).toBe(70.5);
    });

    it("should return null for non-numeric values", () => {
      const card = { name: "Hero", type: "character" };
      expect(getCardValue(card, "name")).toBeNull();
      expect(getCardValue(card, "type")).toBeNull();
    });

    it("should return null for missing fields", () => {
      const card = { attack: 85 };
      expect(getCardValue(card, "defence")).toBeNull();
    });

    it("should return null for null/undefined values", () => {
      const card = { attack: null, defence: undefined };
      expect(getCardValue(card, "attack")).toBeNull();
      expect(getCardValue(card, "defence")).toBeNull();
    });

    it("should return null for empty strings", () => {
      const card = { attack: "", defence: "  " };
      expect(getCardValue(card, "attack")).toBeNull();
      expect(getCardValue(card, "defence")).toBeNull();
    });
  });

  describe("detectNumericFields", () => {
    it("should detect numeric fields from cards", () => {
      const cards = [
        { id: "1", attack: 80, defence: 60, name: "Hero A" },
        { id: "2", attack: 70, defence: 75, name: "Hero B" },
        { id: "3", attack: 90, defence: 50, name: "Hero C" },
      ];

      const fields = detectNumericFields(cards);

      // Should detect attack and defence, but not id or name
      const fieldKeys = fields.map((f) => f.key);
      expect(fieldKeys).toContain("attack");
      expect(fieldKeys).toContain("defence");
      expect(fieldKeys).not.toContain("id");
      expect(fieldKeys).not.toContain("name");
    });

    it("should exclude fields ending with 'id'", () => {
      const cards = [
        { id: "1", cardId: "c1", attack: 80 },
        { id: "2", cardId: "c2", attack: 70 },
        { id: "3", cardId: "c3", attack: 90 },
      ];

      const fields = detectNumericFields(cards);
      const fieldKeys = fields.map((f) => f.key);

      expect(fieldKeys).not.toContain("id");
      expect(fieldKeys).not.toContain("cardId");
      expect(fieldKeys).toContain("attack");
    });

    it("should exclude fields with identical values", () => {
      const cards = [
        { attack: 80, version: 1 },
        { attack: 70, version: 1 },
        { attack: 90, version: 1 },
      ];

      const fields = detectNumericFields(cards);
      const fieldKeys = fields.map((f) => f.key);

      expect(fieldKeys).toContain("attack");
      expect(fieldKeys).not.toContain("version");
    });

    it("should require 80% valid values for a field", () => {
      const cards = [
        { attack: 80, speed: 10 },
        { attack: 70, speed: 15 },
        { attack: 90, speed: null },
        { attack: 60, speed: undefined },
        { attack: 50, speed: "fast" }, // Invalid
      ];

      const fields = detectNumericFields(cards);
      const fieldKeys = fields.map((f) => f.key);

      expect(fieldKeys).toContain("attack");
      // speed only has 40% valid values (2/5), should be excluded
      expect(fieldKeys).not.toContain("speed");
    });

    it("should return empty array for empty input", () => {
      expect(detectNumericFields([])).toEqual([]);
    });

    it("should calculate min and max correctly", () => {
      const cards = [
        { attack: 80 },
        { attack: 70 },
        { attack: 100 },
        { attack: 50 },
      ];

      const fields = detectNumericFields(cards);
      const attackField = fields.find((f) => f.key === "attack");

      expect(attackField?.min).toBe(50);
      expect(attackField?.max).toBe(100);
    });

    it("should sort fields by variance (range)", () => {
      const cards = [
        { attack: 50, defence: 90, speed: 80 },
        { attack: 100, defence: 95, speed: 85 },
      ];

      const fields = detectNumericFields(cards);

      // Attack has range 50, defence has range 5, speed has range 5
      // Attack should come first due to largest range
      expect(fields[0]?.key).toBe("attack");
    });

    it("should handle string numbers mixed with numbers", () => {
      const cards = [
        { attack: 80 },
        { attack: "90" },
        { attack: 70 },
      ];

      const fields = detectNumericFields(cards);
      expect(fields.map((f) => f.key)).toContain("attack");
    });
  });

  describe("getRelativeStrength", () => {
    const field: NumericFieldInfo = {
      key: "attack",
      label: "Attack",
      min: 0,
      max: 100,
      higherIsBetter: true,
    };

    it("should return relative strength between 0 and 1", () => {
      expect(getRelativeStrength(50, field)).toBe(0.5);
      expect(getRelativeStrength(0, field)).toBe(0);
      expect(getRelativeStrength(100, field)).toBe(1);
    });

    it("should handle non-zero minimum", () => {
      const fieldWithMin: NumericFieldInfo = {
        key: "attack",
        label: "Attack",
        min: 50,
        max: 100,
        higherIsBetter: true,
      };

      expect(getRelativeStrength(50, fieldWithMin)).toBe(0);
      expect(getRelativeStrength(75, fieldWithMin)).toBe(0.5);
      expect(getRelativeStrength(100, fieldWithMin)).toBe(1);
    });

    it("should invert for higherIsBetter=false", () => {
      const lowField: NumericFieldInfo = {
        key: "weight",
        label: "Weight",
        min: 0,
        max: 100,
        higherIsBetter: false,
      };

      expect(getRelativeStrength(0, lowField)).toBe(1); // Low is good
      expect(getRelativeStrength(100, lowField)).toBe(0); // High is bad
      expect(getRelativeStrength(50, lowField)).toBe(0.5);
    });

    it("should return 0.5 for zero range", () => {
      const sameField: NumericFieldInfo = {
        key: "constant",
        label: "Constant",
        min: 50,
        max: 50,
        higherIsBetter: true,
      };

      expect(getRelativeStrength(50, sameField)).toBe(0.5);
    });
  });

  describe("compareValues", () => {
    const field: NumericFieldInfo = {
      key: "attack",
      label: "Attack",
      min: 0,
      max: 100,
      higherIsBetter: true,
    };

    it("should return 1 when value1 wins", () => {
      expect(compareValues(80, 60, field)).toBe(1);
    });

    it("should return -1 when value2 wins", () => {
      expect(compareValues(60, 80, field)).toBe(-1);
    });

    it("should return 0 for tie", () => {
      expect(compareValues(70, 70, field)).toBe(0);
    });

    it("should invert for higherIsBetter=false", () => {
      const lowField: NumericFieldInfo = {
        key: "weight",
        label: "Weight",
        min: 0,
        max: 100,
        higherIsBetter: false,
      };

      expect(compareValues(60, 80, lowField)).toBe(1); // Lower wins
      expect(compareValues(80, 60, lowField)).toBe(-1); // Higher loses
    });
  });
});
