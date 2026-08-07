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
      const result = await imageCache.get(
        "https://example.com/nonexistent.jpg"
      );
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

      expect(second?.lastAccessedAt).toBeGreaterThanOrEqual(
        first?.lastAccessedAt ?? 0
      );
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
      const result = await imageCache.has(
        "https://example.com/nonexistent.jpg"
      );
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

      expect(await imageCache.has("https://example.com/image1.jpg")).toBe(
        false
      );
      expect(await imageCache.has("https://example.com/image2.jpg")).toBe(
        false
      );
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
      const objectURL = await imageCache.getAsObjectURL(
        "https://example.com/nonexistent.jpg"
      );
      expect(objectURL).toBeNull();
    });

    // Note: getAsObjectURL test with actual blob is skipped because
    // fake-indexeddb returns plain objects, not proper Blob instances
  });

  describe("eviction with oversized blobs", () => {
    it("does not evict the whole cache when a blob exceeds the budget", async () => {
      const maxSize = 1000;

      // Seed the cache with a small, valid image.
      const small = new Blob(["a".repeat(100)], { type: "image/png" });
      await imageCache.set(
        "https://example.com/keep.png",
        small,
        {},
        { maxSize }
      );
      expect(await imageCache.has("https://example.com/keep.png")).toBe(true);

      // A single blob larger than the entire budget must be refused outright,
      // and must not wipe the previously cached image.
      const huge = new Blob(["b".repeat(5000)], { type: "image/png" });
      await imageCache.set(
        "https://example.com/huge.png",
        huge,
        {},
        { maxSize }
      );

      expect(await imageCache.has("https://example.com/huge.png")).toBe(false);
      expect(await imageCache.has("https://example.com/keep.png")).toBe(true);
    });

    it("keeps the cache within budget after an oversized blob", async () => {
      const maxSize = 1000;
      const small = new Blob(["a".repeat(200)], { type: "image/png" });
      await imageCache.set("https://example.com/a.png", small, {}, { maxSize });

      const huge = new Blob(["b".repeat(9000)], { type: "image/png" });
      await imageCache.set(
        "https://example.com/huge.png",
        huge,
        {},
        { maxSize }
      );

      const stats = await imageCache.getStats(maxSize);
      expect(stats.totalSize).toBeLessThanOrEqual(maxSize);
    });
  });
});

describe("imageCache metadata maintenance", () => {
  beforeEach(async () => {
    await imageCache.clear();
  });

  afterEach(async () => {
    await deleteDB();
  });

  it("keeps metadata accurate across many stores", async () => {
    for (let i = 0; i < 50; i++) {
      await imageCache.set(
        `https://example.com/${String(i)}.jpg`,
        new Blob([`payload-${String(i)}`], { type: "image/jpeg" })
      );
    }

    const stats = await imageCache.getStats();
    const urls = await imageCache.getAllURLs();

    expect(stats.imageCount).toBe(50);
    expect(urls).toHaveLength(50);

    let actualSize = 0;
    for (const url of urls) {
      const image = await imageCache.get(url);
      actualSize += image?.size ?? 0;
    }
    expect(stats.totalSize).toBe(actualSize);
  });

  it("does not double-count when the same url is stored twice", async () => {
    const url = "https://example.com/same.jpg";

    await imageCache.set(url, new Blob(["first"], { type: "image/jpeg" }));
    await imageCache.set(
      url,
      new Blob(["second-and-longer"], { type: "image/jpeg" })
    );

    const stats = await imageCache.getStats();
    const stored = await imageCache.get(url);

    expect(stats.imageCount).toBe(1);
    expect(stats.totalSize).toBe(stored?.size);
  });

  it("keeps metadata accurate after eviction", async () => {
    // Budget fits a couple of entries, so storing more forces eviction.
    const blob = new Blob([new Uint8Array(1000)], { type: "image/jpeg" });
    const maxSize = blob.size * 3;

    for (let i = 0; i < 8; i++) {
      await imageCache.set(
        `https://example.com/evict-${String(i)}.jpg`,
        new Blob([new Uint8Array(1000)], { type: "image/jpeg" }),
        {},
        { maxSize }
      );
    }

    const stats = await imageCache.getStats();
    const urls = await imageCache.getAllURLs();

    expect(stats.imageCount).toBe(urls.length);
    expect(stats.totalSize).toBeLessThanOrEqual(maxSize);
  });

  it("stores many images without rescanning the whole store each time", async () => {
    const started = Date.now();
    for (let i = 0; i < 800; i++) {
      await imageCache.set(
        `https://example.com/perf-${String(i)}.jpg`,
        new Blob([new Uint8Array(64)], { type: "image/jpeg" })
      );
    }
    const elapsed = Date.now() - started;

    // Pre-fix each store walked every existing record to recompute totals,
    // so this grew with the square of the image count.
    expect(elapsed).toBeLessThan(3000);
  });
});
