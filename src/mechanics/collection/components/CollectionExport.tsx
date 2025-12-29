/**
 * Collection completion/export component.
 *
 * Shows a congratulations screen with stats and export option.
 */

import { useCallback } from "react";
import { motion } from "framer-motion";
import { useCollectionStore } from "../store";
import { useMechanicContext } from "../../context";
import styles from "../collection.module.css";

interface CollectionExportModalProps {
  onClose: () => void;
}

/**
 * Collection completion modal with export option.
 */
export function CollectionExportModal({ onClose }: CollectionExportModalProps) {
  const activeSourceId = useCollectionStore((s) => s.activeSourceId);
  const exportCollection = useCollectionStore((s) => s.exportCollection);
  const getStats = useCollectionStore((s) => s.getStats);

  const { deactivateMechanic, openMechanicPanel } = useMechanicContext();

  const stats = getStats();

  const handleExport = useCallback(() => {
    const data = exportCollection();
    if (!data) return;

    // Create download
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Generate filename with source and date
    const date = new Date().toISOString().split("T")[0];
    const sourceSlug = (activeSourceId ?? "collection")
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .slice(0, 30);
    link.download = `collection-${sourceSlug}-${String(date)}.json`;

    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportCollection, activeSourceId]);

  const handleExit = useCallback(() => {
    deactivateMechanic();
    onClose();
  }, [deactivateMechanic, onClose]);

  const handleDifferentGame = useCallback(() => {
    deactivateMechanic();
    openMechanicPanel();
    onClose();
  }, [deactivateMechanic, openMechanicPanel, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <motion.div
        className={styles.resultsContent}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>Congratulations!</h2>
          <p className={styles.resultsSubtitle}>Your collection is saved</p>
        </div>

        {/* Stats grid */}
        <div className={styles.resultsStats}>
          <div className={`${styles.resultsStat} ${styles.owned ?? ""}`}>
            <span className={styles.resultsStatValue}>{stats.owned}</span>
            <span className={styles.resultsStatLabel}>Owned</span>
          </div>
          <div className={`${styles.resultsStat} ${styles.wishlist ?? ""}`}>
            <span className={styles.resultsStatValue}>{stats.wishlist}</span>
            <span className={styles.resultsStatLabel}>Wishlist</span>
          </div>
          <div className={styles.resultsStat}>
            <span className={styles.resultsStatValue}>{stats.percentComplete}%</span>
            <span className={styles.resultsStatLabel}>Complete</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.resultsProgressBar}>
          <div
            className={styles.resultsProgressFill}
            style={{ width: `${String(stats.percentComplete)}%` }}
          />
        </div>

        {/* Export option */}
        {(stats.owned > 0 || stats.wishlist > 0) && (
          <button
            type="button"
            className={styles.exportLinkButton}
            onClick={handleExport}
          >
            Download as JSON
          </button>
        )}

        {/* Action buttons */}
        <div className={styles.resultsActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleExit}
          >
            Exit
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleDifferentGame}
          >
            Different Game
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onClose}
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
