/**
 * Tests for collection store.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCollectionStore } from "@/mechanics/collection/store";
import { EXPORT_VERSION } from "@/mechanics/collection/types";
import type { CollectionExport } from "@/mechanics/collection/types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useCollectionStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useCollectionStore.setState({
      isActive: false,
      activeSourceId: null,
      collections: {},
      settings: {
        showProgress: true,
        showUnownedBadge: false,
        keyboardShortcuts: true,
      },
      allCardIds: [],
    });
    localStorageMock.clear();
  });

  describe("lifecycle", () => {
    it("should activate with source ID", () => {
      const store = useCollectionStore.getState();
      store.activate("test-source");

      const state = useCollectionStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.activeSourceId).toBe("test-source");
    });

    it("should deactivate while preserving source ID", () => {
      const store = useCollectionStore.getState();
      store.activate("test-source");
      store.deactivate();

      const state = useCollectionStore.getState();
      expect(state.isActive).toBe(false);
      // Source ID is preserved for persistence
    });
  });

  describe("ownership", () => {
    beforeEach(() => {
      useCollectionStore.getState().activate("test-source");
    });

    it("should set ownership to owned", () => {
      const store = useCollectionStore.getState();
      store.setOwnership("card-1", "owned");

      expect(store.getStatus("card-1")).toBe("owned");
    });

    it("should set ownership to wishlist", () => {
      const store = useCollectionStore.getState();
      store.setOwnership("card-1", "wishlist");

      expect(store.getStatus("card-1")).toBe("wishlist");
    });

    it("should set ownership to none", () => {
      const store = useCollectionStore.getState();
      store.setOwnership("card-1", "owned");
      store.setOwnership("card-1", "none");

      expect(store.getStatus("card-1")).toBe("none");
    });

    it("should toggle owned status", () => {
      const store = useCollectionStore.getState();

      // Start as none, toggle to owned
      store.toggleOwned("card-1");
      expect(store.getStatus("card-1")).toBe("owned");

      // Toggle again, back to none
      store.toggleOwned("card-1");
      expect(store.getStatus("card-1")).toBe("none");
    });

    it("should toggle wishlist status", () => {
      const store = useCollectionStore.getState();

      // Start as none, toggle to wishlist
      store.toggleWishlist("card-1");
      expect(store.getStatus("card-1")).toBe("wishlist");

      // Toggle again, back to none
      store.toggleWishlist("card-1");
      expect(store.getStatus("card-1")).toBe("none");
    });

    it("should toggle owned from wishlist", () => {
      const store = useCollectionStore.getState();
      store.setOwnership("card-1", "wishlist");

      store.toggleOwned("card-1");
      expect(store.getStatus("card-1")).toBe("owned");
    });

    it("should cycle status: none -> owned -> wishlist -> none", () => {
      const store = useCollectionStore.getState();

      expect(store.getStatus("card-1")).toBe("none");

      store.cycleStatus("card-1");
      expect(store.getStatus("card-1")).toBe("owned");

      store.cycleStatus("card-1");
      expect(store.getStatus("card-1")).toBe("wishlist");

      store.cycleStatus("card-1");
      expect(store.getStatus("card-1")).toBe("none");
    });
  });

  describe("per-source isolation", () => {
    it("should maintain separate collections per source", () => {
      const store = useCollectionStore.getState();

      // Activate source A and add cards
      store.activate("source-a");
      store.setOwnership("card-1", "owned");
      store.setOwnership("card-2", "wishlist");

      // Switch to source B
      store.activate("source-b");
      store.setOwnership("card-1", "wishlist");
      store.setOwnership("card-3", "owned");

      // Check source B state
      expect(store.getStatus("card-1")).toBe("wishlist");
      expect(store.getStatus("card-2")).toBe("none");
      expect(store.getStatus("card-3")).toBe("owned");

      // Switch back to source A
      store.activate("source-a");
      expect(store.getStatus("card-1")).toBe("owned");
      expect(store.getStatus("card-2")).toBe("wishlist");
      expect(store.getStatus("card-3")).toBe("none");
    });
  });

  describe("batch actions", () => {
    beforeEach(() => {
      useCollectionStore.getState().activate("test-source");
    });

    it("should mark all cards as owned", () => {
      const store = useCollectionStore.getState();
      store.markAllOwned(["card-1", "card-2", "card-3"]);

      expect(store.getStatus("card-1")).toBe("owned");
      expect(store.getStatus("card-2")).toBe("owned");
      expect(store.getStatus("card-3")).toBe("owned");
    });

    it("should remove from wishlist when marking all owned", () => {
      const store = useCollectionStore.getState();
      store.setOwnership("card-1", "wishlist");
      store.markAllOwned(["card-1", "card-2"]);

      expect(store.getStatus("card-1")).toBe("owned");
    });

    it("should clear all ownership", () => {
      const store = useCollectionStore.getState();
      store.setOwnership("card-1", "owned");
      store.setOwnership("card-2", "wishlist");

      store.clearAll();

      expect(store.getStatus("card-1")).toBe("none");
      expect(store.getStatus("card-2")).toBe("none");
    });
  });

  describe("statistics", () => {
    beforeEach(() => {
      const store = useCollectionStore.getState();
      store.activate("test-source");
      store.setAllCardIds(["card-1", "card-2", "card-3", "card-4", "card-5"]);
    });

    it("should calculate stats correctly", () => {
      const store = useCollectionStore.getState();
      store.setOwnership("card-1", "owned");
      store.setOwnership("card-2", "owned");
      store.setOwnership("card-3", "wishlist");

      const stats = store.getStats();

      expect(stats.total).toBe(5);
      expect(stats.owned).toBe(2);
      expect(stats.wishlist).toBe(1);
      expect(stats.remaining).toBe(2);
      expect(stats.percentComplete).toBe(40); // 2/5 = 40%
    });

    it("should handle empty collection", () => {
      useCollectionStore.setState({ allCardIds: [] });
      const stats = useCollectionStore.getState().getStats();

      expect(stats.total).toBe(0);
      expect(stats.owned).toBe(0);
      expect(stats.percentComplete).toBe(0);
    });
  });

  describe("settings", () => {
    it("should update settings", () => {
      const store = useCollectionStore.getState();

      store.updateSettings({ showProgress: false });

      const state = useCollectionStore.getState();
      expect(state.settings.showProgress).toBe(false);
      expect(state.settings.showUnownedBadge).toBe(false); // unchanged
    });
  });

  describe("export/import", () => {
    beforeEach(() => {
      const store = useCollectionStore.getState();
      store.activate("test-source");
      store.setOwnership("card-1", "owned");
      store.setOwnership("card-2", "wishlist");
    });

    it("should export collection data", () => {
      const store = useCollectionStore.getState();
      const exported = store.exportCollection();

      expect(exported).not.toBeNull();
      expect(exported?.version).toBe(EXPORT_VERSION);
      expect(exported?.sourceId).toBe("test-source");
      expect(exported?.owned).toContain("card-1");
      expect(exported?.wishlist).toContain("card-2");
      expect(exported?.exportedAt).toBeDefined();
    });

    it("should import with merge mode", () => {
      const store = useCollectionStore.getState();

      const importData: CollectionExport = {
        version: EXPORT_VERSION,
        sourceId: "test-source",
        exportedAt: new Date().toISOString(),
        owned: ["card-3", "card-4"],
        wishlist: ["card-5"],
      };

      store.importCollection(importData, "merge");

      // Original data should still exist
      expect(store.getStatus("card-1")).toBe("owned");
      expect(store.getStatus("card-2")).toBe("wishlist");

      // Imported data should be added
      expect(store.getStatus("card-3")).toBe("owned");
      expect(store.getStatus("card-4")).toBe("owned");
      expect(store.getStatus("card-5")).toBe("wishlist");
    });

    it("should import with replace mode", () => {
      const store = useCollectionStore.getState();

      const importData: CollectionExport = {
        version: EXPORT_VERSION,
        sourceId: "test-source",
        exportedAt: new Date().toISOString(),
        owned: ["card-3"],
        wishlist: ["card-4"],
      };

      store.importCollection(importData, "replace");

      // Original data should be gone
      expect(store.getStatus("card-1")).toBe("none");
      expect(store.getStatus("card-2")).toBe("none");

      // Only imported data should exist
      expect(store.getStatus("card-3")).toBe("owned");
      expect(store.getStatus("card-4")).toBe("wishlist");
    });

    it("should move wishlist to owned during merge if imported as owned", () => {
      const store = useCollectionStore.getState();
      // card-2 is currently wishlisted

      const importData: CollectionExport = {
        version: EXPORT_VERSION,
        sourceId: "test-source",
        exportedAt: new Date().toISOString(),
        owned: ["card-2"], // Previously wishlisted, now owned
        wishlist: [],
      };

      store.importCollection(importData, "merge");

      // card-2 should now be owned, not wishlisted
      expect(store.getStatus("card-2")).toBe("owned");
    });

    it("should return null export when no active source", () => {
      useCollectionStore.setState({ activeSourceId: null });
      const exported = useCollectionStore.getState().exportCollection();
      expect(exported).toBeNull();
    });
  });
});
