/**
 * Tests for field path parser.
 */

import { describe, it, expect } from "vitest";
import {
  getFieldValue,
  getStringValue,
  getNumberValue,
  getImagesValue,
  resolveFieldPath,
  resolveFieldPathAsString,
  resolveFieldPathAsNumber,
} from "@/loaders/fieldPath";
import type { ResolvedEntity } from "@/types/schema";

describe("fieldPath", () => {
  const testEntity: ResolvedEntity = {
    id: "super-metroid",
    title: "Super Metroid",
    year: 1994,
    platform: "snes",
    rank: 0,
    summary: "Atmospheric masterpiece",
    images: [
      { url: "https://example.com/cover.jpg", type: "cover" },
      { url: "https://example.com/screenshot.jpg", type: "screenshot" },
    ],
    _resolved: {
      platform: {
        id: "snes",
        title: "SNES",
        year: 1992,
      },
    },
  };

  describe("getFieldValue", () => {
    it("should get simple property", () => {
      expect(getFieldValue(testEntity, "title")).toBe("Super Metroid");
      expect(getFieldValue(testEntity, "year")).toBe(1994);
    });

    it("should get nested resolved property", () => {
      expect(getFieldValue(testEntity, "platform.title")).toBe("SNES");
      expect(getFieldValue(testEntity, "platform.year")).toBe(1992);
    });

    it("should get array element by index", () => {
      const result = getFieldValue(testEntity, "images[0]") as { url: string };
      expect(result.url).toBe("https://example.com/cover.jpg");
    });

    it("should get property from array element", () => {
      expect(getFieldValue(testEntity, "images[0].url")).toBe(
        "https://example.com/cover.jpg"
      );
      expect(getFieldValue(testEntity, "images[1].type")).toBe("screenshot");
    });

    it("should filter array and get property", () => {
      const result = getFieldValue(testEntity, "images[type=cover]");
      expect(Array.isArray(result)).toBe(true);
      expect((result as Array<{ url: string }>)[0].url).toBe(
        "https://example.com/cover.jpg"
      );
    });

    it("should return undefined for missing property", () => {
      expect(getFieldValue(testEntity, "nonexistent")).toBeUndefined();
      expect(getFieldValue(testEntity, "platform.nonexistent")).toBeUndefined();
    });

    it("should return undefined for out of bounds index", () => {
      expect(getFieldValue(testEntity, "images[99]")).toBeUndefined();
    });
  });

  describe("getStringValue", () => {
    it("should return string value", () => {
      expect(getStringValue(testEntity, "title")).toBe("Super Metroid");
    });

    it("should convert number to string", () => {
      expect(getStringValue(testEntity, "year")).toBe("1994");
    });

    it("should return fallback for missing value", () => {
      expect(getStringValue(testEntity, "nonexistent", "default")).toBe(
        "default"
      );
    });

    it("should return empty string by default", () => {
      expect(getStringValue(testEntity, "nonexistent")).toBe("");
    });
  });

  describe("getNumberValue", () => {
    it("should return number value", () => {
      expect(getNumberValue(testEntity, "year")).toBe(1994);
      expect(getNumberValue(testEntity, "rank")).toBe(0);
    });

    it("should parse string to number", () => {
      const entityWithStringYear = { ...testEntity, year: "2000" };
      expect(getNumberValue(entityWithStringYear, "year")).toBe(2000);
    });

    it("should return fallback for missing value", () => {
      expect(getNumberValue(testEntity, "nonexistent", 42)).toBe(42);
    });

    it("should return null by default", () => {
      expect(getNumberValue(testEntity, "nonexistent")).toBeNull();
    });
  });

  describe("getImagesValue", () => {
    it("should return images array", () => {
      const result = getImagesValue(testEntity);
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe("https://example.com/cover.jpg");
    });

    it("should return empty array for missing images", () => {
      const entityWithoutImages = { id: "test", title: "Test" };
      expect(getImagesValue(entityWithoutImages)).toEqual([]);
    });

    it("should filter non-image objects", () => {
      const entityWithMixedArray = {
        id: "test",
        images: [
          { url: "https://example.com/valid.jpg" },
          "not an image",
          null,
          { noUrl: true },
        ],
      };
      const result = getImagesValue(entityWithMixedArray);
      expect(result).toHaveLength(1);
    });
  });

  describe("resolveFieldPath (fallback support)", () => {
    const entityWithPartialData: ResolvedEntity = {
      id: "zelda",
      title: "The Legend of Zelda",
      year: 1986,
      // verdict is missing
      // playedSince is missing
      _resolved: {},
    };

    const entityWithFullData: ResolvedEntity = {
      id: "metroid",
      title: "Metroid",
      year: 1986,
      verdict: "A classic",
      playedSince: "1988",
      rating: 9.5,
      _resolved: {
        platform: {
          id: "nes",
          title: "NES",
        },
      },
    };

    it("should resolve simple path without fallback", () => {
      expect(resolveFieldPath(entityWithFullData, "title")).toBe("Metroid");
      expect(resolveFieldPath(entityWithFullData, "year")).toBe(1986);
    });

    it("should use first available value in fallback chain", () => {
      // verdict exists, so use it
      expect(resolveFieldPath(entityWithFullData, "verdict ?? summary ?? title")).toBe(
        "A classic"
      );

      // verdict missing, fall through to title
      expect(resolveFieldPath(entityWithPartialData, "verdict ?? summary ?? title")).toBe(
        "The Legend of Zelda"
      );
    });

    it("should handle two-value fallback", () => {
      // playedSince exists
      expect(resolveFieldPath(entityWithFullData, "playedSince ?? year")).toBe("1988");

      // playedSince missing, use year
      expect(resolveFieldPath(entityWithPartialData, "playedSince ?? year")).toBe(1986);
    });

    it("should return undefined when all fallbacks fail", () => {
      expect(
        resolveFieldPath(entityWithPartialData, "verdict ?? rating ?? status")
      ).toBeUndefined();
    });

    it("should handle nested paths in fallback chain", () => {
      expect(
        resolveFieldPath(entityWithFullData, "platform.title ?? title")
      ).toBe("NES");

      // No platform resolved in partial data
      expect(
        resolveFieldPath(entityWithPartialData, "platform.title ?? title")
      ).toBe("The Legend of Zelda");
    });

    it("should handle whitespace around ?? operator", () => {
      expect(resolveFieldPath(entityWithFullData, "verdict??title")).toBe("A classic");
      expect(resolveFieldPath(entityWithFullData, "verdict  ??  title")).toBe("A classic");
    });
  });

  describe("resolveFieldPathAsString", () => {
    const entity: ResolvedEntity = {
      id: "test",
      title: "Test Game",
      year: 1990,
      verdict: "Great game",
      _resolved: {},
    };

    it("should return string from first matching path", () => {
      expect(resolveFieldPathAsString(entity, "verdict ?? title")).toBe("Great game");
    });

    it("should convert number to string", () => {
      expect(resolveFieldPathAsString(entity, "playedSince ?? year")).toBe("1990");
    });

    it("should return fallback when no path matches", () => {
      expect(resolveFieldPathAsString(entity, "rating ?? status", "N/A")).toBe("N/A");
    });

    it("should return empty string by default", () => {
      expect(resolveFieldPathAsString(entity, "missing")).toBe("");
    });
  });

  describe("resolveFieldPathAsNumber", () => {
    const entity: ResolvedEntity = {
      id: "test",
      title: "Test",
      year: 1990,
      rating: 8.5,
      score: "95",
      _resolved: {},
    };

    it("should return number from first matching path", () => {
      expect(resolveFieldPathAsNumber(entity, "rating ?? year")).toBe(8.5);
    });

    it("should parse string to number", () => {
      expect(resolveFieldPathAsNumber(entity, "score")).toBe(95);
    });

    it("should use fallback path when first is missing", () => {
      expect(resolveFieldPathAsNumber(entity, "rank ?? rating")).toBe(8.5);
    });

    it("should return fallback value when no path matches", () => {
      expect(resolveFieldPathAsNumber(entity, "rank ?? status", 0)).toBe(0);
    });

    it("should return null by default", () => {
      expect(resolveFieldPathAsNumber(entity, "missing")).toBeNull();
    });
  });
});
