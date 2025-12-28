/**
 * SearchBar component for filtering and searching cards.
 *
 * Features:
 * - Text search with debounce (300ms)
 * - "/" keyboard shortcut to focus
 * - Result count display
 * - Clear button
 * - Escape to blur
 * - Minimise to floating button
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { FilterChips } from "./FilterChips";
import { GroupByDropdown } from "./GroupByDropdown";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  /** Total number of cards in collection */
  totalCards: number;
  /** Number of cards after filtering */
  filteredCount: number;
  /** Available filter options for categories/platforms */
  filterOptions?: {
    platforms: string[];
    years: number[];
    genres: string[];
  };
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MinimiseIcon() {
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
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/**
 * Search bar with filtering capabilities.
 */
export function SearchBar({
  totalCards,
  filteredCount,
  filterOptions,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState("");

  const searchQuery = useSettingsStore((state) => state.searchQuery);
  const setSearchQuery = useSettingsStore((state) => state.setSearchQuery);
  const activeFilters = useSettingsStore((state) => state.activeFilters);
  const clearSearch = useSettingsStore((state) => state.clearSearch);
  const searchScope = useSettingsStore((state) => state.searchScope);
  const setSearchScope = useSettingsStore((state) => state.setSearchScope);
  const searchBarMinimised = useSettingsStore((state) => state.searchBarMinimised);
  const toggleSearchBarMinimised = useSettingsStore((state) => state.toggleSearchBarMinimised);

  // Sync local state with store on mount
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [localQuery, searchQuery, setSearchQuery]);

  // Global "/" shortcut to focus search (also expands if minimised)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if already focused on an input
      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        if (searchBarMinimised) {
          toggleSearchBarMinimised();
        }
        // Focus after a short delay to allow expand animation
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchBarMinimised, toggleSearchBarMinimised]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery("");
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  }, []);

  const hasActiveSearch = localQuery.trim() !== "" || activeFilters.length > 0;
  const isFiltered = filteredCount !== totalCards;

  const handleScopeToggle = useCallback(() => {
    setSearchScope(searchScope === "all" ? "visible" : "all");
  }, [searchScope, setSearchScope]);

  // Minimised state: return null (SearchButton in App.tsx handles the button)
  if (searchBarMinimised) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Top row: Group by on left, minimise on right */}
      <div className={styles.topRow}>
        <div className={styles.topRowLeft}>
          <GroupByDropdown />
        </div>
        <div className={styles.topRowRight}>
          <button
            type="button"
            className={styles.minimiseButton}
            onClick={toggleSearchBarMinimised}
            aria-label="Minimise search bar"
            title="Minimise search bar"
          >
            <MinimiseIcon />
          </button>
        </div>
      </div>

      {/* Middle row: Search input with scope toggle */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Search... (AND, OR, NOT, -exclude)"
            value={localQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-label="Search cards"
            title="Boolean search: AND, OR, NOT, -exclude, &quot;exact phrase&quot;. Press / to focus."
          />
          {hasActiveSearch && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
        </div>

        <button
          type="button"
          className={[styles.scopeButton, searchScope === "visible" ? styles.scopeButtonActive : ""].filter(Boolean).join(" ")}
          onClick={handleScopeToggle}
          aria-label={`Search ${searchScope === "all" ? "all" : "visible"} cards`}
          title={searchScope === "all" ? "Searching all cards" : "Searching visible cards only"}
        >
          {searchScope === "all" ? "All" : "Visible"}
        </button>
      </div>

      {/* Bottom row: Filter chips on left, result count on right */}
      <div className={styles.bottomRow}>
        <FilterChips filterOptions={filterOptions} />
        {isFiltered && (
          <span className={styles.resultCount} aria-live="polite">
            Showing {filteredCount} of {totalCards} cards
          </span>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
