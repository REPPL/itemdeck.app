/**
 * Tests for clearAllPersistedData (the "hard reset").
 *
 * Persisted state is spread across localStorage and three IndexedDB databases
 * created by separate subsystems. The reset must clear all of it — including
 * the cached-collection store (idb-keyval) and the plugin cache database —
 * to honour the dialog's "delete everything" promise.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { deleteDBMock, clearAllCollectionCachesMock } = vi.hoisted(() => ({
  deleteDBMock: vi.fn(() => Promise.resolve()),
  clearAllCollectionCachesMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/db", () => ({ deleteDB: deleteDBMock }));
vi.mock("@/lib/cardCache", () => ({
  clearAllCollectionCaches: clearAllCollectionCachesMock,
}));

import { clearAllPersistedData } from "@/lib/clearPersistedData";

/** A localStorage-like object whose stored entries are own enumerable keys. */
function makeLocalStorage(seed: Record<string, string>): Storage {
  const ls = {
    getItem(key: string): string | null {
      return typeof (ls as Record<string, unknown>)[key] === "string"
        ? ((ls as Record<string, string>)[key] ?? null)
        : null;
    },
    setItem(key: string, value: string): void {
      (ls as Record<string, string>)[key] = String(value);
    },
    removeItem(key: string): void {
      delete (ls as Record<string, unknown>)[key];
    },
    clear(): void {
      for (const key of Object.keys(ls)) {
        if (typeof (ls as Record<string, unknown>)[key] === "string") {
          delete (ls as Record<string, unknown>)[key];
        }
      }
    },
    key(index: number): string | null {
      return (
        Object.keys(ls).filter(
          (k) => typeof (ls as Record<string, unknown>)[k] === "string"
        )[index] ?? null
      );
    },
    get length(): number {
      return Object.keys(ls).filter(
        (k) => typeof (ls as Record<string, unknown>)[k] === "string"
      ).length;
    },
  };
  Object.assign(ls, seed);
  return ls as unknown as Storage;
}

let deletedDatabases: string[];

beforeEach(() => {
  deleteDBMock.mockClear();
  clearAllCollectionCachesMock.mockClear();
  deletedDatabases = [];

  vi.stubGlobal("indexedDB", {
    deleteDatabase: vi.fn((name: string) => {
      deletedDatabases.push(name);
      const request: Record<string, (() => void) | null> = {
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("clearAllPersistedData", () => {
  it("removes every itemdeck- localStorage key but leaves others", async () => {
    const ls = makeLocalStorage({
      "itemdeck-settings": "{}",
      "itemdeck-config": "{}",
      "itemdeck-collection-v1": "{}",
      "itemdeck-imported-collection": "{}",
      "itemdeck-plugins": "{}",
      "other-app-key": "keep-me",
    });
    vi.stubGlobal("localStorage", ls);

    await clearAllPersistedData();

    expect(ls.getItem("itemdeck-settings")).toBeNull();
    expect(ls.getItem("itemdeck-config")).toBeNull();
    expect(ls.getItem("itemdeck-collection-v1")).toBeNull();
    expect(ls.getItem("itemdeck-imported-collection")).toBeNull();
    expect(ls.getItem("itemdeck-plugins")).toBeNull();
    expect(ls.getItem("other-app-key")).toBe("keep-me");
  });

  it("clears the app DB, the cached-collection store, and the plugin cache DB", async () => {
    vi.stubGlobal("localStorage", makeLocalStorage({}));

    await clearAllPersistedData();

    expect(deleteDBMock).toHaveBeenCalledTimes(1);
    expect(clearAllCollectionCachesMock).toHaveBeenCalledTimes(1);
    expect(deletedDatabases).toContain("itemdeck-plugins");
  });

  it("resolves even when deleting a satellite database throws", async () => {
    vi.stubGlobal("localStorage", makeLocalStorage({}));
    vi.stubGlobal("indexedDB", {
      deleteDatabase: vi.fn(() => {
        throw new Error("blocked");
      }),
    });

    await expect(clearAllPersistedData()).resolves.toBeUndefined();
  });

  it("still clears the cache and satellite DBs when the app-DB delete rejects", async () => {
    vi.stubGlobal("localStorage", makeLocalStorage({}));
    // The app DB delete rejects (e.g. an IndexedDB error). The remaining
    // cleanups must still run — a partial reset presented as complete would
    // leave the user's cached collections on disk.
    deleteDBMock.mockRejectedValueOnce(new Error("delete failed"));

    await expect(clearAllPersistedData()).resolves.toBeUndefined();

    expect(clearAllCollectionCachesMock).toHaveBeenCalledTimes(1);
    expect(deletedDatabases).toContain("itemdeck-plugins");
  });
});
