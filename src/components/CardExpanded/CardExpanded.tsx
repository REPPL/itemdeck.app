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
import { SourceIcon, isKnownSource, getSourceShortName } from "@/components/SourceIcon";
import { ExternalLinkIcon, CloseIcon, InfoIcon, EditIcon } from "@/components/Icons";
import { EditForm } from "@/components/EditForm";
import { InfoTooltip } from "@/components/InfoTooltip";
import { getDisplayableFields, categoriseFields } from "@/utils/entityFields";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUILabels } from "@/context/CollectionUIContext";
import { useCollectionData } from "@/context/CollectionDataContext";
import { isLightColour } from "@/utils/colourContrast";
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
  const [editFormOpen, setEditFormOpen] = useState(false);

  // Get settings from store
  const visualTheme = useSettingsStore((state) => state.visualTheme);
  const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);
  const currentCustomisation = themeCustomisations[visualTheme];
  const moreButtonLabel = currentCustomisation.moreButtonLabel;
  const autoExpandMore = currentCustomisation.autoExpandMore;
  const zoomImage = currentCustomisation.zoomImage;
  const detailAnimationEnabled = currentCustomisation.detailAnimation;
  const overlayAnimationEnabled = currentCustomisation.overlayAnimation;
  const verdictAnimationStyle = currentCustomisation.verdictAnimationStyle;
  const cardBackgroundColour = currentCustomisation.cardBackgroundColour;
  const editModeEnabled = useSettingsStore((state) => state.editModeEnabled);

  // Check if card has local edits (via _editedAt field added during merge)
  const cardEditedAt = (card as unknown as Record<string, unknown>)._editedAt as number | undefined;
  const cardHasEdits = cardEditedAt !== undefined;

  // Determine if background is light (needs dark text)
  const hasLightBackground = useMemo(() => {
    if (!cardBackgroundColour) return false;
    // Strip alpha channel if present (8-char hex -> 6-char)
    const cleanHex = cardBackgroundColour.replace(/^#/, "");
    const hex6 = cleanHex.length === 8 ? cleanHex.slice(0, 6) : cleanHex;
    return isLightColour(`#${hex6}`);
  }, [cardBackgroundColour]);

  // Get UI labels from collection context
  const uiLabels = useUILabels();

  // Get display config from collection for verdict fields
  const { displayConfig } = useCollectionData();
  const verdictFields = displayConfig?.card?.verdictFields;

  // Auto-discover displayable fields from the card entity
  const { prominent: _prominent, additional: additionalFields } = useMemo(() => {
    // Cast card to record for field discovery
    const entity = card as unknown as Record<string, unknown>;
    const allFields = getDisplayableFields(entity, { verdictFields });
    return categoriseFields(allFields);
  }, [card, verdictFields]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Reset overlay states when closing, auto-expand if setting is enabled when opening
  useEffect(() => {
    if (isOpen) {
      // Auto-expand "More" overlay when opening if setting is enabled
      if (autoExpandMore && additionalFields.length > 0) {
        setDetailsExpanded(true);
      }
    } else {
      // Reset all overlay states when closing
      setDetailsExpanded(false);
      setShowAttribution(false);
      setPlatformExpanded(false);
      setEditFormOpen(false);
    }
  }, [isOpen, autoExpandMore, additionalFields.length]);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    setEditFormOpen(true);
  }, []);

  const handleEditFormClose = useCallback(() => {
    setEditFormOpen(false);
  }, []);

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

  // Format edit timestamp for display
  const formattedEditDate = useMemo(() => {
    if (!cardEditedAt) return null;
    const date = new Date(cardEditedAt);
    // Format as "Edited 26 Dec 2025" or similar
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [cardEditedAt]);

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
          transition={{ duration: detailAnimationEnabled ? 0.3 : 0 }}
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
            initial={detailAnimationEnabled ? getOriginStyles() : { opacity: 0 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            exit={detailAnimationEnabled ? getOriginStyles() : { opacity: 0 }}
            transition={detailAnimationEnabled
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
            }
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Header row: Rank badge (left) and buttons (right) */}
            <div className={styles.headerRow}>
              <div className={styles.rankBadge}>
                <RankBadge rank={card.order ?? null} size="large" />
                {/* Edit indicator badge when card has local edits */}
                {cardHasEdits && (
                  <span className={styles.editIndicator} title="This card has local edits">
                    <EditIcon size={12} />
                  </span>
                )}
              </div>
              <div className={styles.headerButtons}>
                {/* Edit button (only shown when edit mode is enabled) */}
                {editModeEnabled && (
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={handleEditClick}
                    aria-label="Edit card"
                    title="Edit card"
                  >
                    <EditIcon size={20} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={onClose}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Image gallery */}
            <div className={styles.galleryContainer}>
              <ImageGallery
                images={card.imageUrls}
                alt={card.title}
                showArrows
                showDots
                zoomImage={zoomImage}
              />
              {/* Platform button inside gallery, bottom right - inactive when overlay is shown */}
              {card.categoryInfo && (
                <button
                  type="button"
                  className={[
                    styles.galleryPlatformButton,
                    platformExpanded ? styles.galleryPlatformButtonInactive : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => { setPlatformExpanded(!platformExpanded); }}
                  aria-expanded={platformExpanded}
                  aria-controls="platform-overlay"
                >
                  <span>{card.categoryInfo.title}</span>
                  <InfoIcon />
                </button>
              )}
            </div>

            {/* Card info */}
            <div className={styles.info}>
              {/* Title and year row */}
              <header className={styles.header}>
                <div className={styles.headerLeft}>
                  <h2 id="expanded-card-title" className={styles.title}>
                    {card.title}
                  </h2>
                  {card.year && <span className={styles.year}>{card.year}</span>}
                </div>
              </header>

              {/* Divider */}
              <div className={styles.divider} />

              {/* Summary */}
              {card.summary && (
                <p className={styles.summary}>{card.summary}</p>
              )}

              {/* Footer row: Left group (Acknowledgement + Source) | Right (More) */}
              <div className={styles.footer}>
                <div className={styles.footerLeft}>
                  {card.imageAttribution && (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => { setShowAttribution(!showAttribution); }}
                      aria-expanded={showAttribution}
                      aria-controls="attribution-overlay"
                      aria-label="Image acknowledgement"
                      title="Image acknowledgement"
                    >
                      <InfoIcon />
                    </button>
                  )}
                  {/* Show detail URLs deduplicated by source */}
                  {card.detailUrls && card.detailUrls.length > 0 ? (
                    deduplicateLinksBySource(card.detailUrls).map((link, index) => {
                      const hasKnownIcon = isKnownSource(link.url);
                      const sourceInfo = getSourceShortName(link.url);
                      const displayName = sourceInfo?.shortName ?? link.source ?? link.label ?? uiLabels.sourceButtonDefault;
                      const fullName = sourceInfo?.title ?? link.source ?? link.label ?? uiLabels.sourceButtonDefault;
                      return (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={hasKnownIcon ? styles.sourceIconButton : styles.outlineButton}
                          title={fullName}
                        >
                          {hasKnownIcon ? (
                            <>
                              <SourceIcon url={link.url} source={link.source} className={styles.sourceIconSvg} />
                              <ExternalLinkIcon />
                            </>
                          ) : (
                            <>
                              <span>{displayName}</span>
                              <ExternalLinkIcon />
                            </>
                          )}
                        </a>
                      );
                    })
                  ) : card.detailUrl ? (
                    <a
                      href={card.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isKnownSource(card.detailUrl) ? styles.sourceIconButton : styles.outlineButton}
                      title={uiLabels.sourceButtonDefault}
                    >
                      {isKnownSource(card.detailUrl) ? (
                        <>
                          <SourceIcon url={card.detailUrl} className={styles.sourceIconSvg} />
                          <ExternalLinkIcon />
                        </>
                      ) : (
                        <>
                          <span>{uiLabels.sourceButtonDefault}</span>
                          <ExternalLinkIcon />
                        </>
                      )}
                    </a>
                  ) : null}
                </div>

                {/* More/Verdict button - primary style on right */}
                {hasAdditionalFields && (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => { setDetailsExpanded(!detailsExpanded); }}
                    aria-expanded={detailsExpanded}
                    aria-controls="more-overlay"
                  >
                    <InfoIcon />
                    <span>{moreButtonLabel}</span>
                  </button>
                )}
              </div>

              {/* Attribution overlay */}
              <AnimatePresence>
                {showAttribution && card.imageAttribution && (
                  <motion.div
                    id="attribution-overlay"
                    className={styles.attributionOverlay}
                    initial={overlayAnimationEnabled ? { opacity: 0, y: 20 } : { opacity: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={overlayAnimationEnabled ? { opacity: 0, y: 20 } : { opacity: 0 }}
                    transition={{ duration: overlayAnimationEnabled ? 0.2 : 0 }}
                  >
                    <div className={styles.attributionHeader}>
                      <div className={styles.attributionContent}>
                        <span className={styles.attributionLabel}>
                          {card.imageUrls.length > 1
                            ? uiLabels.imageSourceLabel
                                .replace(/^Image\b/i, "Images")
                                .replace(/\bSource$/i, "Sources")
                            : uiLabels.imageSourceLabel}
                        </span>
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

            </div>

            {/* More details overlay - outside info section so it can expand to full panel */}
            <AnimatePresence>
              {detailsExpanded && hasAdditionalFields && (
                <motion.div
                  id="more-overlay"
                  className={[
                    styles.moreOverlay,
                    verdictAnimationStyle === "flip" ? styles.moreOverlayFlip : "",
                  ].filter(Boolean).join(" ")}
                  data-light-bg={hasLightBackground ? "true" : undefined}
                  initial={overlayAnimationEnabled
                    ? verdictAnimationStyle === "flip"
                      ? { rotateY: 180, opacity: 0 }
                      : { opacity: 0, y: 20, scaleY: 0.8 }
                    : { opacity: 0 }
                  }
                  animate={verdictAnimationStyle === "flip"
                    ? { rotateY: 0, opacity: 1 }
                    : { opacity: 1, y: 0, scaleY: 1 }
                  }
                  exit={overlayAnimationEnabled
                    ? verdictAnimationStyle === "flip"
                      ? { rotateY: 180, opacity: 0 }
                      : { opacity: 0, y: 20, scaleY: 0.8 }
                    : { opacity: 0 }
                  }
                  transition={overlayAnimationEnabled
                    ? verdictAnimationStyle === "flip"
                      ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                      : { duration: 0.2, ease: "easeOut" }
                    : { duration: 0 }
                  }
                  style={{
                    ...(verdictAnimationStyle === "flip" ? { transformStyle: "preserve-3d" as const } : {}),
                    backgroundColor: cardBackgroundColour,
                  }}
                >
                  <div className={styles.moreHeader}>
                    <div className={styles.moreHeaderLeft}>
                      <span className={styles.moreTitle}>{card.title}</span>
                      {card.year && <span className={styles.moreYear}>{card.year}</span>}
                    </div>
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
                    {additionalFields.map(({ key, label, value, description }) => (
                      <div key={key} className={styles.metadataItem}>
                        <dt className={styles.metadataKey}>
                          {label}
                          {description && <InfoTooltip text={description} />}
                        </dt>
                        <dd className={styles.metadataValue}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {/* Edit timestamp footer */}
                  {formattedEditDate && (
                    <div className={styles.moreFooter}>
                      <span className={styles.editedTimestamp}>
                        Edited {formattedEditDate}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Platform overlay - outside info section so it can expand to full panel */}
            <AnimatePresence>
              {platformExpanded && card.categoryInfo && (
                <motion.div
                  id="platform-overlay"
                  className={styles.platformOverlay}
                  initial={overlayAnimationEnabled ? { opacity: 0, y: 20, scaleY: 0.8 } : { opacity: 0 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={overlayAnimationEnabled ? { opacity: 0, y: 20, scaleY: 0.8 } : { opacity: 0 }}
                  transition={overlayAnimationEnabled ? { duration: 0.2, ease: "easeOut" } : { duration: 0 }}
                >
                  <div className={styles.platformOverlayHeader}>
                    <div className={styles.platformOverlayHeaderLeft}>
                      <span className={styles.platformOverlayName}>{card.categoryInfo.title}</span>
                      {card.categoryInfo.year && <span className={styles.platformOverlayYear}>{card.categoryInfo.year}</span>}
                    </div>
                    <button
                      type="button"
                      className={styles.platformOverlayCloseButton}
                      onClick={() => { setPlatformExpanded(false); }}
                      aria-label="Close platform info"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  {card.categoryInfo.summary && (
                    <p className={styles.platformOverlaySummary}>{card.categoryInfo.summary}</p>
                  )}
                  {card.categoryInfo.additionalFields && Object.keys(card.categoryInfo.additionalFields).length > 0 && (
                    <dl className={styles.platformOverlayFields}>
                      {Object.entries(card.categoryInfo.additionalFields).map(([key, value]) => {
                        const displayValue = typeof value === "string" || typeof value === "number"
                          ? String(value)
                          : Array.isArray(value)
                            ? value.join(", ")
                            : null;
                        if (!displayValue) return null;

                        const label = key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase())
                          .trim();

                        return (
                          <div key={key} className={styles.platformOverlayField}>
                            <dt className={styles.platformOverlayFieldLabel}>{label}</dt>
                            <dd className={styles.platformOverlayFieldValue}>{displayValue}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                  {/* Footer with links */}
                  {card.categoryInfo.detailUrls && card.categoryInfo.detailUrls.length > 0 && (
                    <div className={styles.platformOverlayFooter}>
                      {deduplicateLinksBySource(card.categoryInfo.detailUrls).map((link, index) => {
                        const hasKnownIcon = isKnownSource(link.url);
                        const sourceInfo = getSourceShortName(link.url);
                        const displayName = sourceInfo?.shortName ?? link.source ?? link.label ?? uiLabels.sourceButtonDefault;
                        const fullName = sourceInfo?.title ?? link.source ?? link.label ?? uiLabels.sourceButtonDefault;
                        return (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={hasKnownIcon ? styles.sourceIconButton : styles.platformOverlayLink}
                            title={fullName}
                          >
                            {hasKnownIcon ? (
                              <>
                                <SourceIcon url={link.url} source={link.source} className={styles.sourceIconSvg} />
                                <ExternalLinkIcon />
                              </>
                            ) : (
                              <>
                                <span>{displayName}</span>
                                <ExternalLinkIcon />
                              </>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(content, document.body)}
      {/* Edit form modal */}
      {editFormOpen && (
        <EditForm card={card} onClose={handleEditFormClose} />
      )}
    </>
  );
}

export default CardExpanded;
