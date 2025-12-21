/**
 * Card data caching with IndexedDB.
 *
 * Provides persistent storage for collection data to enable
 * offline viewing. Uses idb-keyval for simple key-value storage.
 */

import { get, set, del, keys } from "idb-keyval";
import type { Collection } from "@/schemas";

/**
 * Cache key prefix for card collections.
 */
const CACHE_KEY_PREFIX = "itemdeck-collection-";

/**
 * Current cache version.
 * Increment when cache format changes.
 */
const CACHE_VERSION = "1.0.0";

/**
 * Default cache expiration (24 hours in milliseconds).
 */
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * Cached data wrapper with metadata.
 */
interface CachedData<T> {
  /** The cached data */
  data: T;

  /** Timestamp when cached (milliseconds since epoch) */
  timestamp: number;

  /** Cache format version */
  version: string;
}

/**
 * Generate a cache key for a data source.
 *
 * @param sourceId - Unique identifier for the data source
 * @returns Cache key
 */
function getCacheKey(sourceId: string): string {
  return `${CACHE_KEY_PREFIX}${sourceId}`;
}

/**
 * Cache a collection to IndexedDB.
 *
 * @param sourceId - Unique identifier for the data source
 * @param collection - Collection data to cache
 */
export async function cacheCollection(
  sourceId: string,
  collection: Collection
): Promise<void> {
  const cacheKey = getCacheKey(sourceId);
  const cached: CachedData<Collection> = {
    data: collection,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };

  await set(cacheKey, cached);
}

/**
 * Retrieve a cached collection from IndexedDB.
 *
 * @param sourceId - Unique identifier for the data source
 * @param maxAge - Maximum age in milliseconds (default: 24 hours)
 * @returns Cached collection or null if not found/expired
 */
export async function getCachedCollection(
  sourceId: string,
  maxAge = DEFAULT_MAX_AGE
): Promise<Collection | null> {
  const cacheKey = getCacheKey(sourceId);

  try {
    const cached = await get<CachedData<Collection>>(cacheKey);

    if (!cached) {
      return null;
    }

    // Check version compatibility
    if (cached.version !== CACHE_VERSION) {
      await del(cacheKey);
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > maxAge) {
      await del(cacheKey);
      return null;
    }

    return cached.data;
  } catch (error) {
    // Handle IndexedDB errors gracefully
    console.warn("Failed to read from cache:", error);
    return null;
  }
}

/**
 * Clear a specific cached collection.
 *
 * @param sourceId - Unique identifier for the data source
 */
export async function clearCollectionCache(sourceId: string): Promise<void> {
  const cacheKey = getCacheKey(sourceId);
  await del(cacheKey);
}

/**
 * Clear all cached collections.
 */
export async function clearAllCollectionCaches(): Promise<void> {
  try {
    const allKeys = await keys();
    const collectionKeys = allKeys.filter(
      (key) => typeof key === "string" && key.startsWith(CACHE_KEY_PREFIX)
    );

    await Promise.all(collectionKeys.map((key) => del(key)));
  } catch (error) {
    console.warn("Failed to clear caches:", error);
  }
}

/**
 * Get the age of a cached collection.
 *
 * @param sourceId - Unique identifier for the data source
 * @returns Age in milliseconds, or null if not cached
 */
export async function getCacheAge(sourceId: string): Promise<number | null> {
  const cacheKey = getCacheKey(sourceId);

  try {
    const cached = await get<CachedData<Collection>>(cacheKey);

    if (!cached) {
      return null;
    }

    return Date.now() - cached.timestamp;
  } catch {
    return null;
  }
}

/**
 * Check if a collection is cached and valid.
 *
 * @param sourceId - Unique identifier for the data source
 * @param maxAge - Maximum age in milliseconds (default: 24 hours)
 * @returns True if cached and not expired
 */
export async function isCollectionCached(
  sourceId: string,
  maxAge = DEFAULT_MAX_AGE
): Promise<boolean> {
  const age = await getCacheAge(sourceId);
  return age !== null && age < maxAge;
}
