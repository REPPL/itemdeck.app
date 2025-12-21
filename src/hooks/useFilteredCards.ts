/**
 * Hook for filtering and sorting cards.
 *
 * Provides memoised filtering and sorting of card collections
 * with support for text search, category filtering, and various sort options.
 */

import { useMemo } from "react";
import type { DisplayCard } from "@/hooks/useCollection";

/**
 * Sort field options.
 */
export type SortField = "title" | "year" | "dateAdded" | "random" | "custom";

/**
 * Sort direction options.
 */
export type SortDirection = "asc" | "desc";

/**
 * Filter options for cards.
 */
export interface CardFilterOptions {
  /** Text search query (matches title and summary) */
  search: string;
  /** Category filter (null = all categories) */
  category: string | null;
  /** Only show favourites */
  favouritesOnly: boolean;
  /** Favourite card IDs */
  favouriteIds: string[];
}

/**
 * Sort options for cards.
 */
export interface CardSortOptions {
  /** Field to sort by */
  field: SortField;
  /** Sort direction */
  direction: SortDirection;
  /** Custom order (array of card IDs) */
  customOrder?: string[];
}

/**
 * Combined filter and sort options.
 */
export interface FilterSortOptions {
  filter: CardFilterOptions;
  sort: CardSortOptions;
}

/**
 * Default filter options.
 */
export const DEFAULT_FILTER_OPTIONS: CardFilterOptions = {
  search: "",
  category: null,
  favouritesOnly: false,
  favouriteIds: [],
};

/**
 * Default sort options.
 */
export const DEFAULT_SORT_OPTIONS: CardSortOptions = {
  field: "random",
  direction: "asc",
  customOrder: [],
};

/**
 * Fisher-Yates shuffle implementation.
 * Uses a seeded approach for consistent results within a session.
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  let currentIndex = result.length;
  let randomValue: number;
  let seedValue = seed;

  // Simple seeded random number generator
  const random = () => {
    if (seedValue !== undefined) {
      seedValue = (seedValue * 1103515245 + 12345) & 0x7fffffff;
      return seedValue / 0x7fffffff;
    }
    return Math.random();
  };

  while (currentIndex !== 0) {
    randomValue = Math.floor(random() * currentIndex);
    currentIndex--;
    // Swap elements - we know indices are valid since they're derived from array length
    const temp = result[currentIndex];
    const swapVal = result[randomValue];
    if (temp !== undefined && swapVal !== undefined) {
      result[currentIndex] = swapVal;
      result[randomValue] = temp;
    }
  }

  return result;
}

/**
 * Hook for filtering and sorting cards with memoisation.
 *
 * @param cards - Source card array
 * @param options - Filter and sort options
 * @param shuffleSeed - Optional seed for consistent shuffle (session-based)
 * @returns Filtered and sorted cards
 *
 * @example
 * ```tsx
 * const filteredCards = useFilteredCards(cards, {
 *   filter: { search: "sun", category: "Nature", favouritesOnly: false, favouriteIds: [] },
 *   sort: { field: "title", direction: "asc" }
 * });
 * ```
 */
export function useFilteredCards(
  cards: DisplayCard[],
  options: FilterSortOptions,
  shuffleSeed?: number
): DisplayCard[] {
  return useMemo(() => {
    let result = [...cards];

    // Apply filters
    const { search, category, favouritesOnly, favouriteIds } = options.filter;

    // Text search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter(
        (card) =>
          card.title.toLowerCase().includes(searchLower) ||
          (card.summary?.toLowerCase().includes(searchLower) ?? false) ||
          (card.categoryTitle?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Category filter
    if (category) {
      result = result.filter((card) => card.categoryTitle === category);
    }

    // Favourites filter
    if (favouritesOnly && favouriteIds.length > 0) {
      result = result.filter((card) => favouriteIds.includes(card.id));
    }

    // Apply sorting
    const { field, direction, customOrder } = options.sort;

    switch (field) {
      case "title":
        result.sort((a, b) => {
          const comparison = a.title.localeCompare(b.title);
          return direction === "desc" ? -comparison : comparison;
        });
        break;

      case "year":
        result.sort((a, b) => {
          const yearA = a.year ? parseInt(a.year, 10) : 0;
          const yearB = b.year ? parseInt(b.year, 10) : 0;
          const comparison = yearA - yearB;
          return direction === "desc" ? -comparison : comparison;
        });
        break;

      case "dateAdded":
        // Cards don't have dateAdded, so maintain source order
        if (direction === "desc") {
          result.reverse();
        }
        break;

      case "random":
        result = shuffleArray(result, shuffleSeed);
        break;

      case "custom":
        if (customOrder && customOrder.length > 0) {
          const orderMap = new Map(
            customOrder.map((id, index) => [id, index])
          );
          result.sort((a, b) => {
            const indexA = orderMap.get(a.id) ?? Infinity;
            const indexB = orderMap.get(b.id) ?? Infinity;
            return indexA - indexB;
          });
        }
        break;
    }

    return result;
  }, [cards, options.filter, options.sort, shuffleSeed]);
}

/**
 * Extract unique categories from cards.
 */
export function useCategories(cards: DisplayCard[]): string[] {
  return useMemo(() => {
    const categories = new Set<string>();
    cards.forEach((card) => {
      if (card.categoryTitle) {
        categories.add(card.categoryTitle);
      }
    });
    return Array.from(categories).sort();
  }, [cards]);
}
