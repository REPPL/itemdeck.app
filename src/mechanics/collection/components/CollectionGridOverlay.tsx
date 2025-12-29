/**
 * Collection grid overlay component.
 *
 * Shows collection progress at the top of the grid:
 * - Compact mode: Just count and expand toggle
 * - Expanded mode: Progress bar, statistics, export button
 * - Done button to finish collecting
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCollectionStore } from "../store";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useMechanicContext } from "../../context";
import { CollectionExportModal } from "./CollectionExport";
import type { GridOverlayProps } from "../../types";
import styles from "../collection.module.css";

/**
 * Heart icon for compact progress display.
 */
function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={styles.progressHeartIcon}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/**
 * Expand/collapse chevron icon.
 */
function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${styles.chevronIcon ?? ""} ${collapsed ? styles.chevronCollapsed ?? "" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Collapse icon (><) for expanded state.
 */
function CollapseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.collapseIconSvg}
    >
      {/* Left arrow pointing right */}
      <polyline points="5 9 9 12 5 15" />
      {/* Right arrow pointing left */}
      <polyline points="19 9 15 12 19 15" />
    </svg>
  );
}

/**
 * Collection grid overlay.
 * Shows progress bar and statistics.
 */
export function CollectionGridOverlay({ position }: GridOverlayProps) {
  const isActive = useCollectionStore((s) => s.isActive);
  const settings = useCollectionStore((s) => s.settings);
  const getStats = useCollectionStore((s) => s.getStats);
  const setAllCardIds = useCollectionStore((s) => s.setAllCardIds);
  const updateSettings = useCollectionStore((s) => s.updateSettings);
  const { cards } = useCollectionData();
  const { deactivateMechanic } = useMechanicContext();

  const [showExportModal, setShowExportModal] = useState(false);

  // Initialise card IDs for stats calculation
  useEffect(() => {
    if (isActive && cards.length > 0) {
      setAllCardIds(cards.map((c) => c.id));
    }
  }, [isActive, cards, setAllCardIds]);

  // Get stats (recalculated on store changes)
  const stats = getStats();

  const handleExportClick = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setShowExportModal(false);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    updateSettings({ progressCollapsed: !settings.progressCollapsed });
  }, [settings.progressCollapsed, updateSettings]);

  const handleDone = useCallback(() => {
    // Open export modal first to let user save their collection
    setShowExportModal(true);
  }, []);

  const handleExitAfterExport = useCallback(() => {
    setShowExportModal(false);
    deactivateMechanic();
  }, [deactivateMechanic]);

  // Only show at top position
  if (position !== "top") {
    return (
      <>
        {showExportModal && (
          <CollectionExportModal onClose={handleCloseExportModal} />
        )}
      </>
    );
  }

  if (!isActive || !settings.showProgress) return null;

  const isCollapsed = settings.progressCollapsed;

  return (
    <>
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          // Compact/collapsed view
          <motion.div
            key="compact"
            className={styles.progressCompact}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button
              type="button"
              className={styles.compactDoneButton}
              onClick={handleDone}
            >
              Done
            </button>
            <button
              type="button"
              className={styles.compactContent}
              onClick={handleToggleCollapse}
              aria-label="Expand progress bar"
            >
              <HeartIcon />
              <span className={styles.compactCount}>{stats.owned}</span>
              <span className={styles.compactSeparator}>/</span>
              <span className={styles.compactTotal}>{stats.total}</span>
              <ChevronIcon collapsed={isCollapsed} />
            </button>
          </motion.div>
        ) : (
          // Expanded view
          <motion.div
            key="expanded"
            className={styles.progressOverlay}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Left section: Action buttons */}
            <div className={styles.progressActions}>
              <button
                type="button"
                className={styles.doneButton}
                onClick={handleDone}
              >
                Done
              </button>
              <button
                type="button"
                className={styles.exportButton}
                onClick={handleExportClick}
                aria-label="Export collection"
              >
                Export
              </button>
            </div>

            {/* Center section: Title, progress bar, stats */}
            <div className={styles.progressMain}>
              <div className={styles.progressHeader}>
                <span className={styles.progressTitle}>Collection Progress</span>
              </div>

              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${String(stats.percentComplete)}%` }}
                />
              </div>

              <div className={styles.progressStats}>
                <span className={styles.statOwned}>
                  <HeartIcon />
                  {stats.owned}
                </span>
                <span className={styles.statWishlist}>
                  <span className={styles.statIcon}>&#9825;</span>
                  {stats.wishlist}
                </span>
                <span className={styles.statRemaining}>
                  {stats.remaining} remaining
                </span>
                <span className={styles.statPercent}>
                  {stats.percentComplete}%
                </span>
              </div>
            </div>

            {/* Right section: Collapse button */}
            <button
              type="button"
              className={styles.collapseButton}
              onClick={handleToggleCollapse}
              aria-label="Collapse progress bar"
            >
              <CollapseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showExportModal && (
        <CollectionExportModal onClose={handleExitAfterExport} />
      )}
    </>
  );
}

/**
 * Keyboard shortcut handler for collection.
 * Must be mounted when mechanic is active.
 */
export function CollectionKeyboardHandler() {
  const isActive = useCollectionStore((s) => s.isActive);
  const settings = useCollectionStore((s) => s.settings);
  const toggleOwned = useCollectionStore((s) => s.toggleOwned);
  const toggleWishlist = useCollectionStore((s) => s.toggleWishlist);
  const updateSettings = useCollectionStore((s) => s.updateSettings);

  useEffect(() => {
    if (!isActive || !settings.keyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // 'P' toggles progress bar collapse/expand
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        updateSettings({ progressCollapsed: !settings.progressCollapsed });
        return;
      }

      // Get the currently focused card element
      const focusedCard = document.querySelector<HTMLElement>(
        "[data-card-id]:focus, [data-card-id]:focus-within"
      );

      if (!focusedCard) return;

      const cardId = focusedCard.dataset.cardId;
      if (!cardId) return;

      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        toggleOwned(cardId);
      } else if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        toggleWishlist(cardId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, settings.keyboardShortcuts, settings.progressCollapsed, toggleOwned, toggleWishlist, updateSettings]);

  return null;
}
