/**
 * Expanded card view with animation from card position.
 *
 * Shows a detailed view of a card with image gallery, rank display,
 * and additional metadata.
 */

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ImageGallery } from "@/components/ImageGallery";
import { RankBadge } from "@/components/RankBadge";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./CardExpanded.module.css";

/**
 * External link icon.
 */
function ExternalLinkIcon() {
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/**
 * More details icon.
 */
function MoreIcon() {
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

/**
 * Close icon.
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

interface CardExpandedProps {
  /** Card data to display */
  card: DisplayCard;

  /** Whether the expanded view is open */
  isOpen: boolean;

  /** Callback when the view should close */
  onClose: () => void;

  /** Original card position for animation origin */
  originRect?: DOMRect | null;

  /** Rank display style */
  rankDisplayStyle?: "text" | "emoji" | "graphic";
}

/**
 * Expanded card view component.
 *
 * Features:
 * - Animates from original card position to centre screen
 * - Blurred/dimmed background (non-interactive)
 * - Image gallery with left/right navigation + dots
 * - Swipe gesture support for iPad/touch devices
 * - Rank display with configurable theme
 * - "View More" button for external link
 * - "More details" expandable section
 *
 * @example
 * ```tsx
 * <CardExpanded
 *   card={selectedCard}
 *   isOpen={isDetailOpen}
 *   onClose={() => setIsDetailOpen(false)}
 *   originRect={cardRef.current?.getBoundingClientRect()}
 * />
 * ```
 */
export function CardExpanded({
  card,
  isOpen,
  onClose,
  originRect,
}: CardExpandedProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Check if card has additional metadata
  const hasMetadata =
    card.metadata &&
    Object.keys(card.metadata).filter((k) => !["category", "rank", "device"].includes(k)).length > 0;

  // Calculate animation origin
  const getOriginStyles = () => {
    if (!originRect) {
      return { scale: 0.5, opacity: 0 };
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = originRect.left + originRect.width / 2;
    const originCenterY = originRect.top + originRect.height / 2;

    return {
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      scale: originRect.width / 400, // Approximate expanded width
    };
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        >
          <motion.div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="expanded-card-title"
            tabIndex={-1}
            initial={getOriginStyles()}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            exit={getOriginStyles()}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Close button */}
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon />
            </button>

            {/* Image gallery */}
            <div className={styles.galleryContainer}>
              <ImageGallery
                images={card.imageUrls}
                alt={card.title}
                showArrows
                showDots
              />
            </div>

            {/* Card info */}
            <div className={styles.info}>
              {/* Title and year */}
              <header className={styles.header}>
                <h2 id="expanded-card-title" className={styles.title}>
                  {card.title}
                </h2>
                {card.year && <span className={styles.year}>{card.year}</span>}
              </header>

              {/* Rank badge */}
              <div className={styles.rankContainer}>
                <RankBadge rank={card.rank} size="large" />
              </div>

              {/* Summary */}
              {card.summary && (
                <p className={styles.summary}>{card.summary}</p>
              )}

              {/* Device/category */}
              {card.device && (
                <div className={styles.device}>
                  <span className={styles.deviceLabel}>Platform:</span>
                  <span className={styles.deviceValue}>{card.device}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className={styles.actions}>
                {/* View more (external link) */}
                {card.detailUrl && (
                  <a
                    href={card.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewMoreButton}
                  >
                    <span>View More</span>
                    <ExternalLinkIcon />
                  </a>
                )}

                {/* More details (if metadata exists) */}
                {hasMetadata && (
                  <button type="button" className={styles.moreDetailsButton}>
                    <MoreIcon />
                    <span>Details</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default CardExpanded;
