/**
 * SearchButton component.
 *
 * Floating action button for toggling the search bar overlay.
 * Shows an indicator when search/filters are active.
 */

import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./SearchButton.module.css";

interface SearchButtonProps {
  onClick: () => void;
  disabled?: boolean;
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

/**
 * Floating search button that toggles the search bar.
 */
export function SearchButton({ onClick, disabled }: SearchButtonProps) {
  const searchQuery = useSettingsStore((state) => state.searchQuery);
  const activeFilters = useSettingsStore((state) => state.activeFilters);

  const hasActiveSearch = searchQuery.trim() !== "" || activeFilters.length > 0;

  return (
    <button
      type="button"
      className={[
        styles.button,
        disabled ? styles.buttonDisabled : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label="Open search"
      title="Open search (press /)"
    >
      <SearchIcon />
      {hasActiveSearch && <span className={styles.indicator} />}
    </button>
  );
}

export default SearchButton;
