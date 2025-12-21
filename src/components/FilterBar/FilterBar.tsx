/**
 * Filter and sort bar for card collections.
 *
 * Provides search input, category filter, and sort controls.
 */

import { useCallback, useId } from "react";
import type {
  CardFilterOptions,
  CardSortOptions,
  SortField,
  SortDirection,
} from "@/hooks/useFilteredCards";
import styles from "./FilterBar.module.css";

/**
 * Props for FilterBar component.
 */
interface FilterBarProps {
  /** Current filter options */
  filter: CardFilterOptions;
  /** Current sort options */
  sort: CardSortOptions;
  /** Available categories for filtering */
  categories: string[];
  /** Callback when filter changes */
  onFilterChange: (filter: Partial<CardFilterOptions>) => void;
  /** Callback when sort changes */
  onSortChange: (sort: Partial<CardSortOptions>) => void;
  /** Total number of cards (for results count) */
  totalCards: number;
  /** Number of visible cards after filtering */
  visibleCards: number;
}

/**
 * Sort field options with labels.
 */
const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "random", label: "Shuffle" },
  { value: "title", label: "Title" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

/**
 * Filter and sort bar for card collections.
 *
 * Features:
 * - Text search with instant filtering
 * - Category dropdown filter
 * - Sort field and direction controls
 * - Results count display
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <FilterBar
 *   filter={filterOptions}
 *   sort={sortOptions}
 *   categories={["Nature", "Urban", "Abstract"]}
 *   onFilterChange={setFilter}
 *   onSortChange={setSort}
 *   totalCards={100}
 *   visibleCards={42}
 * />
 * ```
 */
export function FilterBar({
  filter,
  sort,
  categories,
  onFilterChange,
  onSortChange,
  totalCards,
  visibleCards,
}: FilterBarProps) {
  const searchId = useId();
  const categoryId = useId();
  const sortId = useId();

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ search: event.target.value });
    },
    [onFilterChange]
  );

  const handleCategoryChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      onFilterChange({ category: value === "" ? null : value });
    },
    [onFilterChange]
  );

  const handleSortFieldChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onSortChange({ field: event.target.value as SortField });
    },
    [onSortChange]
  );

  const handleDirectionToggle = useCallback(() => {
    const newDirection: SortDirection =
      sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ direction: newDirection });
  }, [sort.direction, onSortChange]);

  const handleClearFilters = useCallback(() => {
    onFilterChange({
      search: "",
      category: null,
      favouritesOnly: false,
    });
  }, [onFilterChange]);

  const hasActiveFilters = filter.search || filter.category;

  return (
    <div className={styles.filterBar} role="search" aria-label="Card filters">
      {/* Search input */}
      <div className={styles.searchGroup}>
        <label htmlFor={searchId} className={styles.visuallyHidden}>
          Search cards
        </label>
        <div className={styles.searchInputWrapper}>
          <SearchIcon />
          <input
            id={searchId}
            type="search"
            className={styles.searchInput}
            placeholder="Search cards..."
            value={filter.search}
            onChange={handleSearchChange}
            aria-describedby={`${searchId}-results`}
          />
          {filter.search && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => { onFilterChange({ search: "" }); }}
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className={styles.selectGroup}>
        <label htmlFor={categoryId} className={styles.visuallyHidden}>
          Filter by category
        </label>
        <select
          id={categoryId}
          className={styles.select}
          value={filter.category ?? ""}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Sort controls */}
      <div className={styles.sortGroup}>
        <label htmlFor={sortId} className={styles.visuallyHidden}>
          Sort by
        </label>
        <select
          id={sortId}
          className={styles.select}
          value={sort.field}
          onChange={handleSortFieldChange}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.directionButton}
          onClick={handleDirectionToggle}
          aria-label={`Sort ${sort.direction === "asc" ? "descending" : "ascending"}`}
          disabled={sort.field === "random"}
        >
          {sort.direction === "asc" ? <SortAscIcon /> : <SortDescIcon />}
        </button>
      </div>

      {/* Results count */}
      <div
        id={`${searchId}-results`}
        className={styles.resultsCount}
        role="status"
        aria-live="polite"
      >
        {visibleCards === totalCards
          ? `${String(totalCards)} cards`
          : `${String(visibleCards)} of ${String(totalCards)} cards`}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          type="button"
          className={styles.clearFiltersButton}
          onClick={handleClearFilters}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// Icon components
function SearchIcon() {
  return (
    <svg
      className={styles.searchIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SortAscIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 8 4-4 4 4M7 4v16" />
      <path d="M11 12h4M11 16h7M11 20h10" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 16 4 4 4-4M7 20V4" />
      <path d="M11 4h10M11 8h7M11 12h4" />
    </svg>
  );
}

export default FilterBar;
