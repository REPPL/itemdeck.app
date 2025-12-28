/**
 * Image Cache sub-tab for Data settings.
 *
 * Displays cache statistics and provides cache management controls.
 */

import { useState } from "react";
import { useCacheStats, useCacheManagement, formatBytes, DEFAULT_MAX_CACHE_SIZE } from "@/hooks/useImageCache";
import styles from "../SettingsPanel.module.css";

/**
 * Image Cache tab component.
 */
export function ImageCacheTab() {
  const { data: stats, isLoading, refetch } = useCacheStats(DEFAULT_MAX_CACHE_SIZE);
  const { clearCache, isClearing } = useCacheManagement();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearCache = () => {
    if (showConfirm) {
      clearCache();
      setShowConfirm(false);
      // Refetch stats after clearing
      setTimeout(() => {
        void refetch();
      }, 100);
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancelClear = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <h3 className={styles.sectionHeader}>Cache Statistics</h3>

      {isLoading ? (
        <div className={styles.row}>
          <span className={styles.label}>Loading...</span>
        </div>
      ) : (
        <>
          <div className={styles.row}>
            <span className={styles.label}>Cached Images</span>
            <span className={styles.value}>{stats?.imageCount ?? 0}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Storage Used</span>
            <span className={styles.value}>
              {formatBytes(stats?.totalSize ?? 0)} / {formatBytes(DEFAULT_MAX_CACHE_SIZE)}
            </span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Usage</span>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${String(stats?.usagePercent ?? 0)}%` }}
                />
              </div>
              <span className={styles.progressLabel}>
                {String(Math.round(stats?.usagePercent ?? 0))}%
              </span>
            </div>
          </div>
        </>
      )}

      <div className={styles.helpText}>
        Images are cached locally for faster loading and offline access.
      </div>

      <div className={styles.divider} />

      {/* Clear Cache */}
      <div className={styles.row}>
        <span className={styles.label}>
          {showConfirm ? "Are you sure?" : "Clear image cache"}
        </span>
        <div className={styles.buttonGroup}>
          {showConfirm ? (
            <>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleClearCache}
                disabled={isClearing}
              >
                {isClearing ? "Clearing..." : "Confirm"}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelClear}
                disabled={isClearing}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleClearCache}
              disabled={isClearing || (stats?.imageCount ?? 0) === 0}
            >
              Clear Cache
            </button>
          )}
        </div>
      </div>

      <div className={styles.helpText}>
        Clearing the cache will remove all cached images. They will be
        re-downloaded when needed.
      </div>
    </>
  );
}
