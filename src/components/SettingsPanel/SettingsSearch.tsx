/**
 * Settings search component.
 *
 * Provides a search input that filters settings across all tabs
 * and displays matching results with navigation links.
 *
 * v0.11.5: Updated to support 5 tabs and moved to header position.
 */

import { useRef, useEffect } from "react";
import {
  useSettingsSearch,
  getTabDisplayName,
  getSubTabDisplayName,
  type SettingSearchResult,
} from "@/hooks/useSettingsSearch";
import { CloseIcon } from "@/components/Icons";
import styles from "./SettingsPanel.module.css";

interface SettingsSearchProps {
  /** Callback when a search result is selected */
  onNavigate: (tab: "quick" | "appearance" | "collections" | "data" | "system", subTab?: string) => void;
}

/**
 * Search icon component.
 */
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
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

/**
 * Format a search result for display.
 */
function formatResultLocation(result: SettingSearchResult): string {
  const tab = getTabDisplayName(result.tab);
  const subTab = getSubTabDisplayName(result.subTab);
  return subTab ? `${tab} > ${subTab}` : tab;
}

/**
 * Settings search component with autocomplete results.
 * Now positioned in header area (v0.11.5).
 */
export function SettingsSearch({ onNavigate }: SettingsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, isSearching, clearSearch } = useSettingsSearch();

  // Focus input on mount
  useEffect(() => {
    // Small delay to ensure panel animation is complete
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => { clearTimeout(timer); };
  }, []);

  const handleResultClick = (result: SettingSearchResult) => {
    onNavigate(result.tab, result.subTab);
    clearSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isSearching) {
      e.preventDefault();
      e.stopPropagation();
      clearSearch();
    }
  };

  return (
    <div className={styles.searchContainerHeader}>
      <div className={styles.searchInputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          onKeyDown={handleKeyDown}
          aria-label="Search settings"
          aria-expanded={results.length > 0}
          aria-controls="settings-search-results"
          role="combobox"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {isSearching ? (
          <button
            type="button"
            className={styles.searchClearButton}
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <CloseIcon size={14} />
          </button>
        ) : (
          <span className={styles.searchIconRight}>
            <SearchIcon />
          </span>
        )}
      </div>

      {results.length > 0 && (
        <ul
          id="settings-search-results"
          className={styles.searchResults}
          role="listbox"
        >
          {results.slice(0, 8).map((result) => (
            <li key={result.id} role="option">
              <button
                type="button"
                className={styles.searchResultItem}
                onClick={() => { handleResultClick(result); }}
              >
                <span className={styles.searchResultLabel}>{result.label}</span>
                <span className={styles.searchResultLocation}>
                  {formatResultLocation(result)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isSearching && results.length === 0 && (
        <div className={styles.searchNoResults}>
          No settings found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
