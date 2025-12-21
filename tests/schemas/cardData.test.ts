/**
 * Tests for card data schema validation.
 */

import { describe, it, expect } from "vitest";
import {
  cardDataSchema,
  validateCard,
  safeValidateCard,
  filterValidCards,
  type CardData,
} from "@/schemas/cardData.schema";

describe("cardDataSchema", () => {
  describe("valid data", () => {
    it("validates minimal card with only required fields", () => {
      const card = {
        id: "test-1",
        title: "Test Card",
      };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(true);
    });

    it("validates complete card with all fields", () => {
      const card: CardData = {
        id: "test-1",
        title: "Test Card",
        year: "2024",
        imageUrl: "https://example.com/image.jpg",
        logoUrl: "https://example.com/logo.png",
        summary: "A test card description",
        detailUrl: "https://example.com/details",
        metadata: {
          category: "Test",
          rank: "1",
        },
      };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(card);
      }
    });

    it("validates card without optional fields", () => {
      const card = {
        id: "card-123",
        title: "Simple Card",
        summary: "Just a summary",
      };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(true);
    });

    it("accepts empty metadata object", () => {
      const card = {
        id: "test-1",
        title: "Test Card",
        metadata: {},
      };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("rejects card without id", () => {
      const card = { title: "Missing ID" };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(false);
    });

    it("rejects card without title", () => {
      const card = { id: "test-1" };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(false);
    });

    it("rejects card with empty id", () => {
      const card = { id: "", title: "Test" };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(false);
    });

    it("rejects card with empty title", () => {
      const card = { id: "test-1", title: "" };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(false);
    });

    it("rejects invalid imageUrl", () => {
      const card = {
        id: "test-1",
        title: "Test",
        imageUrl: "not-a-url",
      };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(false);
    });

    it("rejects invalid detailUrl", () => {
      const card = {
        id: "test-1",
        title: "Test",
        detailUrl: "invalid-url",
      };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(false);
    });

    it("rejects non-string metadata values", () => {
      const card = {
        id: "test-1",
        title: "Test",
        metadata: { count: 42 },
      };
      const result = cardDataSchema.safeParse(card);
      expect(result.success).toBe(false);
    });
  });
});

describe("validateCard", () => {
  it("returns validated card for valid input", () => {
    const card = { id: "test", title: "Test" };
    const result = validateCard(card);
    expect(result).toEqual(card);
  });

  it("throws for invalid input", () => {
    expect(() => validateCard({ title: "Missing ID" })).toThrow();
  });
});

describe("safeValidateCard", () => {
  it("returns success result for valid input", () => {
    const card = { id: "test", title: "Test" };
    const result = safeValidateCard(card);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(card);
    }
  });

  it("returns error result for invalid input", () => {
    const result = safeValidateCard({ title: "Missing ID" });
    expect(result.success).toBe(false);
  });
});

describe("filterValidCards", () => {
  it("separates valid and invalid cards", () => {
    const cards = [
      { id: "1", title: "Valid 1" },
      { title: "Invalid - no id" },
      { id: "2", title: "Valid 2" },
      { id: "", title: "Invalid - empty id" },
    ];

    const { valid, invalid } = filterValidCards(cards);

    expect(valid).toHaveLength(2);
    expect(invalid).toHaveLength(2);
    expect(valid[0].id).toBe("1");
    expect(valid[1].id).toBe("2");
  });

  it("returns all valid for valid array", () => {
    const cards = [
      { id: "1", title: "Card 1" },
      { id: "2", title: "Card 2" },
    ];

    const { valid, invalid } = filterValidCards(cards);

    expect(valid).toHaveLength(2);
    expect(invalid).toHaveLength(0);
  });

  it("returns all invalid for invalid array", () => {
    const cards = [
      { title: "No ID" },
      { id: "valid-id" }, // No title
    ];

    const { valid, invalid } = filterValidCards(cards);

    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(2);
  });

  it("handles empty array", () => {
    const { valid, invalid } = filterValidCards([]);

    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(0);
  });
});

describe("real-world data compatibility", () => {
  it("validates MyPlausibleMe card format", () => {
    // Sample from the actual retro-games dataset
    const card = {
      id: "cosmic-ark-vcs2600",
      title: "Cosmic Ark",
      metadata: {
        category: "VCS2600",
        rank: "1",
      },
      year: "1981",
      summary: "Space rescue game with stunning starfield effect.",
      detailUrl: "https://en.wikipedia.org/wiki/Cosmic_Ark",
    };

    const result = cardDataSchema.safeParse(card);
    expect(result.success).toBe(true);
  });

  it("validates card without detailUrl", () => {
    // Some cards don't have external links
    const card = {
      id: "slot-vic20",
      title: "Slot",
      metadata: {
        category: "VIC20",
        rank: "2",
      },
      year: "1983",
      summary: "Classic slot machine simulation.",
    };

    const result = cardDataSchema.safeParse(card);
    expect(result.success).toBe(true);
  });
});
