/**
 * Image caching service using IndexedDB.
 *
 * Provides methods to cache, retrieve, and manage cached images.
 * Implements LRU eviction when storage limits are reached.
 */

import { getDB, type CachedImage, type CacheMetadata } from "@/db";

/**
 * Default maximum cache size in bytes (50MB).
 */
const DEFAULT_MAX_CACHE_SIZE = 50 * 1024 * 1024;

/**
 * Upper bound on the images preloaded in one pass.
 *
 * The preload list is the flattened `imageUrls` of every card, and both the
 * entity count and the per-card media list come from untrusted collection
 * data. The loading overlay only clears at 100% progress and offers no skip,
 * so an unbounded list is a lockout rather than a slow load. Generous enough
 * that real collections never reach it.
 */
const MAX_PRELOAD_URLS = 2000;

/**
 * Metadata key for image cache stats.
 */
const IMAGE_CACHE_METADATA_KEY = "image-cache-stats";

/**
 * Cache options for storing images.
 */
export interface CacheOptions {
  /** Maximum cache size in bytes */
  maxSize?: number;

  /** Whether to update last accessed timestamp on get */
  updateAccessTime?: boolean;
}

/**
 * Cache statistics.
 */
export interface CacheStats {
  /** Number of cached images */
  imageCount: number;

  /** Total size in bytes */
  totalSize: number;

  /** Last updated timestamp */
  updatedAt: number;

  /** Maximum allowed size */
  maxSize: number;

  /** Percentage of cache used */
  usagePercent: number;
}

/**
 * Image cache service.
 */
export const imageCache = {
  /**
   * Get a cached image by URL.
   *
   * @param url - Image URL
   * @param options - Cache options
   * @returns Cached image or null if not found
   */
  async get(
    url: string,
    options: CacheOptions = {}
  ): Promise<CachedImage | null> {
    const { updateAccessTime = true } = options;

    try {
      const db = await getDB();
      const image = await db.get("images", url);

      if (!image) {
        return null;
      }

      // Update last accessed time
      if (updateAccessTime) {
        const now = Date.now();
        await db.put("images", {
          ...image,
          lastAccessedAt: now,
        });
      }

      return image;
    } catch (error) {
      console.warn("[imageCache] Failed to get image:", url, error);
      return null;
    }
  },

  /**
   * Get a cached image as an object URL.
   *
   * @param url - Image URL
   * @returns Object URL or null if not found
   */
  async getAsObjectURL(url: string): Promise<string | null> {
    const image = await this.get(url);
    if (!image) {
      return null;
    }
    return URL.createObjectURL(image.blob);
  },

  /**
   * Store an image in the cache.
   *
   * @param url - Image URL
   * @param blob - Image blob data
   * @param metadata - Optional metadata (width, height)
   * @param options - Cache options
   */
  async set(
    url: string,
    blob: Blob,
    metadata: { width?: number; height?: number } = {},
    options: CacheOptions = {}
  ): Promise<void> {
    const { maxSize = DEFAULT_MAX_CACHE_SIZE } = options;

    try {
      const db = await getDB();
      const now = Date.now();

      const cachedImage: CachedImage = {
        url,
        blob,
        mimeType: blob.type,
        size: blob.size,
        cachedAt: now,
        lastAccessedAt: now,
        width: metadata.width,
        height: metadata.height,
      };

      // Refuse blobs that cannot fit within the budget on their own. Storing
      // one would blow past maxSize no matter how much is evicted, and asking
      // evictLRU to free more than maxSize makes its target negative, wiping
      // every other cached image. A single oversized (or attacker-supplied)
      // image must not be able to evict the whole cache or exceed the budget.
      if (blob.size > maxSize) {
        console.warn(
          "[imageCache] Skipping image larger than cache budget:",
          url
        );
        return;
      }

      // Check if we need to evict old images
      const stats = await this.getStats();
      if (stats.totalSize + blob.size > maxSize) {
        await this.evictLRU(blob.size, maxSize);
      }

      // Store the image and adjust the running totals in the same
      // transaction. Recomputing the totals with a full store scan per write
      // made caching cost grow with the square of the image count; doing the
      // read-modify-write inside the transaction that stores the image keeps
      // the counters correct under the concurrent writes the preloader
      // issues, which a bare increment outside it would not.
      const tx = db.transaction(["images", "metadata"], "readwrite");
      const images = tx.objectStore("images");
      const metadataStore = tx.objectStore("metadata");

      const previous = await images.get(url);
      await images.put(cachedImage);

      const current = await metadataStore.get(IMAGE_CACHE_METADATA_KEY);

      if (current) {
        await metadataStore.put({
          key: IMAGE_CACHE_METADATA_KEY,
          // Re-storing a url replaces the existing record rather than
          // adding one, so only its size difference counts.
          imageCount: previous ? current.imageCount : current.imageCount + 1,
          totalSize: current.totalSize - (previous?.size ?? 0) + blob.size,
          updatedAt: now,
        });
      } else {
        // No metadata record yet (first write, or a store populated before
        // one existed): reconcile from the store this once.
        let totalSize = 0;
        let imageCount = 0;
        for await (const cursor of images) {
          totalSize += cursor.value.size;
          imageCount++;
        }
        await metadataStore.put({
          key: IMAGE_CACHE_METADATA_KEY,
          imageCount,
          totalSize,
          updatedAt: now,
        });
      }

      await tx.done;
    } catch (error) {
      console.warn("[imageCache] Failed to cache image:", url, error);
    }
  },

  /**
   * Check if an image is cached.
   *
   * @param url - Image URL
   * @returns True if cached
   */
  async has(url: string): Promise<boolean> {
    try {
      const db = await getDB();
      const count = await db.count("images", url);
      return count > 0;
    } catch {
      return false;
    }
  },

  /**
   * Delete a cached image.
   *
   * @param url - Image URL
   */
  async delete(url: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete("images", url);
      await this.updateMetadata();
    } catch (error) {
      console.warn("[imageCache] Failed to delete image:", url, error);
    }
  },

  /**
   * Clear all cached images.
   */
  async clear(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear("images");
      await this.updateMetadata();
    } catch (error) {
      console.warn("[imageCache] Failed to clear cache:", error);
    }
  },

  /**
   * Get cache statistics.
   *
   * @param maxSize - Maximum cache size for percentage calculation
   * @returns Cache statistics
   */
  async getStats(
    maxSize: number = DEFAULT_MAX_CACHE_SIZE
  ): Promise<CacheStats> {
    try {
      const db = await getDB();
      const metadata = await db.get("metadata", IMAGE_CACHE_METADATA_KEY);

      if (metadata) {
        return {
          imageCount: metadata.imageCount,
          totalSize: metadata.totalSize,
          updatedAt: metadata.updatedAt,
          maxSize,
          usagePercent: (metadata.totalSize / maxSize) * 100,
        };
      }

      // Calculate if no metadata exists
      const tx = db.transaction("images", "readonly");
      const store = tx.objectStore("images");
      let totalSize = 0;
      let imageCount = 0;

      for await (const cursor of store) {
        totalSize += cursor.value.size;
        imageCount++;
      }

      return {
        imageCount,
        totalSize,
        updatedAt: Date.now(),
        maxSize,
        usagePercent: (totalSize / maxSize) * 100,
      };
    } catch {
      return {
        imageCount: 0,
        totalSize: 0,
        updatedAt: Date.now(),
        maxSize,
        usagePercent: 0,
      };
    }
  },

  /**
   * Update cache metadata after changes.
   */
  async updateMetadata(): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction("images", "readonly");
      const store = tx.objectStore("images");

      let totalSize = 0;
      let imageCount = 0;

      for await (const cursor of store) {
        totalSize += cursor.value.size;
        imageCount++;
      }

      const metadata: CacheMetadata = {
        key: IMAGE_CACHE_METADATA_KEY,
        imageCount,
        totalSize,
        updatedAt: Date.now(),
      };

      await db.put("metadata", metadata);
    } catch (error) {
      console.warn("[imageCache] Failed to update metadata:", error);
    }
  },

  /**
   * Evict least recently used images to free space.
   *
   * @param requiredSpace - Space needed in bytes
   * @param maxSize - Maximum cache size
   */
  async evictLRU(requiredSpace: number, maxSize: number): Promise<void> {
    try {
      const db = await getDB();
      const stats = await this.getStats(maxSize);

      // Calculate how much we need to free. Floor at zero: a requiredSpace
      // larger than maxSize would otherwise make the target negative, so the
      // break condition below could never be met and the loop would delete
      // every cached entry.
      const targetSize = Math.max(0, maxSize - requiredSpace);
      let currentSize = stats.totalSize;

      if (currentSize <= targetSize) {
        return; // Already have enough space
      }

      // Delete the least recently used images and adjust the running totals
      // in one transaction, so eviction does not reintroduce the full store
      // scan that made every write quadratic once the cache filled up.
      const tx = db.transaction(["images", "metadata"], "readwrite");
      const index = tx.objectStore("images").index("by-last-accessed");
      const imagesToDelete: string[] = [];
      let freedSize = 0;

      for await (const cursor of index) {
        if (currentSize <= targetSize) {
          break;
        }

        imagesToDelete.push(cursor.value.url);
        currentSize -= cursor.value.size;
        freedSize += cursor.value.size;
        await cursor.delete();
      }

      const metadataStore = tx.objectStore("metadata");
      const current = await metadataStore.get(IMAGE_CACHE_METADATA_KEY);

      if (current) {
        await metadataStore.put({
          key: IMAGE_CACHE_METADATA_KEY,
          imageCount: Math.max(0, current.imageCount - imagesToDelete.length),
          totalSize: Math.max(0, current.totalSize - freedSize),
          updatedAt: Date.now(),
        });
      }

      await tx.done;

      if (imagesToDelete.length > 0) {
        console.info(
          `[imageCache] Evicted ${String(imagesToDelete.length)} images to free space`
        );
      }
    } catch (error) {
      console.warn("[imageCache] Failed to evict images:", error);
    }
  },

  /**
   * Get all cached image URLs.
   *
   * @returns Array of cached URLs
   */
  async getAllURLs(): Promise<string[]> {
    try {
      const db = await getDB();
      return await db.getAllKeys("images");
    } catch {
      return [];
    }
  },
};

/**
 * Fetch and cache an image.
 *
 * @param url - Image URL to fetch
 * @param options - Cache options
 * @returns Cached image blob or null on failure
 */
export async function fetchAndCacheImage(
  url: string,
  options: CacheOptions = {}
): Promise<Blob | null> {
  // Check if already cached
  const cached = await imageCache.get(url, options);
  if (cached) {
    return cached.blob;
  }

  try {
    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${String(response.status)}`);
    }

    const blob = await response.blob();

    // Only cache images
    if (!blob.type.startsWith("image/")) {
      console.warn("[imageCache] Not an image:", url, blob.type);
      return blob;
    }

    // Cache the image
    await imageCache.set(url, blob, {}, options);

    return blob;
  } catch (error) {
    console.warn("[imageCache] Failed to fetch and cache:", url, error);
    return null;
  }
}

/**
 * Preload multiple images into the cache.
 *
 * @param urls - Array of image URLs to preload
 * @param options - Cache options
 * @param onProgress - Progress callback (completed, total)
 * @returns Number of successfully cached images
 */
export async function preloadImages(
  urls: string[],
  options: CacheOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<number> {
  let completed = 0;
  let successful = 0;

  // Bound the work. The url list is assembled from every card in an
  // untrusted collection with no aggregate cap, and the loading screen only
  // clears once progress reaches 100%, so an unbounded list leaves the app
  // permanently stuck behind the overlay.
  let targets = urls;
  if (targets.length > MAX_PRELOAD_URLS) {
    console.warn(
      `[imageCache] Collection lists ${String(targets.length)} images; preloading the first ${String(MAX_PRELOAD_URLS)}.`
    );
    targets = targets.slice(0, MAX_PRELOAD_URLS);
  }

  // Read the cached url set once rather than probing the store per url: the
  // probe loop ran to completion before the first progress tick, so a long
  // list froze the loading screen with no feedback at all.
  const alreadyCached = new Set(await imageCache.getAllURLs());

  // Filter out already cached URLs
  const uncachedUrls: string[] = [];
  for (const url of targets) {
    if (!alreadyCached.has(url)) {
      uncachedUrls.push(url);
    } else {
      completed++;
      successful++;
    }
  }

  // Report initial progress (already cached)
  if (onProgress) {
    onProgress(completed, targets.length);
  }

  // Fetch remaining images in batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < uncachedUrls.length; i += BATCH_SIZE) {
    const batch = uncachedUrls.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((url) => fetchAndCacheImage(url, options))
    );

    for (const result of results) {
      completed++;
      if (result.status === "fulfilled" && result.value) {
        successful++;
      }
    }

    if (onProgress) {
      onProgress(completed, targets.length);
    }
  }

  return successful;
}

// Export default max size for external use
export { DEFAULT_MAX_CACHE_SIZE };
