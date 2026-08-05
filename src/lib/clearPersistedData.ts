/**
 * Clear every piece of persisted itemdeck state (the "hard reset").
 *
 * State is spread across localStorage and three separate IndexedDB databases
 * created by different subsystems, so a naive reset leaves data behind. This
 * clears all of it to honour the "delete everything" promise.
 */

import { deleteDB } from "@/db";
import { clearAllCollectionCaches } from "./cardCache";

/** Prefix shared by every localStorage key the app writes. */
const APP_STORAGE_PREFIX = "itemdeck-";

/**
 * IndexedDB databases created outside the main app database. `idb-keyval`'s
 * default `keyval-store` (used by cardCache) is cleared via
 * clearAllCollectionCaches; these are the remaining named databases.
 */
const SATELLITE_DATABASES = ["itemdeck-plugins"];

/**
 * Delete an IndexedDB database by name, resolving even on error/blocked so a
 * hard reset never aborts on a satellite store.
 */
function deleteIndexedDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        resolve();
      };
      request.onblocked = () => {
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

/**
 * Remove all persisted itemdeck data: every `itemdeck-` localStorage key,
 * the app IndexedDB database, the cached-collection store, and the plugin
 * cache database.
 */
export async function clearAllPersistedData(): Promise<void> {
  // Object.keys returns a snapshot, so removing during iteration is safe.
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(APP_STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }

  await deleteDB(); // the app database ("itemdeck")
  await clearAllCollectionCaches(); // cached collections (idb-keyval store)
  for (const name of SATELLITE_DATABASES) {
    await deleteIndexedDb(name);
  }
}
