/**
 * Quick action buttons that appear on card hover/focus.
 *
 * Provides fast access to common actions: favourite, share, external link.
 */

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CardQuickActions.module.css";

/**
 * Props for CardQuickActions component.
 */
interface CardQuickActionsProps {
  /** Whether the actions are visible */
  isVisible: boolean;
  /** Whether the card is favourited */
  isFavourite: boolean;
  /** External URL to link to (optional) */
  externalUrl?: string;
  /** Callback when favourite is toggled */
  onFavouriteToggle: () => void;
  /** Callback when share is clicked */
  onShare: () => void;
  /** Card title for share functionality */
  cardTitle: string;
  /** Whether edit mode is enabled */
  editModeEnabled?: boolean;
  /** Callback when edit is clicked */
  onEdit?: () => void;
}

/**
 * Animation variants for action buttons.
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Quick action buttons for cards.
 *
 * Features:
 * - Fade in with staggered animation on hover
 * - Favourite toggle with heart icon
 * - Share via Web Share API with clipboard fallback
 * - External link to detail URL
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <CardQuickActions
 *   isVisible={isHovered}
 *   isFavourite={favourites.includes(card.id)}
 *   externalUrl={card.detailUrl}
 *   onFavouriteToggle={() => toggleFavourite(card.id)}
 *   onShare={() => shareCard(card)}
 *   cardTitle={card.title}
 * />
 * ```
 */
export function CardQuickActions({
  isVisible,
  isFavourite,
  externalUrl,
  onFavouriteToggle,
  onShare,
  cardTitle,
  editModeEnabled = false,
  onEdit,
}: CardQuickActionsProps) {
  const handleFavouriteClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onFavouriteToggle();
    },
    [onFavouriteToggle]
  );

  const handleShareClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onShare();
    },
    [onShare]
  );

  const handleExternalClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    // Link will navigate naturally
  }, []);

  const handleEditClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onEdit?.();
    },
    [onEdit]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, action: () => void) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        action();
      }
    },
    []
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.container}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          role="toolbar"
          aria-label={`Actions for ${cardTitle}`}
        >
          {/* Favourite button */}
          <motion.button
            className={`${styles.actionButton ?? ""} ${isFavourite ? (styles.active ?? "") : ""}`}
            variants={buttonVariants}
            onClick={handleFavouriteClick}
            onKeyDown={(e) => { handleKeyDown(e, onFavouriteToggle); }}
            aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
            aria-pressed={isFavourite}
            type="button"
          >
            <HeartIcon filled={isFavourite} />
          </motion.button>

          {/* Share button */}
          <motion.button
            className={styles.actionButton}
            variants={buttonVariants}
            onClick={handleShareClick}
            onKeyDown={(e) => { handleKeyDown(e, onShare); }}
            aria-label="Share"
            type="button"
          >
            <ShareIcon />
          </motion.button>

          {/* Edit button (only when edit mode enabled) */}
          {editModeEnabled && onEdit && (
            <motion.button
              className={styles.actionButton}
              variants={buttonVariants}
              onClick={handleEditClick}
              onKeyDown={(e) => { handleKeyDown(e, onEdit); }}
              aria-label="Edit card"
              type="button"
            >
              <EditIcon />
            </motion.button>
          )}

          {/* External link */}
          {externalUrl && (
            <motion.a
              className={styles.actionButton}
              variants={buttonVariants}
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalClick}
              aria-label="Open external link"
            >
              <ExternalLinkIcon />
            </motion.a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Icon components
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export default CardQuickActions;
