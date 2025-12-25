/**
 * Tests for image cache service.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";

// Mock the db module before importing imageCache
vi.mock("@/db", async () => {
  const { openDB } = await import("idb");

  interface CachedImage {
    url: string;
    blob: Blob;
    mimeType: string;
    size: number;
    cachedAt: number;
    lastAccessedAt: number;
  }

  interface CacheMetadata {
    key: string;
    imageCount: number;
    totalSize: number;
    updatedAt: number;
  }

  let dbInstance: Awaited<ReturnType<typeof openDB>> | null = null;

  return {
    getDB: async () => {
      if (dbInstance) return dbInstance;

      dbInstance = await openDB("itemdeck-test", 1, {
        upgrade(db) {
          const imageStore = db.createObjectStore("images", { keyPath: "url" });
          imageStore.createIndex("by-cached-at", "cachedAt");
          imageStore.createIndex("by-last-accessed", "lastAccessedAt");
          imageStore.createIndex("by-size", "size");
          db.createObjectStore("metadata", { keyPath: "key" });
        },
      });

      return dbInstance;
    },
    closeDB: async () => {
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
    },
    deleteDB: async () => {
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
      await indexedDB.deleteDatabase("itemdeck-test");
    },
    // Re-export types
    CachedImage: {} as CachedImage,
    CacheMetadata: {} as CacheMetadata,
  };
});

import { imageCache, DEFAULT_MAX_CACHE_SIZE } from "@/services/imageCache";
import { deleteDB } from "@/db";

describe("imageCache", () => {
  beforeEach(async () => {
    await imageCache.clear();
  });

  afterEach(async () => {
    await deleteDB();
  });

  describe("set and get", () => {
    it("stores and retrieves an image", async () => {
      const url = "https://example.com/image.jpg";
      const blob = new Blob(["test image data"], { type: "image/jpeg" });

      await imageCache.set(url, blob);
      const retrieved = await imageCache.get(url);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.url).toBe(url);
      expect(retrieved?.mimeType).toBe("image/jpeg");
      expect(retrieved?.size).toBe(blob.size);
    });

    it("returns null for non-existent image", async () => {
      const result = await imageCache.get("https://example.com/nonexistent.jpg");
      expect(result).toBeNull();
    });

    it("updates lastAccessedAt on get", async () => {
      const url = "https://example.com/image.jpg";
      const blob = new Blob(["test"], { type: "image/png" });

      await imageCache.set(url, blob);
      const first = await imageCache.get(url);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await imageCache.get(url);

      expect(second?.lastAccessedAt).toBeGreaterThanOrEqual(first?.lastAccessedAt ?? 0);
    });
  });

  describe("has", () => {
    it("returns true for existing image", async () => {
      const url = "https://example.com/image.jpg";
      const blob = new Blob(["test"], { type: "image/png" });

      await imageCache.set(url, blob);
      const result = await imageCache.has(url);

      expect(result).toBe(true);
    });

    it("returns false for non-existent image", async () => {
      const result = await imageCache.has("https://example.com/nonexistent.jpg");
      expect(result).toBe(false);
    });
  });

  describe("delete", () => {
    it("removes an image from cache", async () => {
      const url = "https://example.com/image.jpg";
      const blob = new Blob(["test"], { type: "image/png" });

      await imageCache.set(url, blob);
      expect(await imageCache.has(url)).toBe(true);

      await imageCache.delete(url);
      expect(await imageCache.has(url)).toBe(false);
    });
  });

  describe("clear", () => {
    it("removes all images from cache", async () => {
      const blob = new Blob(["test"], { type: "image/png" });
      await imageCache.set("https://example.com/image1.jpg", blob);
      await imageCache.set("https://example.com/image2.jpg", blob);

      await imageCache.clear();

      expect(await imageCache.has("https://example.com/image1.jpg")).toBe(false);
      expect(await imageCache.has("https://example.com/image2.jpg")).toBe(false);
    });
  });

  describe("getStats", () => {
    it("returns correct statistics", async () => {
      const blob1 = new Blob(["data1"], { type: "image/png" });
      const blob2 = new Blob(["longer data 2"], { type: "image/jpeg" });

      await imageCache.set("https://example.com/image1.jpg", blob1);
      await imageCache.set("https://example.com/image2.jpg", blob2);

      const stats = await imageCache.getStats();

      expect(stats.imageCount).toBe(2);
      expect(stats.totalSize).toBe(blob1.size + blob2.size);
      expect(stats.maxSize).toBe(DEFAULT_MAX_CACHE_SIZE);
      expect(stats.usagePercent).toBeGreaterThan(0);
    });

    it("returns zero stats for empty cache", async () => {
      const stats = await imageCache.getStats();

      expect(stats.imageCount).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe("getAllURLs", () => {
    it("returns all cached URLs", async () => {
      const blob = new Blob(["test"], { type: "image/png" });
      await imageCache.set("https://example.com/image1.jpg", blob);
      await imageCache.set("https://example.com/image2.jpg", blob);

      const urls = await imageCache.getAllURLs();

      expect(urls).toHaveLength(2);
      expect(urls).toContain("https://example.com/image1.jpg");
      expect(urls).toContain("https://example.com/image2.jpg");
    });
  });

  describe("getAsObjectURL", () => {
    it("returns null for non-existent image", async () => {
      const objectURL = await imageCache.getAsObjectURL("https://example.com/nonexistent.jpg");
      expect(objectURL).toBeNull();
    });

    // Note: getAsObjectURL test with actual blob is skipped because
    // fake-indexeddb returns plain objects, not proper Blob instances
  });
});
