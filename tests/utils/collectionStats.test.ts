/**
 * Tests for collection statistics computation.
 */

import { describe, it, expect } from "vitest";
import {
  computeCollectionStats,
  formatStatsSummary,
  type CollectionStats,
} from "@/utils/collectionStats";
import type { DisplayCard } from "@/hooks/useCollection";

// Helper to create mock DisplayCard
function createMockCard(overrides: Partial<DisplayCard> = {}): DisplayCard {
  return {
    id: `card-${Math.random().toString(36).slice(2)}`,
    title: "Test Card",
    year: 2000,
    ...overrides,
  } as DisplayCard;
}

describe("computeCollectionStats", () => {
  describe("totalItems", () => {
    it("should count total items", () => {
      const items = [createMockCard(), createMockCard(), createMockCard()];

      const stats = computeCollectionStats(items);

      expect(stats.totalItems).toBe(3);
    });

    it("should return 0 for empty array", () => {
      const stats = computeCollectionStats([]);

      expect(stats.totalItems).toBe(0);
    });
  });

  describe("numeric fields", () => {
    it("should compute min, max, avg for year field", () => {
      const items = [
        createMockCard({ year: 1990 }),
        createMockCard({ year: 2000 }),
        createMockCard({ year: 2010 }),
      ];

      const stats = computeCollectionStats(items);

      const yearStats = stats.numericFields.get("year");
      expect(yearStats).toBeDefined();
      expect(yearStats?.min).toBe(1990);
      expect(yearStats?.max).toBe(2010);
      expect(yearStats?.avg).toBe(2000);
      expect(yearStats?.count).toBe(3);
    });

    it("should set yearRange from year field", () => {
      const items = [
        createMockCard({ year: 1985 }),
        createMockCard({ year: 2024 }),
      ];

      const stats = computeCollectionStats(items);

      expect(stats.yearRange).toEqual({ min: 1985, max: 2024 });
    });

    it("should handle rating field", () => {
      const items = [
        createMockCard({ rating: 7.5 }),
        createMockCard({ rating: 8.5 }),
        createMockCard({ rating: 9.0 }),
      ];

      const stats = computeCollectionStats(items, ["rating"]);

      const ratingStats = stats.numericFields.get("rating");
      expect(ratingStats).toBeDefined();
      expect(ratingStats?.min).toBe(7.5);
      expect(ratingStats?.max).toBe(9.0);
      expect(ratingStats?.avg).toBeCloseTo(8.33, 1);
    });

    it("should handle score field", () => {
      const items = [
        createMockCard({ score: 80 }),
        createMockCard({ score: 90 }),
        createMockCard({ score: 100 }),
      ];

      const stats = computeCollectionStats(items, ["score"]);

      const scoreStats = stats.numericFields.get("score");
      expect(scoreStats).toBeDefined();
      expect(scoreStats?.avg).toBe(90);
    });

    it("should skip items with missing numeric values", () => {
      const items = [
        createMockCard({ year: 2000 }),
        createMockCard({ year: undefined }),
        createMockCard({ year: 2020 }),
      ];

      const stats = computeCollectionStats(items);

      const yearStats = stats.numericFields.get("year");
      expect(yearStats?.count).toBe(2);
      expect(yearStats?.avg).toBe(2010);
    });

    it("should parse numeric strings", () => {
      const items = [
        createMockCard({ year: "1990" as unknown as number }),
        createMockCard({ year: "2000" as unknown as number }),
      ];

      const stats = computeCollectionStats(items);

      const yearStats = stats.numericFields.get("year");
      expect(yearStats?.count).toBe(2);
      expect(yearStats?.avg).toBe(1995);
    });
  });

  describe("categorical fields", () => {
    it("should compute distribution for platform field", () => {
      const items = [
        createMockCard({ platform: "SNES" }),
        createMockCard({ platform: "SNES" }),
        createMockCard({ platform: "NES" }),
        createMockCard({ platform: "Genesis" }),
      ];

      const stats = computeCollectionStats(items, [], ["platform"]);

      const platformDist = stats.categoricalDistribution.get("platform");
      expect(platformDist).toBeDefined();
      expect(platformDist?.get("SNES")).toBe(2);
      expect(platformDist?.get("NES")).toBe(1);
      expect(platformDist?.get("Genesis")).toBe(1);
    });

    it("should set platformCount from platform field", () => {
      const items = [
        createMockCard({ platform: "SNES" }),
        createMockCard({ platform: "NES" }),
        createMockCard({ platform: "Genesis" }),
      ];

      const stats = computeCollectionStats(items, [], ["platform"]);

      expect(stats.platformCount).toBe(3);
    });

    it("should handle genre field", () => {
      const items = [
        createMockCard({ genre: "Action" }),
        createMockCard({ genre: "RPG" }),
        createMockCard({ genre: "Action" }),
      ];

      const stats = computeCollectionStats(items, [], ["genre"]);

      const genreDist = stats.categoricalDistribution.get("genre");
      expect(genreDist?.get("Action")).toBe(2);
      expect(genreDist?.get("RPG")).toBe(1);
    });

    it("should skip items with empty categorical values", () => {
      const items = [
        createMockCard({ platform: "SNES" }),
        createMockCard({ platform: "" }),
        createMockCard({ platform: "   " }),
      ];

      const stats = computeCollectionStats(items, [], ["platform"]);

      const platformDist = stats.categoricalDistribution.get("platform");
      expect(platformDist?.size).toBe(1);
      expect(platformDist?.get("SNES")).toBe(1);
    });

    it("should trim whitespace from categorical values", () => {
      const items = [
        createMockCard({ platform: "  SNES  " }),
        createMockCard({ platform: "SNES" }),
      ];

      const stats = computeCollectionStats(items, [], ["platform"]);

      const platformDist = stats.categoricalDistribution.get("platform");
      expect(platformDist?.get("SNES")).toBe(2);
    });
  });

  describe("empty results", () => {
    it("should return empty maps for empty items", () => {
      const stats = computeCollectionStats([]);

      expect(stats.numericFields.size).toBe(0);
      expect(stats.categoricalDistribution.size).toBe(0);
      expect(stats.yearRange).toBeUndefined();
      expect(stats.platformCount).toBeUndefined();
    });

    it("should return empty map when no numeric values found", () => {
      const items = [
        createMockCard({ year: undefined }),
        createMockCard({ year: undefined }),
      ];

      const stats = computeCollectionStats(items);

      expect(stats.numericFields.get("year")).toBeUndefined();
    });
  });
});

describe("formatStatsSummary", () => {
  it("should format basic item count", () => {
    const stats: CollectionStats = {
      totalItems: 42,
      numericFields: new Map(),
      categoricalDistribution: new Map(),
    };

    const summary = formatStatsSummary(stats);

    expect(summary).toBe("42 items");
  });

  it("should include year range", () => {
    const stats: CollectionStats = {
      totalItems: 10,
      numericFields: new Map(),
      categoricalDistribution: new Map(),
      yearRange: { min: 1985, max: 2024 },
    };

    const summary = formatStatsSummary(stats);

    expect(summary).toBe("10 items | Years: 1985-2024");
  });

  it("should use singular year when min equals max", () => {
    const stats: CollectionStats = {
      totalItems: 5,
      numericFields: new Map(),
      categoricalDistribution: new Map(),
      yearRange: { min: 2000, max: 2000 },
    };

    const summary = formatStatsSummary(stats);

    expect(summary).toBe("5 items | Year: 2000");
  });

  it("should include platform count", () => {
    const stats: CollectionStats = {
      totalItems: 20,
      numericFields: new Map(),
      categoricalDistribution: new Map(),
      platformCount: 8,
    };

    const summary = formatStatsSummary(stats);

    expect(summary).toBe("20 items | Platforms: 8");
  });

  it("should include average rating", () => {
    const stats: CollectionStats = {
      totalItems: 15,
      numericFields: new Map([
        ["rating", { min: 7, max: 10, avg: 8.5, count: 15 }],
      ]),
      categoricalDistribution: new Map(),
    };

    const summary = formatStatsSummary(stats);

    expect(summary).toBe("15 items | Avg Rating: 8.5");
  });

  it("should include average score", () => {
    const stats: CollectionStats = {
      totalItems: 10,
      numericFields: new Map([
        ["score", { min: 70, max: 100, avg: 85.333, count: 10 }],
      ]),
      categoricalDistribution: new Map(),
    };

    const summary = formatStatsSummary(stats);

    expect(summary).toBe("10 items | Avg Score: 85.3");
  });

  it("should include all parts when available", () => {
    const stats: CollectionStats = {
      totalItems: 100,
      numericFields: new Map([
        ["rating", { min: 6, max: 10, avg: 8.2, count: 100 }],
      ]),
      categoricalDistribution: new Map(),
      yearRange: { min: 1990, max: 2020 },
      platformCount: 15,
    };

    const summary = formatStatsSummary(stats);

    expect(summary).toBe("100 items | Years: 1990-2020 | Platforms: 15 | Avg Rating: 8.2");
  });
});
