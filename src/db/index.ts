/**
 * IndexedDB database module.
 *
 * Provides typed access to IndexedDB using the idb library.
 * Used for caching images, collection data, and user preferences.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * Schema version for migrations.
 */
const DB_VERSION = 1;

/**
 * Database name.
 */
const DB_NAME = "itemdeck";

/**
 * Cached image entry.
 */
export interface CachedImage {
  /** Image URL (key) */
  url: string;

  /** Image blob data */
  blob: Blob;

  /** MIME type */
  mimeType: string;

  /** Size in bytes */
  size: number;

  /** When the image was cached */
  cachedAt: number;

  /** When the image was last accessed */
  lastAccessedAt: number;

  /** Original width (if available) */
  width?: number;

  /** Original height (if available) */
  height?: number;
}

/**
 * Cache metadata for tracking storage usage.
 */
export interface CacheMetadata {
  /** Metadata key */
  key: string;

  /** Total cached images count */
  imageCount: number;

  /** Total size in bytes */
  totalSize: number;

  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * IndexedDB schema definition.
 */
interface ItemdeckDB extends DBSchema {
  /** Cached images store */
  images: {
    key: string;
    value: CachedImage;
    indexes: {
      "by-cached-at": number;
      "by-last-accessed": number;
      "by-size": number;
    };
  };

  /** Cache metadata store */
  metadata: {
    key: string;
    value: CacheMetadata;
  };
}

/**
 * Database instance singleton.
 */
let dbInstance: IDBPDatabase<ItemdeckDB> | null = null;

/**
 * Get or create the database instance.
 */
export async function getDB(): Promise<IDBPDatabase<ItemdeckDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ItemdeckDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, _transaction) {
      // Version 1: Initial schema
      if (oldVersion < 1) {
        // Create images store with indexes
        const imageStore = db.createObjectStore("images", { keyPath: "url" });
        imageStore.createIndex("by-cached-at", "cachedAt");
        imageStore.createIndex("by-last-accessed", "lastAccessedAt");
        imageStore.createIndex("by-size", "size");

        // Create metadata store
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    },
    blocked() {
      // Called if another tab has an older version open
      console.warn("[itemdeck] Database upgrade blocked by another tab");
    },
    blocking() {
      // Called if this tab is blocking an upgrade in another tab
      console.warn("[itemdeck] This tab is blocking a database upgrade");
      dbInstance?.close();
      dbInstance = null;
    },
    terminated() {
      // Called if the browser unexpectedly closes the connection
      console.warn("[itemdeck] Database connection terminated unexpectedly");
      dbInstance = null;
    },
  });

  return dbInstance;
}

/**
 * Close the database connection.
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Delete the entire database (for storage management).
 */
export function deleteDB(): Promise<void> {
  closeDB();
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => { resolve(); };
    request.onerror = () => { reject(new Error(request.error?.message ?? "Failed to delete database")); };
  });
}

// Re-export types
export type { IDBPDatabase, ItemdeckDB };
