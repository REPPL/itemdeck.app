/**
 * Storage settings tab content with sub-tabs.
 *
 * Provides UI for managing cached images and storage usage.
 * Sub-tabs: Images | Cache | About
 */

import { useState, useRef, useMemo } from "react";
import { useCacheStats, useCacheManagement, useImagePreloader, formatBytes } from "@/hooks/useImageCache";
import { DEFAULT_MAX_CACHE_SIZE } from "@/services/imageCache";
import { useCollectionData } from "@/context/CollectionDataContext";
import { importCollection, exportCollectionWithFormat, type ExportFormat } from "@/lib/collectionExport";
import { useEditsStore } from "@/stores/editsStore";
import { exportEditsToFile, importEditsFromFile } from "@/utils/editExport";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type StorageSubTab = "images" | "cache" | "edits" | "about";

const subTabs: { id: StorageSubTab; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "cache", label: "Cache" },
  { id: "edits", label: "Edits" },
  { id: "about", label: "About" },
];

/**
 * Storage settings tab component with sub-navigation.
 */
export function StorageSettingsTabs() {
  const { data: stats, isLoading, refetch } = useCacheStats(DEFAULT_MAX_CACHE_SIZE);
  const { clearCache, isClearing } = useCacheManagement();
  const { preload, isPreloading, progressPercent } = useImagePreloader();
  const { cards, collection } = useCollectionData();
  const [activeSubTab, setActiveSubTab] = useState<StorageSubTab>("images");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditsRevertConfirm, setShowEditsRevertConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editsFileInputRef = useRef<HTMLInputElement>(null);

  // Edits store
  const edits = useEditsStore((s) => s.edits);
  const revertAll = useEditsStore((s) => s.revertAll);
  const importEdits = useEditsStore((s) => s.importEdits);
  const editCount = Object.keys(edits).length;

  // Get all image URLs for re-caching
  const imageUrls = useMemo(() => {
    return cards.flatMap((card) => card.imageUrls).filter(Boolean);
  }, [cards]);

  const handleExport = () => {
    if (collection) {
      exportCollectionWithFormat(collection, { format: exportFormat });
    }
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExportFormat(e.target.value as ExportFormat);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        const imported = await importCollection(file);

        // Store to localStorage for persistence
        const IMPORT_KEY = "itemdeck-imported-collection";
        localStorage.setItem(IMPORT_KEY, JSON.stringify(imported));

        // Notify user and reload to apply changes
        if (window.confirm("Collection imported successfully! The page will reload to apply changes.")) {
          window.location.reload();
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to import collection");
      }

      // Reset input
      e.target.value = "";
    })();
  };

  const handleRecache = () => {
    if (imageUrls.length > 0) {
      void preload(imageUrls);
    }
  };

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

  // Edits handlers
  const handleExportEdits = () => {
    exportEditsToFile(edits, "itemdeck");
  };

  const handleEditsImportClick = () => {
    editsFileInputRef.current?.click();
  };

  const handleEditsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        const imported = await importEditsFromFile(file);
        const editCountStr = String(imported.editCount);
        const action = window.confirm(
          `Import ${editCountStr} edits?\n\nClick OK to merge with existing edits.\nClick Cancel to replace all edits.`
        );
        importEdits(imported, action ? "merge" : "replace");
        alert(`Successfully imported ${editCountStr} edits.`);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to import edits");
      }

      // Reset input
      e.target.value = "";
    })();
  };

  const handleRevertAllEdits = () => {
    if (showEditsRevertConfirm) {
      revertAll();
      setShowEditsRevertConfirm(false);
    } else {
      setShowEditsRevertConfirm(true);
    }
  };

  const handleCancelRevert = () => {
    setShowEditsRevertConfirm(false);
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

            <div className={styles.divider} />

            {/* Export */}
            <div className={styles.row}>
              <span className={styles.label}>Export Collection</span>
              <div className={styles.buttonGroup}>
                <select
                  className={styles.formatSelect}
                  value={exportFormat}
                  onChange={handleFormatChange}
                  aria-label="Export format"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="markdown">Markdown</option>
                </select>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleExport}
                  disabled={!collection || cards.length === 0}
                >
                  Export
                </button>
              </div>
            </div>

            {/* Import */}
            <div className={styles.row}>
              <span className={styles.label}>Import Collection</span>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleImportClick}
              >
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            <div className={styles.helpText}>
              Export saves the current collection. Import loads a previously exported collection.
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

            <div className={styles.divider} />

            {/* Re-cache Images */}
            <div className={styles.row}>
              <span className={styles.label}>
                {isPreloading ? `Caching... ${String(Math.round(progressPercent))}%` : "Re-cache Images"}
              </span>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleRecache}
                disabled={isPreloading || imageUrls.length === 0}
              >
                {isPreloading ? "Caching..." : "Re-cache"}
              </button>
            </div>

            <div className={styles.helpText}>
              Re-downloads and caches all images. Useful if images appear broken.
            </div>
          </>
        );

      case "edits":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Modified Cards</span>
              <span className={styles.value}>{editCount}</span>
            </div>

            <div className={styles.helpText}>
              Local edits are stored in your browser. Export to backup.
            </div>

            <div className={styles.divider} />

            {/* Export Edits */}
            <div className={styles.row}>
              <span className={styles.label}>Export Edits</span>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleExportEdits}
                disabled={editCount === 0}
              >
                Export JSON
              </button>
            </div>

            {/* Import Edits */}
            <div className={styles.row}>
              <span className={styles.label}>Import Edits</span>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleEditsImportClick}
              >
                Import JSON
              </button>
              <input
                ref={editsFileInputRef}
                type="file"
                accept=".json"
                onChange={handleEditsFileChange}
                style={{ display: "none" }}
              />
            </div>

            <div className={styles.divider} />

            {/* Revert All */}
            <div className={styles.row}>
              <span className={styles.label}>
                {showEditsRevertConfirm ? "Are you sure?" : "Revert All Edits"}
              </span>
              <div className={styles.buttonGroup}>
                {showEditsRevertConfirm ? (
                  <>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={handleRevertAllEdits}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCancelRevert}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={handleRevertAllEdits}
                    disabled={editCount === 0}
                  >
                    Revert All
                  </button>
                )}
              </div>
            </div>

            <div className={styles.helpText}>
              This will discard all local changes and restore original data.
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
