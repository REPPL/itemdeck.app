/**
 * Layout store using Zustand with persistence.
 *
 * Manages layout mode, filtering, sorting, and custom card order.
 * Settings persist to localStorage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CardFilterOptions,
  CardSortOptions,
  SortField,
  SortDirection,
} from "@/hooks/useFilteredCards";

/**
 * Layout mode options.
 */
export type LayoutMode = "grid" | "virtual" | "carousel" | "stack" | "fit";

/**
 * Layout store state.
 */
interface LayoutState {
  /** Current layout mode */
  layoutMode: LayoutMode;

  /** Filter options */
  filter: CardFilterOptions;

  /** Sort options */
  sort: CardSortOptions;

  /** Custom card order (IDs) */
  customOrder: string[];

  /** Favourite card IDs */
  favouriteIds: string[];

  /** Currently active carousel/stack index */
  activeIndex: number;

  /** Whether drag mode is enabled */
  dragEnabled: boolean;

  /** Actions */
  setLayoutMode: (mode: LayoutMode) => void;
  setFilter: (filter: Partial<CardFilterOptions>) => void;
  setSort: (sort: Partial<CardSortOptions>) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  setCustomOrder: (order: string[]) => void;
  setActiveIndex: (index: number) => void;
  toggleFavourite: (cardId: string) => void;
  setDragEnabled: (enabled: boolean) => void;
  resetFilters: () => void;
}

/**
 * Default filter options.
 */
const DEFAULT_FILTER: CardFilterOptions = {
  search: "",
  category: null,
  favouritesOnly: false,
  favouriteIds: [],
};

/**
 * Default sort options.
 */
const DEFAULT_SORT: CardSortOptions = {
  field: "random",
  direction: "asc",
  customOrder: [],
};

/**
 * Layout store with localStorage persistence.
 */
export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      layoutMode: "grid",
      filter: DEFAULT_FILTER,
      sort: DEFAULT_SORT,
      customOrder: [],
      favouriteIds: [],
      activeIndex: 0,
      dragEnabled: false,

      setLayoutMode: (layoutMode) => {
        set({ layoutMode });
      },

      setFilter: (updates) => {
        set((state) => ({
          filter: { ...state.filter, ...updates },
        }));
      },

      setSort: (updates) => {
        set((state) => ({
          sort: { ...state.sort, ...updates },
        }));
      },

      setSortField: (field) => {
        set((state) => ({
          sort: { ...state.sort, field },
        }));
      },

      setSortDirection: (direction) => {
        set((state) => ({
          sort: { ...state.sort, direction },
        }));
      },

      setCustomOrder: (customOrder) => {
        set({
          customOrder,
          sort: { ...get().sort, customOrder },
        });
      },

      setActiveIndex: (activeIndex) => {
        set({ activeIndex });
      },

      toggleFavourite: (cardId) => {
        set((state) => {
          const favouriteIds = state.favouriteIds.includes(cardId)
            ? state.favouriteIds.filter((id) => id !== cardId)
            : [...state.favouriteIds, cardId];

          return {
            favouriteIds,
            filter: {
              ...state.filter,
              favouriteIds,
            },
          };
        });
      },

      setDragEnabled: (dragEnabled) => {
        set({ dragEnabled });
      },

      resetFilters: () => {
        set({
          filter: { ...DEFAULT_FILTER, favouriteIds: get().favouriteIds },
          sort: DEFAULT_SORT,
        });
      },
    }),
    {
      name: "itemdeck-layout",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        layoutMode: state.layoutMode,
        sort: state.sort,
        customOrder: state.customOrder,
        favouriteIds: state.favouriteIds,
        dragEnabled: state.dragEnabled,
      }),
    }
  )
);

/**
 * Selector for filter and sort options combined.
 */
export function useFilterSortOptions() {
  const filter = useLayoutStore((state) => state.filter);
  const sort = useLayoutStore((state) => state.sort);
  return { filter, sort };
}
