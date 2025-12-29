/**
 * Collection card overlay component.
 *
 * Shows a heart icon on each card:
 * - Black outline heart when not in collection
 * - Red filled heart when in collection (owned)
 * - Yellow/gold filled heart when wishlisted
 *
 * The heart is positioned in the top-right corner and is the only
 * clickable element for toggling collection status.
 */

import { useCallback } from "react";
import { motion } from "framer-motion";
import { useCollectionStore } from "../store";
import type { CardOverlayProps } from "../../types";
import styles from "../collection.module.css";

/**
 * Heart icon SVG - outline version (not in collection).
 * Uses stroke only for black outline appearance.
 */
function HeartOutlineIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.heartIcon}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/**
 * Heart icon SVG - filled version (in collection).
 * Uses fill for solid heart appearance with white colour.
 */
function HeartFilledIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      className={styles.heartIcon}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/**
 * Collection card overlay.
 * Shows heart button and handles click to cycle status.
 */
export function CollectionCardOverlay({ cardId }: CardOverlayProps) {
  const isActive = useCollectionStore((s) => s.isActive);
  const getStatus = useCollectionStore((s) => s.getStatus);
  const cycleStatus = useCollectionStore((s) => s.cycleStatus);
  const showUnownedBadge = useCollectionStore((s) => s.settings.showUnownedBadge);

  // Get current status (recalculated on store changes)
  const status = getStatus(cardId);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      cycleStatus(cardId);
    },
    [cardId, cycleStatus]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        cycleStatus(cardId);
      }
    },
    [cardId, cycleStatus]
  );

  if (!isActive) return null;

  // Determine visual state
  const isOwned = status === "owned";
  const isWishlist = status === "wishlist";
  const isInCollection = isOwned || isWishlist;

  // Don't show button for unowned cards if setting is disabled
  if (!isInCollection && !showUnownedBadge) return null;

  // Get appropriate aria-label
  const ariaLabel = isOwned
    ? "In collection - click to add to wishlist"
    : isWishlist
      ? "Wishlisted - click to remove"
      : "Not in collection - click to add";

  // Get button class based on status
  const buttonClass = [
    styles.heartButton,
    isOwned ? styles.heartOwned : "",
    isWishlist ? styles.heartWishlist : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      type="button"
      className={buttonClass}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      title={isOwned ? "In collection" : isWishlist ? "Wishlisted" : "Add to collection"}
    >
      {isInCollection ? <HeartFilledIcon /> : <HeartOutlineIcon />}
    </motion.button>
  );
}
