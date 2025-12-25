/**
 * Storage settings tab content with sub-tabs.
 *
 * Provides UI for managing cached images and storage usage.
 * Sub-tabs: Images | Cache | About
 */

import { useState } from "react";
import { useCacheStats, useCacheManagement, formatBytes } from "@/hooks/useImageCache";
import { DEFAULT_MAX_CACHE_SIZE } from "@/services/imageCache";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type StorageSubTab = "images" | "cache" | "about";

const subTabs: { id: StorageSubTab; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "cache", label: "Cache" },
  { id: "about", label: "About" },
];

/**
 * Storage settings tab component with sub-navigation.
 */
export function StorageSettingsTabs() {
  const { data: stats, isLoading, refetch } = useCacheStats(DEFAULT_MAX_CACHE_SIZE);
  const { clearCache, isClearing } = useCacheManagement();
  const [activeSubTab, setActiveSubTab] = useState<StorageSubTab>("images");
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

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "images":
        return (
          <>
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
          </>
        );

      case "cache":
        return (
          <>
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

            <div className={styles.row}>
              <span className={styles.label}>Cache Limit</span>
              <span className={styles.value}>{formatBytes(DEFAULT_MAX_CACHE_SIZE)}</span>
            </div>

            <div className={styles.helpText}>
              When the cache limit is reached, the oldest images are automatically
              removed to make space for new ones (LRU eviction).
            </div>
          </>
        );

      case "about":
        return (
          <>
            <div className={styles.helpText}>
              Images are automatically cached in your browser using IndexedDB
              storage for faster loading and offline access.
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Storage Type</span>
              <span className={styles.value}>IndexedDB</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Eviction Policy</span>
              <span className={styles.value}>LRU (Least Recently Used)</span>
            </div>

            <div className={styles.helpText}>
              The cache persists across browser sessions. Clearing browser data
              or using private/incognito mode will clear the cache.
            </div>
          </>
        );
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Sub-tab navigation */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Storage settings sections">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`storage-subtab-${id}`}
            className={[
              tabStyles.subTab,
              activeSubTab === id ? tabStyles.subTabActive : "",
            ].filter(Boolean).join(" ")}
            onClick={() => { setActiveSubTab(id); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div
        className={tabStyles.subTabContent}
        role="tabpanel"
        id={`storage-subtab-${activeSubTab}`}
        aria-labelledby={`storage-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
