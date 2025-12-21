/**
 * Filter store for explorer sidebar.
 *
 * Manages filter state, temporary filters, and previous card states.
 */

import { create } from "zustand";

/**
 * Filter criteria for cards.
 */
interface FilterCriteria {
  /** Selected categories (empty = all) */
  categories: string[];

  /** Rank range [min, max] */
  rankRange: [number | null, number | null];

  /** Year range [min, max] */
  yearRange: [string | null, string | null];

  /** Selected devices/platforms (empty = all) */
  devices: string[];

  /** Text search query */
  searchQuery: string;
}

/**
 * Filter store state.
 */
interface FilterState {
  /** Whether the explorer sidebar is open */
  explorerOpen: boolean;

  /** IDs of cards that were flipped before explorer opened */
  previousFlipState: string[];

  /** Temporary filters (before apply) */
  tempFilters: FilterCriteria;

  /** Applied filters (actively filtering) */
  appliedFilters: FilterCriteria;

  /** Search query (applies immediately) */
  searchQuery: string;

  /** Actions */
  openExplorer: (currentFlippedIds: string[]) => void;
  closeExplorer: (applyFilters: boolean) => void;
  setTempCategories: (categories: string[]) => void;
  setTempRankRange: (range: [number | null, number | null]) => void;
  setTempYearRange: (range: [string | null, string | null]) => void;
  setTempDevices: (devices: string[]) => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  clearAllFilters: () => void;
}

/**
 * Default filter criteria.
 */
const DEFAULT_FILTERS: FilterCriteria = {
  categories: [],
  rankRange: [null, null],
  yearRange: [null, null],
  devices: [],
  searchQuery: "",
};

/**
 * Filter store for explorer functionality.
 */
export const useFilterStore = create<FilterState>()((set, get) => ({
  explorerOpen: false,
  previousFlipState: [],
  tempFilters: { ...DEFAULT_FILTERS },
  appliedFilters: { ...DEFAULT_FILTERS },
  searchQuery: "",

  openExplorer: (currentFlippedIds) => {
    set({
      explorerOpen: true,
      previousFlipState: currentFlippedIds,
      tempFilters: { ...get().appliedFilters },
    });
  },

  closeExplorer: (applyFilters) => {
    if (applyFilters) {
      set({
        explorerOpen: false,
        appliedFilters: { ...get().tempFilters },
      });
    } else {
      set({
        explorerOpen: false,
        tempFilters: { ...get().appliedFilters },
      });
    }
  },

  setTempCategories: (categories) => {
    set((state) => ({
      tempFilters: { ...state.tempFilters, categories },
    }));
  },

  setTempRankRange: (range) => {
    set((state) => ({
      tempFilters: { ...state.tempFilters, rankRange: range },
    }));
  },

  setTempYearRange: (range) => {
    set((state) => ({
      tempFilters: { ...state.tempFilters, yearRange: range },
    }));
  },

  setTempDevices: (devices) => {
    set((state) => ({
      tempFilters: { ...state.tempFilters, devices },
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  applyFilters: () => {
    set((state) => ({
      explorerOpen: false,
      appliedFilters: { ...state.tempFilters },
    }));
  },

  resetFilters: () => {
    set({
      tempFilters: { ...DEFAULT_FILTERS },
    });
  },

  clearAllFilters: () => {
    set({
      tempFilters: { ...DEFAULT_FILTERS },
      appliedFilters: { ...DEFAULT_FILTERS },
      searchQuery: "",
    });
  },
}));

/**
 * Check if any filters are active.
 */
export function hasActiveFilters(filters: FilterCriteria): boolean {
  return (
    filters.categories.length > 0 ||
    filters.rankRange[0] !== null ||
    filters.rankRange[1] !== null ||
    filters.yearRange[0] !== null ||
    filters.yearRange[1] !== null ||
    filters.devices.length > 0 ||
    filters.searchQuery.length > 0
  );
}

/**
 * Get default filter criteria.
 */
export function getDefaultFilters(): FilterCriteria {
  return { ...DEFAULT_FILTERS };
}

export type { FilterCriteria };
