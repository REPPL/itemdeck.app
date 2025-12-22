/**
 * Tests for image selector.
 */

import { describe, it, expect } from "vitest";
import {
  selectImage,
  selectImages,
  getPrimaryImage,
  getPrimaryImageUrl,
  getImageUrls,
} from "@/loaders/imageSelector";
import type { Image } from "@/types/image";

describe("imageSelector", () => {
  const testImages: Image[] = [
    { url: "https://example.com/cover.jpg", type: "cover", alt: "Cover art" },
    { url: "https://example.com/screenshot1.jpg", type: "screenshot" },
    { url: "https://example.com/screenshot2.jpg", type: "screenshot" },
    { url: "https://example.com/logo.png", type: "logo" },
  ];

  describe("selectImages", () => {
    it("should return empty array for empty input", () => {
      expect(selectImages([], "images[0]")).toEqual([]);
    });

    it("should select by index", () => {
      const result = selectImages(testImages, "images[0]");
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe("https://example.com/cover.jpg");
    });

    it("should select by type filter", () => {
      const result = selectImages(testImages, "images[type=screenshot]");
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe("https://example.com/screenshot1.jpg");
      expect(result[1].url).toBe("https://example.com/screenshot2.jpg");
    });

    it("should combine filter and index", () => {
      const result = selectImages(testImages, "images[type=screenshot][1]");
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe("https://example.com/screenshot2.jpg");
    });

    it("should handle fallback with ??", () => {
      // Try to find a type that doesn't exist, fall back to first image
      const result = selectImages(
        testImages,
        "images[type=promotional][0] ?? images[0]"
      );
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe("https://example.com/cover.jpg");
    });

    it("should use first fallback that matches", () => {
      const result = selectImages(
        testImages,
        "images[type=cover][0] ?? images[0]"
      );
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe("https://example.com/cover.jpg");
    });
  });

  describe("selectImage", () => {
    it("should return undefined for empty input", () => {
      expect(selectImage([], "images[0]")).toBeUndefined();
    });

    it("should return single image", () => {
      const result = selectImage(testImages, "images[type=logo][0]");
      expect(result).toBeDefined();
      expect(result?.url).toBe("https://example.com/logo.png");
    });

    it("should return undefined when no match", () => {
      const result = selectImage(testImages, "images[type=artwork][0]");
      expect(result).toBeUndefined();
    });
  });

  describe("getPrimaryImage", () => {
    it("should return cover image by default", () => {
      const result = getPrimaryImage(testImages);
      expect(result).toBeDefined();
      expect(result?.type).toBe("cover");
    });

    it("should fall back to first image when no cover", () => {
      const noCover = testImages.filter((img) => img.type !== "cover");
      const result = getPrimaryImage(noCover);
      expect(result).toBeDefined();
      expect(result?.url).toBe("https://example.com/screenshot1.jpg");
    });

    it("should return undefined for empty array", () => {
      expect(getPrimaryImage([])).toBeUndefined();
      expect(getPrimaryImage(undefined)).toBeUndefined();
    });

    it("should use custom expression when provided", () => {
      const result = getPrimaryImage(testImages, "images[type=logo][0]");
      expect(result?.type).toBe("logo");
    });
  });

  describe("getPrimaryImageUrl", () => {
    it("should return URL of primary image", () => {
      const result = getPrimaryImageUrl(testImages);
      expect(result).toBe("https://example.com/cover.jpg");
    });

    it("should return fallback URL when no images", () => {
      const result = getPrimaryImageUrl([], undefined, "https://fallback.com");
      expect(result).toBe("https://fallback.com");
    });

    it("should return empty string when no fallback", () => {
      const result = getPrimaryImageUrl([]);
      expect(result).toBe("");
    });
  });

  describe("getImageUrls", () => {
    it("should return all URLs", () => {
      const result = getImageUrls(testImages);
      expect(result).toHaveLength(4);
      expect(result[0]).toBe("https://example.com/cover.jpg");
    });

    it("should return empty array for undefined", () => {
      expect(getImageUrls(undefined)).toEqual([]);
    });
  });
});
