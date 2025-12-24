/**
 * Expanded card view with animation from card position.
 *
 * Shows a detailed view of a card with image gallery, rank display,
 * and auto-discovered entity fields.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ImageGallery } from "@/components/ImageGallery";
import { RankBadge } from "@/components/RankBadge";
import { getDisplayableFields, categoriseFields } from "@/utils/entityFields";
import type { DisplayCard } from "@/hooks/useCollection";
import type { DetailLink } from "@/types/links";
import styles from "./CardExpanded.module.css";

/**
 * Deduplicate links by source, keeping only the first link per source.
 */
function deduplicateLinksBySource(links: DetailLink[]): DetailLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = link.source ?? link.label ?? link.url;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

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
 * Chevron icon for expanding/collapsing.
 */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
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

/**
 * Info icon for acknowledgement button.
 */
function InfoIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);
  const [platformExpanded, setPlatformExpanded] = useState(false);

  // Auto-discover displayable fields from the card entity
  const { prominent: _prominent, additional: additionalFields } = useMemo(() => {
    // Cast card to record for field discovery
    const entity = card as unknown as Record<string, unknown>;
    const allFields = getDisplayableFields(entity);
    return categoriseFields(allFields);
  }, [card]);

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

  // Check if card has additional fields to display
  const hasAdditionalFields = additionalFields.length > 0;

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
            {/* Header row: Rank badge (left) and Close button (right) */}
            <div className={styles.headerRow}>
              <div className={styles.rankBadge}>
                <RankBadge rank={card.order ?? card.rank ?? null} size="large" />
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

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
              {/* Title and year row */}
              <header className={styles.header}>
                <h2 id="expanded-card-title" className={styles.title}>
                  {card.title}
                </h2>
                {card.year && <span className={styles.year}>{card.year}</span>}
              </header>

              {/* Divider */}
              <div className={styles.divider} />

              {/* Summary */}
              {card.summary && (
                <p className={styles.summary}>{card.summary}</p>
              )}

              {/* Platform - expandable to show platform details */}
              {card.categoryInfo && (
                <div className={styles.platformSection}>
                  <button
                    type="button"
                    className={styles.platformRow}
                    onClick={() => { setPlatformExpanded(!platformExpanded); }}
                    aria-expanded={platformExpanded}
                    aria-controls="platform-details"
                  >
                    <span className={styles.platformLabel}>Platform:</span>
                    <span className={styles.platformValue}>{card.categoryInfo.title}</span>
                    {card.categoryInfo.year && (
                      <span className={styles.platformYear}>({card.categoryInfo.year})</span>
                    )}
                    <span className={styles.platformChevron}>
                      <ChevronIcon expanded={platformExpanded} />
                    </span>
                  </button>
                  <AnimatePresence>
                    {platformExpanded && (
                      <motion.div
                        id="platform-details"
                        className={styles.platformDetails}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {card.categoryInfo.summary && (
                          <p className={styles.platformSummary}>{card.categoryInfo.summary}</p>
                        )}
                        {card.categoryInfo.detailUrls && card.categoryInfo.detailUrls.length > 0 && (
                          <div className={styles.platformLinks}>
                            {deduplicateLinksBySource(card.categoryInfo.detailUrls).map((link, index) => (
                              <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.platformLink}
                              >
                                <span>{link.source ?? link.label ?? "Source"}</span>
                                <ExternalLinkIcon />
                              </a>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Footer row: Left group (Acknowledgement + Source) | Right (More) */}
              <div className={styles.footer}>
                <div className={styles.footerLeft}>
                  {card.imageAttribution && (
                    <button
                      type="button"
                      className={styles.outlineButton}
                      onClick={() => { setShowAttribution(!showAttribution); }}
                      aria-expanded={showAttribution}
                      aria-controls="attribution-overlay"
                    >
                      <InfoIcon />
                      <span>Acknowledgement</span>
                    </button>
                  )}
                  {/* Show detail URLs deduplicated by source */}
                  {card.detailUrls && card.detailUrls.length > 0 ? (
                    deduplicateLinksBySource(card.detailUrls).map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.outlineButton}
                      >
                        <span>{link.source ?? link.label ?? "Source"}</span>
                        <ExternalLinkIcon />
                      </a>
                    ))
                  ) : card.detailUrl ? (
                    <a
                      href={card.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.outlineButton}
                    >
                      <span>Source</span>
                      <ExternalLinkIcon />
                    </a>
                  ) : null}
                </div>

                {/* More button - primary style on right */}
                {hasAdditionalFields && (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => { setDetailsExpanded(!detailsExpanded); }}
                    aria-expanded={detailsExpanded}
                    aria-controls="more-overlay"
                  >
                    <ChevronIcon expanded={detailsExpanded} />
                    <span>More</span>
                  </button>
                )}
              </div>

              {/* Attribution overlay */}
              <AnimatePresence>
                {showAttribution && card.imageAttribution && (
                  <motion.div
                    id="attribution-overlay"
                    className={styles.attributionOverlay}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={styles.attributionHeader}>
                      <div className={styles.attributionContent}>
                        <span className={styles.attributionLabel}>Image Source</span>
                        <p className={styles.attributionText}>{card.imageAttribution}</p>
                      </div>
                      <div className={styles.attributionActions}>
                        {(() => {
                          const match = /File:(.+)$/.exec(card.imageAttribution);
                          if (match?.[1]) {
                            const fileName = match[1].trim();
                            const wikipediaUrl = `https://en.wikipedia.org/wiki/File:${encodeURIComponent(fileName)}`;
                            return (
                              <a
                                href={wikipediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.attributionLink}
                              >
                                <span>Source</span>
                                <ExternalLinkIcon />
                              </a>
                            );
                          }
                          return null;
                        })()}
                        <button
                          type="button"
                          className={styles.attributionCloseButton}
                          onClick={() => { setShowAttribution(false); }}
                          aria-label="Close attribution"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* More details overlay */}
              <AnimatePresence>
                {detailsExpanded && hasAdditionalFields && (
                  <motion.div
                    id="more-overlay"
                    className={styles.moreOverlay}
                    initial={{ opacity: 0, y: 20, scaleY: 0.8 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: 20, scaleY: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className={styles.moreHeader}>
                      <span className={styles.moreLabel}>Details</span>
                      <button
                        type="button"
                        className={styles.moreCloseButton}
                        onClick={() => { setDetailsExpanded(false); }}
                        aria-label="Close details"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                    <dl className={styles.metadataList}>
                      {additionalFields.map(({ key, label, value }) => (
                        <div key={key} className={styles.metadataItem}>
                          <dt className={styles.metadataKey}>{label}</dt>
                          <dd className={styles.metadataValue}>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default CardExpanded;
