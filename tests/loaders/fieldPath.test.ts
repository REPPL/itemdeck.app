/**
 * Tests for field path parser.
 */

import { describe, it, expect } from "vitest";
import {
  getFieldValue,
  getStringValue,
  getNumberValue,
  getImagesValue,
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
});
