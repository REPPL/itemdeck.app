/**
 * Collection mechanic state store.
 *
 * Zustand store for tracking collection ownership state.
 * State is persisted to localStorage and keyed by source ID
 * so each collection has separate ownership data.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MechanicState } from "../types";
import type {
  CollectionSettings,
  CollectionStats,
  CollectionExport,
  OwnershipStatus,
  ImportMode,
} from "./types";
import { DEFAULT_SETTINGS, EXPORT_VERSION } from "./types";

/**
 * Storage key for collection data.
 */
const STORAGE_KEY = "itemdeck-collection-v1";

/**
 * Serialised collection state for persistence.
 */
interface SerialisedCollectionState {
  ownedIds: string[];
  wishlistIds: string[];
}

/**
 * Collection store state.
 */
export interface CollectionStoreState extends MechanicState {
  /** Whether the mechanic is active */
  isActive: boolean;

  /** Currently active source ID */
  activeSourceId: string | null;

  /** Per-source collection state (serialised for persistence) */
  collections: Record<string, SerialisedCollectionState>;

  /** Settings */
  settings: CollectionSettings;

  /** All card IDs in the current collection (for stats) */
  allCardIds: string[];
}

/**
 * Collection store actions.
 */
interface CollectionStoreActions {
  // Lifecycle
  activate: (sourceId: string) => void;
  deactivate: () => void;

  // Card ID management
  setAllCardIds: (cardIds: string[]) => void;

  // Ownership actions
  setOwnership: (cardId: string, status: OwnershipStatus) => void;
  toggleOwned: (cardId: string) => void;
  toggleWishlist: (cardId: string) => void;
  getStatus: (cardId: string) => OwnershipStatus;
  cycleStatus: (cardId: string) => void;

  // Batch actions
  markAllOwned: (cardIds: string[]) => void;
  clearAll: () => void;

  // Statistics
  getStats: () => CollectionStats;

  // Settings
  updateSettings: (settings: Partial<CollectionSettings>) => void;

  // Export/Import
  exportCollection: () => CollectionExport | null;
  importCollection: (data: CollectionExport, mode: ImportMode) => void;
}

export type CollectionStore = CollectionStoreState & CollectionStoreActions;

/**
 * Initial state.
 */
const INITIAL_STATE: CollectionStoreState = {
  isActive: false,
  activeSourceId: null,
  collections: {},
  settings: DEFAULT_SETTINGS,
  allCardIds: [],
};

/**
 * Get or create collection state for a source.
 */
function getOrCreateCollection(
  collections: Record<string, SerialisedCollectionState>,
  sourceId: string
): SerialisedCollectionState {
  return collections[sourceId] ?? { ownedIds: [], wishlistIds: [] };
}

/**
 * Collection mechanic store.
 */
export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // Lifecycle
      activate: (sourceId: string) => {
        set({
          isActive: true,
          activeSourceId: sourceId,
        });
      },

      deactivate: () => {
        set({
          isActive: false,
          // Keep activeSourceId for persistence - only clear isActive
        });
      },

      // Card ID management
      setAllCardIds: (cardIds: string[]) => {
        set({ allCardIds: cardIds });
      },

      // Ownership actions
      setOwnership: (cardId: string, status: OwnershipStatus) => {
        const state = get();
        if (!state.activeSourceId) return;

        const sourceId = state.activeSourceId;
        const collection = getOrCreateCollection(state.collections, sourceId);

        // Create new arrays excluding the cardId
        let ownedIds = collection.ownedIds.filter((id) => id !== cardId);
        let wishlistIds = collection.wishlistIds.filter((id) => id !== cardId);

        // Add to appropriate list based on status
        if (status === "owned") {
          ownedIds = [...ownedIds, cardId];
        } else if (status === "wishlist") {
          wishlistIds = [...wishlistIds, cardId];
        }
        // status === "none" means neither list

        set({
          collections: {
            ...state.collections,
            [sourceId]: { ownedIds, wishlistIds },
          },
        });
      },

      toggleOwned: (cardId: string) => {
        const status = get().getStatus(cardId);
        if (status === "owned") {
          get().setOwnership(cardId, "none");
        } else {
          get().setOwnership(cardId, "owned");
        }
      },

      toggleWishlist: (cardId: string) => {
        const status = get().getStatus(cardId);
        if (status === "wishlist") {
          get().setOwnership(cardId, "none");
        } else {
          get().setOwnership(cardId, "wishlist");
        }
      },

      getStatus: (cardId: string): OwnershipStatus => {
        const state = get();
        if (!state.activeSourceId) return "none";

        const collection = getOrCreateCollection(
          state.collections,
          state.activeSourceId
        );

        if (collection.ownedIds.includes(cardId)) return "owned";
        if (collection.wishlistIds.includes(cardId)) return "wishlist";
        return "none";
      },

      cycleStatus: (cardId: string) => {
        const status = get().getStatus(cardId);
        // Cycle: none -> owned -> wishlist -> none
        const nextStatus: OwnershipStatus =
          status === "none"
            ? "owned"
            : status === "owned"
              ? "wishlist"
              : "none";
        get().setOwnership(cardId, nextStatus);
      },

      // Batch actions
      markAllOwned: (cardIds: string[]) => {
        const state = get();
        if (!state.activeSourceId) return;

        const sourceId = state.activeSourceId;
        const collection = getOrCreateCollection(state.collections, sourceId);

        // Add all cardIds to owned, remove from wishlist
        const ownedSet = new Set([...collection.ownedIds, ...cardIds]);
        const wishlistIds = collection.wishlistIds.filter(
          (id) => !cardIds.includes(id)
        );

        set({
          collections: {
            ...state.collections,
            [sourceId]: {
              ownedIds: [...ownedSet],
              wishlistIds,
            },
          },
        });
      },

      clearAll: () => {
        const state = get();
        if (!state.activeSourceId) return;

        set({
          collections: {
            ...state.collections,
            [state.activeSourceId]: { ownedIds: [], wishlistIds: [] },
          },
        });
      },

      // Statistics
      getStats: (): CollectionStats => {
        const state = get();
        if (!state.activeSourceId) {
          return {
            total: 0,
            owned: 0,
            wishlist: 0,
            remaining: 0,
            percentComplete: 0,
          };
        }

        const collection = getOrCreateCollection(
          state.collections,
          state.activeSourceId
        );

        const total = state.allCardIds.length;
        const owned = collection.ownedIds.length;
        const wishlist = collection.wishlistIds.length;
        const remaining = total - owned - wishlist;
        const percentComplete = total > 0 ? Math.round((owned / total) * 100) : 0;

        return { total, owned, wishlist, remaining, percentComplete };
      },

      // Settings
      updateSettings: (settings: Partial<CollectionSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      // Export/Import
      exportCollection: (): CollectionExport | null => {
        const state = get();
        if (!state.activeSourceId) return null;

        const collection = getOrCreateCollection(
          state.collections,
          state.activeSourceId
        );

        return {
          version: EXPORT_VERSION,
          sourceId: state.activeSourceId,
          exportedAt: new Date().toISOString(),
          owned: [...collection.ownedIds],
          wishlist: [...collection.wishlistIds],
        };
      },

      importCollection: (data: CollectionExport, mode: ImportMode) => {
        const state = get();
        if (!state.activeSourceId) return;

        const sourceId = state.activeSourceId;
        const existing = getOrCreateCollection(state.collections, sourceId);

        let ownedIds: string[];
        let wishlistIds: string[];

        if (mode === "replace") {
          // Replace mode: use imported data directly
          ownedIds = [...data.owned];
          wishlistIds = [...data.wishlist];
        } else {
          // Merge mode: combine with existing data
          const ownedSet = new Set([...existing.ownedIds, ...data.owned]);
          const wishlistSet = new Set([
            ...existing.wishlistIds,
            ...data.wishlist,
          ]);

          // Remove items from wishlist if they're now owned
          for (const id of data.owned) {
            wishlistSet.delete(id);
          }

          ownedIds = [...ownedSet];
          wishlistIds = [...wishlistSet];
        }

        set({
          collections: {
            ...state.collections,
            [sourceId]: { ownedIds, wishlistIds },
          },
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        collections: state.collections,
        settings: state.settings,
      }),
    }
  )
);
