/**
 * Expandable search bar component.
 *
 * Expands from the search button with text input and explorer toggle.
 */

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./SearchBar.module.css";

/**
 * Search icon SVG.
 */
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
 * Explorer/filter icon SVG.
 */
function FilterIcon() {
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
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

/**
 * Close/X icon SVG.
 */
function CloseIcon() {
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

interface SearchBarProps {
  /** Whether the search bar is expanded */
  isExpanded: boolean;

  /** Current search query */
  query: string;

  /** Callback when query changes */
  onQueryChange: (query: string) => void;

  /** Callback when search bar should collapse */
  onClose: () => void;

  /** Callback when explorer button is clicked */
  onExplorerClick: () => void;

  /** Placeholder text for the input */
  placeholder?: string;
}

/**
 * Expandable search bar component.
 *
 * Features:
 * - Expands from SearchButton position
 * - Text input for dynamic filtering
 * - Explorer icon button for filter panel
 * - Close button to collapse
 * - Real-time filtering as user types
 *
 * @example
 * ```tsx
 * <SearchBar
 *   isExpanded={searchExpanded}
 *   query={searchQuery}
 *   onQueryChange={setSearchQuery}
 *   onClose={() => setSearchExpanded(false)}
 *   onExplorerClick={() => setExplorerOpen(true)}
 * />
 * ```
 */
export function SearchBar({
  isExpanded,
  query,
  onQueryChange,
  onClose,
  onExplorerClick,
  placeholder = "Search cards...",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle escape to close
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle input change
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(event.target.value);
    },
    [onQueryChange]
  );

  // Clear search
  const handleClear = useCallback(() => {
    onQueryChange("");
    inputRef.current?.focus();
  }, [onQueryChange]);

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          className={styles.container}
          initial={{ width: 48, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Search icon */}
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search cards"
          />

          {/* Clear button (when query exists) */}
          {query.length > 0 && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <CloseIcon />
            </button>
          )}

          {/* Explorer button */}
          <button
            type="button"
            className={styles.explorerButton}
            onClick={onExplorerClick}
            aria-label="Open filter explorer"
            title="Filter options"
          >
            <FilterIcon />
          </button>

          {/* Close button */}
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close search"
          >
            <CloseIcon />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SearchBar;
