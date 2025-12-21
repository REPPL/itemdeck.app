/**
 * Floating search button component.
 *
 * Prominent search icon that triggers the search bar expansion.
 */

import { motion } from "framer-motion";
import styles from "./SearchButton.module.css";

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

interface SearchButtonProps {
  /** Callback when button is clicked */
  onClick: () => void;

  /** Whether search is currently expanded */
  isExpanded?: boolean;
}

/**
 * Floating search button component.
 *
 * Features:
 * - Prominent search icon
 * - Position: Top-left (floating)
 * - Click expands to search bar
 * - Smooth hover/tap animations
 *
 * @example
 * ```tsx
 * <SearchButton
 *   onClick={() => setSearchExpanded(true)}
 *   isExpanded={searchExpanded}
 * />
 * ```
 */
export function SearchButton({ onClick, isExpanded = false }: SearchButtonProps) {
  if (isExpanded) {
    return null;
  }

  return (
    <motion.button
      type="button"
      className={styles.button}
      onClick={onClick}
      aria-label="Open search"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <SearchIcon />
    </motion.button>
  );
}

export default SearchButton;
