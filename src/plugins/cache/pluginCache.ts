/**
 * Plugin cache module using IndexedDB.
 *
 * Provides persistent storage for plugin manifests, assets, and configurations.
 * Uses a separate database from the main itemdeck cache to keep concerns separated.
 *
 * @module plugins/cache/pluginCache
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PluginManifest, PluginTier } from "@/plugins/schemas";

// ============================================================================
// Constants
// ============================================================================

/** Database name for plugin cache */
const PLUGIN_DB_NAME = "itemdeck-plugins";

/** Current database version */
const PLUGIN_DB_VERSION = 1;

/** Default cache TTL in milliseconds (7 days) */
const DEFAULT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

/**
 * Cached plugin manifest entry.
 */
export interface CachedManifest {
  /** Plugin ID (key) */
  pluginId: string;
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Distribution tier */
  tier: PluginTier;
  /** Source URL (for community plugins) */
  sourceUrl?: string;
  /** When the manifest was cached */
  cachedAt: number;
  /** When the cache expires */
  expiresAt: number;
  /** ETag for conditional requests */
  etag?: string;
}

/**
 * Cached plugin asset entry.
 */
export interface CachedAsset {
  /** Asset key: `${pluginId}/${assetPath}` */
  key: string;
  /** Plugin ID */
  pluginId: string;
  /** Asset path relative to plugin root */
  assetPath: string;
  /** Asset data as blob */
  data: Blob;
  /** MIME type */
  mimeType: string;
  /** Size in bytes */
  size: number;
  /** When the asset was cached */
  cachedAt: number;
}

/**
 * Plugin configuration entry.
 */
export interface CachedConfig {
  /** Plugin ID (key) */
  pluginId: string;
  /** Configuration data */
  config: Record<string, unknown>;
  /** When the config was last updated */
  updatedAt: number;
}

/**
 * Cache statistics entry.
 */
export interface CacheStats {
  /** Stats key (always "stats") */
  key: string;
  /** Total cached manifests */
  manifestCount: number;
  /** Total cached assets */
  assetCount: number;
  /** Total asset size in bytes */
  totalAssetSize: number;
  /** Last updated timestamp */
  updatedAt: number;
}

// ============================================================================
// Database Schema
// ============================================================================

/**
 * Plugin cache database schema.
 */
interface PluginCacheDB extends DBSchema {
  /** Cached manifests store */
  manifests: {
    key: string;
    value: CachedManifest;
    indexes: {
      "by-tier": PluginTier;
      "by-expires": number;
      "by-cached-at": number;
    };
  };

  /** Cached assets store */
  assets: {
    key: string;
    value: CachedAsset;
    indexes: {
      "by-plugin": string;
      "by-cached-at": number;
      "by-size": number;
    };
  };

  /** Plugin configurations store */
  configs: {
    key: string;
    value: CachedConfig;
    indexes: {
      "by-updated-at": number;
    };
  };

  /** Cache statistics */
  stats: {
    key: string;
    value: CacheStats;
  };
}

// ============================================================================
// Database Instance
// ============================================================================

/** Database instance singleton */
let dbInstance: IDBPDatabase<PluginCacheDB> | null = null;

/**
 * Get or create the plugin cache database instance.
 */
export async function getPluginDB(): Promise<IDBPDatabase<PluginCacheDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<PluginCacheDB>(PLUGIN_DB_NAME, PLUGIN_DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, _transaction) {
      // Version 1: Initial schema
      if (oldVersion < 1) {
        // Create manifests store
        const manifestStore = db.createObjectStore("manifests", { keyPath: "pluginId" });
        manifestStore.createIndex("by-tier", "tier");
        manifestStore.createIndex("by-expires", "expiresAt");
        manifestStore.createIndex("by-cached-at", "cachedAt");

        // Create assets store
        const assetStore = db.createObjectStore("assets", { keyPath: "key" });
        assetStore.createIndex("by-plugin", "pluginId");
        assetStore.createIndex("by-cached-at", "cachedAt");
        assetStore.createIndex("by-size", "size");

        // Create configs store
        const configStore = db.createObjectStore("configs", { keyPath: "pluginId" });
        configStore.createIndex("by-updated-at", "updatedAt");

        // Create stats store
        db.createObjectStore("stats", { keyPath: "key" });
      }
    },
    blocked() {
      console.warn("[itemdeck-plugins] Database upgrade blocked by another tab");
    },
    blocking() {
      console.warn("[itemdeck-plugins] This tab is blocking a database upgrade");
      dbInstance?.close();
      dbInstance = null;
    },
    terminated() {
      console.warn("[itemdeck-plugins] Database connection terminated unexpectedly");
      dbInstance = null;
    },
  });

  return dbInstance;
}

/**
 * Close the plugin cache database connection.
 */
export function closePluginDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// ============================================================================
// Manifest Cache Operations
// ============================================================================

/**
 * Cache a plugin manifest.
 *
 * @param manifest - Plugin manifest to cache
 * @param tier - Distribution tier
 * @param sourceUrl - Source URL (for community plugins)
 * @param ttl - Cache TTL in milliseconds (default: 7 days)
 */
export async function cacheManifest(
  manifest: PluginManifest,
  tier: PluginTier,
  sourceUrl?: string,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<void> {
  const db = await getPluginDB();
  const now = Date.now();

  await db.put("manifests", {
    pluginId: manifest.id,
    manifest,
    tier,
    sourceUrl,
    cachedAt: now,
    expiresAt: now + ttl,
  });

  await updateStats();
}

/**
 * Get a cached manifest by plugin ID.
 *
 * @param pluginId - Plugin ID
 * @param ignoreExpiry - Whether to return expired entries
 * @returns Cached manifest or undefined
 */
export async function getCachedManifest(
  pluginId: string,
  ignoreExpiry = false
): Promise<CachedManifest | undefined> {
  const db = await getPluginDB();
  const entry = await db.get("manifests", pluginId);

  if (!entry) return undefined;

  // Check expiry
  if (!ignoreExpiry && entry.expiresAt < Date.now()) {
    return undefined;
  }

  return entry;
}

/**
 * Get all cached manifests.
 *
 * @param tier - Filter by tier (optional)
 * @param includeExpired - Include expired entries
 * @returns Array of cached manifests
 */
export async function getAllCachedManifests(
  tier?: PluginTier,
  includeExpired = false
): Promise<CachedManifest[]> {
  const db = await getPluginDB();
  const now = Date.now();

  let manifests: CachedManifest[];

  if (tier) {
    manifests = await db.getAllFromIndex("manifests", "by-tier", tier);
  } else {
    manifests = await db.getAll("manifests");
  }

  if (!includeExpired) {
    manifests = manifests.filter((m) => m.expiresAt > now);
  }

  return manifests;
}

/**
 * Delete a cached manifest.
 *
 * @param pluginId - Plugin ID to delete
 */
export async function deleteCachedManifest(pluginId: string): Promise<void> {
  const db = await getPluginDB();
  await db.delete("manifests", pluginId);
  await updateStats();
}

/**
 * Clear expired manifests.
 *
 * @returns Number of entries cleared
 */
export async function clearExpiredManifests(): Promise<number> {
  const db = await getPluginDB();
  const now = Date.now();

  const expired = await db.getAllFromIndex("manifests", "by-expires");
  let cleared = 0;

  for (const entry of expired) {
    if (entry.expiresAt < now) {
      await db.delete("manifests", entry.pluginId);
      cleared++;
    } else {
      // Index is sorted, so we can stop early
      break;
    }
  }

  if (cleared > 0) {
    await updateStats();
  }

  return cleared;
}

// ============================================================================
// Asset Cache Operations
// ============================================================================

/**
 * Cache a plugin asset.
 *
 * @param pluginId - Plugin ID
 * @param assetPath - Asset path relative to plugin root
 * @param data - Asset data as blob
 * @param mimeType - MIME type
 */
export async function cacheAsset(
  pluginId: string,
  assetPath: string,
  data: Blob,
  mimeType: string
): Promise<void> {
  const db = await getPluginDB();
  const key = `${pluginId}/${assetPath}`;

  await db.put("assets", {
    key,
    pluginId,
    assetPath,
    data,
    mimeType,
    size: data.size,
    cachedAt: Date.now(),
  });

  await updateStats();
}

/**
 * Get a cached asset.
 *
 * @param pluginId - Plugin ID
 * @param assetPath - Asset path
 * @returns Cached asset or undefined
 */
export async function getCachedAsset(
  pluginId: string,
  assetPath: string
): Promise<CachedAsset | undefined> {
  const db = await getPluginDB();
  const key = `${pluginId}/${assetPath}`;
  return db.get("assets", key);
}

/**
 * Get all assets for a plugin.
 *
 * @param pluginId - Plugin ID
 * @returns Array of cached assets
 */
export async function getPluginAssets(pluginId: string): Promise<CachedAsset[]> {
  const db = await getPluginDB();
  return db.getAllFromIndex("assets", "by-plugin", pluginId);
}

/**
 * Delete a cached asset.
 *
 * @param pluginId - Plugin ID
 * @param assetPath - Asset path
 */
export async function deleteCachedAsset(
  pluginId: string,
  assetPath: string
): Promise<void> {
  const db = await getPluginDB();
  const key = `${pluginId}/${assetPath}`;
  await db.delete("assets", key);
  await updateStats();
}

/**
 * Delete all assets for a plugin.
 *
 * @param pluginId - Plugin ID
 * @returns Number of assets deleted
 */
export async function deletePluginAssets(pluginId: string): Promise<number> {
  const db = await getPluginDB();
  const assets = await db.getAllFromIndex("assets", "by-plugin", pluginId);

  for (const asset of assets) {
    await db.delete("assets", asset.key);
  }

  await updateStats();
  return assets.length;
}

// ============================================================================
// Config Cache Operations
// ============================================================================

/**
 * Cache a plugin configuration.
 *
 * @param pluginId - Plugin ID
 * @param config - Configuration data
 */
export async function cacheConfig(
  pluginId: string,
  config: Record<string, unknown>
): Promise<void> {
  const db = await getPluginDB();

  await db.put("configs", {
    pluginId,
    config,
    updatedAt: Date.now(),
  });
}

/**
 * Get a cached configuration.
 *
 * @param pluginId - Plugin ID
 * @returns Cached config or undefined
 */
export async function getCachedConfig(
  pluginId: string
): Promise<CachedConfig | undefined> {
  const db = await getPluginDB();
  return db.get("configs", pluginId);
}

/**
 * Delete a cached configuration.
 *
 * @param pluginId - Plugin ID
 */
export async function deleteCachedConfig(pluginId: string): Promise<void> {
  const db = await getPluginDB();
  await db.delete("configs", pluginId);
}

// ============================================================================
// Cache Statistics
// ============================================================================

/**
 * Update cache statistics.
 */
async function updateStats(): Promise<void> {
  const db = await getPluginDB();

  const manifests = await db.count("manifests");
  const assets = await db.getAll("assets");

  const totalAssetSize = assets.reduce((sum, a) => sum + a.size, 0);

  await db.put("stats", {
    key: "stats",
    manifestCount: manifests,
    assetCount: assets.length,
    totalAssetSize,
    updatedAt: Date.now(),
  });
}

/**
 * Get cache statistics.
 *
 * @returns Cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  const db = await getPluginDB();
  const stats = await db.get("stats", "stats");

  if (stats) return stats;

  // Return empty stats if none exist
  return {
    key: "stats",
    manifestCount: 0,
    assetCount: 0,
    totalAssetSize: 0,
    updatedAt: Date.now(),
  };
}

// ============================================================================
// Cache Cleanup
// ============================================================================

/**
 * Clear all plugin data for a specific plugin.
 *
 * @param pluginId - Plugin ID
 */
export async function clearPluginCache(pluginId: string): Promise<void> {
  await deleteCachedManifest(pluginId);
  await deletePluginAssets(pluginId);
  await deleteCachedConfig(pluginId);
}

/**
 * Clear the entire plugin cache.
 */
export async function clearAllPluginCache(): Promise<void> {
  const db = await getPluginDB();

  await db.clear("manifests");
  await db.clear("assets");
  await db.clear("configs");
  await db.clear("stats");
}

/**
 * Perform cache maintenance (clear expired entries, update stats).
 *
 * @returns Maintenance results
 */
export async function performCacheMaintenance(): Promise<{
  expiredManifestsCleared: number;
  stats: CacheStats;
}> {
  const expiredManifestsCleared = await clearExpiredManifests();
  const stats = await getCacheStats();

  return {
    expiredManifestsCleared,
    stats,
  };
}
