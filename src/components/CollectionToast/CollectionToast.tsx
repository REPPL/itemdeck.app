/**
 * Collection loaded toast notification.
 *
 * Shows a brief summary when a collection loads successfully.
 * Auto-dismisses after a few seconds.
 */

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCollectionData } from "@/context/CollectionDataContext";
import { computeCollectionStats, formatStatsSummary } from "@/utils/collectionStats";
import styles from "./CollectionToast.module.css";

interface CollectionToastProps {
  /** Whether loading has completed */
  loadingComplete: boolean;
  /** Auto-dismiss duration in ms (default: 4000) */
  dismissDuration?: number;
}

/**
 * Toast showing collection summary after successful load.
 */
export function CollectionToast({
  loadingComplete,
  dismissDuration = 4000,
}: CollectionToastProps) {
  const { cards, isLoading, error } = useCollectionData();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const stats = useMemo(() => {
    if (cards.length === 0) return null;
    return computeCollectionStats(cards);
  }, [cards]);

  const summary = useMemo(() => {
    if (!stats) return "";
    return formatStatsSummary(stats);
  }, [stats]);

  // Show toast when loading completes successfully
  useEffect(() => {
    if (loadingComplete && !isLoading && !error && cards.length > 0 && !dismissed) {
      setVisible(true);

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setVisible(false);
      }, dismissDuration);

      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [loadingComplete, isLoading, error, cards.length, dismissed, dismissDuration]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  if (!summary) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDismiss}
            aria-hidden="true"
          />
          {/* Toast content */}
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            role="status"
            aria-live="polite"
            onClick={handleDismiss}
          >
            <span className={styles.icon} aria-hidden="true">✓</span>
            <span className={styles.message}>{summary}</span>
            <span className={styles.hint}>Click to dismiss</span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CollectionToast;
