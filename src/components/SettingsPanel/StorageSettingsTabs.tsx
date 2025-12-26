/**
 * Storage settings tab content with sub-tabs.
 *
 * Provides UI for managing data sources, cached images, imports/exports, and storage info.
 * Sub-tabs: Sources | Image Cache | Import/Export | About
 */

import { useState, useRef, useMemo, useCallback } from "react";
import { useCacheStats, useCacheManagement, useImagePreloader, formatBytes } from "@/hooks/useImageCache";
import { DEFAULT_MAX_CACHE_SIZE } from "@/services/imageCache";
import { useCollectionData } from "@/context/CollectionDataContext";
import { importCollection, exportCollectionWithFormat, type ExportFormat } from "@/lib/collectionExport";
import { useEditsStore } from "@/stores/editsStore";
import { useSourceStore, useSources } from "@/stores/sourceStore";
import { useSourceHealth } from "@/hooks/useSourceHealth";
import { SourceHealthIndicator } from "@/components/SourceHealth";
import { PlusIcon, TrashIcon, CheckIcon, ExternalLinkIcon } from "@/components/Icons";
import { exportEditsToFile, importEditsFromFile } from "@/utils/editExport";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type StorageSubTab = "sources" | "cache" | "import-export" | "about";

const subTabs: { id: StorageSubTab; label: string }[] = [
  { id: "sources", label: "Sources" },
  { id: "cache", label: "Image Cache" },
  { id: "import-export", label: "Import/Export" },
  { id: "about", label: "About" },
];

/**
 * Source list item component.
 */
function SourceItem({ sourceId }: { sourceId: string }) {
  const source = useSourceStore((state) => state.sources.find((s) => s.id === sourceId));
  const activeSourceId = useSourceStore((state) => state.activeSourceId);
  const defaultSourceId = useSourceStore((state) => state.defaultSourceId);
  const setActiveSource = useSourceStore((state) => state.setActiveSource);
  const setDefaultSource = useSourceStore((state) => state.setDefaultSource);
  const removeSource = useSourceStore((state) => state.removeSource);

  const { data: health, isLoading: isCheckingHealth } = useSourceHealth(
    source?.url ?? "",
    { enabled: Boolean(source?.url) }
  );

  if (!source) return null;

  const isActive = activeSourceId === source.id;
  const isDefault = defaultSourceId === source.id;

  return (
    <div
      className={[
        styles.sourceItem,
        isActive ? styles.sourceItemActive : "",
      ].filter(Boolean).join(" ")}
    >
      <div className={styles.sourceItemHeader}>
        <div className={styles.sourceItemStatus}>
          {isCheckingHealth ? (
            <span className={styles.sourceItemLoading} />
          ) : health ? (
            <SourceHealthIndicator status={health.status} size="small" />
          ) : null}
        </div>
        <div className={styles.sourceItemInfo}>
          <span className={styles.sourceItemName}>
            {source.name ?? source.url}
          </span>
          {source.name && (
            <span className={styles.sourceItemUrl}>{source.url}</span>
          )}
        </div>
        <div className={styles.sourceItemActions}>
          {health?.latency && (
            <span className={styles.sourceItemLatency}>{health.latency}ms</span>
          )}
        </div>
      </div>

      <div className={styles.sourceItemButtons}>
        <button
          type="button"
          className={[
            styles.sourceItemButton,
            isActive ? styles.sourceItemButtonActive : "",
          ].filter(Boolean).join(" ")}
          onClick={() => { setActiveSource(source.id); }}
          disabled={isActive}
          title={isActive ? "Currently active" : "Set as active source"}
        >
          {isActive ? (
            <>
              <CheckIcon />
              <span>Active</span>
            </>
          ) : (
            <span>Use</span>
          )}
        </button>

        <button
          type="button"
          className={[
            styles.sourceItemButton,
            isDefault ? styles.sourceItemButtonDefault : "",
          ].filter(Boolean).join(" ")}
          onClick={() => { setDefaultSource(source.id); }}
          disabled={isDefault}
          title={isDefault ? "Default source" : "Set as default on load"}
        >
          {isDefault ? "Default" : "Set Default"}
        </button>

        {!source.isBuiltIn && (
          <button
            type="button"
            className={[styles.sourceItemButton, styles.sourceItemButtonDanger].join(" ")}
            onClick={() => {
              if (window.confirm(`Remove source "${source.name ?? source.url}"?`)) {
                removeSource(source.id);
              }
            }}
            title="Remove source"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Add source form component.
 */
function AddSourceForm() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const addSource = useSourceStore((state) => state.addSource);
  const sources = useSources();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("URL is required");
      return;
    }

    // Basic URL validation
    try {
      new URL(trimmedUrl);
    } catch {
      setError("Invalid URL format");
      return;
    }

    // Check for duplicates
    const normalizedUrl = trimmedUrl.replace(/\/$/, "");
    if (sources.some((s) => s.url === normalizedUrl)) {
      setError("Source already exists");
      return;
    }

    setIsValidating(true);

    try {
      // Try to fetch the collection to validate
      const testUrl = `${normalizedUrl}/collection.json`;
      const response = await fetch(testUrl, {
        method: "HEAD",
        cache: "no-store",
      });

      if (!response.ok) {
        setError(`Source not accessible (HTTP ${String(response.status)})`);
        setIsValidating(false);
        return;
      }

      // Add the source
      addSource(normalizedUrl, name.trim() || undefined);
      setUrl("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate source");
    } finally {
      setIsValidating(false);
    }
  }, [url, name, sources, addSource]);

  return (
    <form className={styles.addSourceForm} onSubmit={(e) => { void handleSubmit(e); }}>
      <div className={styles.formGroup}>
        <label htmlFor="source-url" className={styles.label}>
          Source URL
        </label>
        <input
          id="source-url"
          type="url"
          className={styles.input}
          placeholder="https://example.com/data"
          value={url}
          onChange={(e) => { setUrl(e.target.value); }}
          disabled={isValidating}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="source-name" className={styles.label}>
          Name (optional)
        </label>
        <input
          id="source-name"
          type="text"
          className={styles.input}
          placeholder="My Collection"
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          disabled={isValidating}
        />
      </div>

      {error && (
        <p className={styles.formError}>{error}</p>
      )}

      <button
        type="submit"
        className={styles.primaryButton}
        disabled={isValidating || !url.trim()}
      >
        {isValidating ? (
          "Validating..."
        ) : (
          <>
            <PlusIcon />
            <span>Add Source</span>
          </>
        )}
      </button>
    </form>
  );
}

/**
 * Storage settings tab component with sub-navigation.
 */
export function StorageSettingsTabs() {
  const { data: stats, isLoading, refetch } = useCacheStats(DEFAULT_MAX_CACHE_SIZE);
  const { clearCache, isClearing } = useCacheManagement();
  const { preload, isPreloading, progressPercent } = useImagePreloader();
  const { cards, collection } = useCollectionData();
  const [activeSubTab, setActiveSubTab] = useState<StorageSubTab>("sources");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditsRevertConfirm, setShowEditsRevertConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editsFileInputRef = useRef<HTMLInputElement>(null);

  // Sources
  const sources = useSources();

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
      case "sources":
        return (
          <>
            <h3 className={styles.sectionHeader}>Configured Sources</h3>
            <p className={styles.sectionDescription}>
              Manage your data sources. The active source provides the current collection.
            </p>

            <div className={styles.sourceList}>
              {sources.map((source) => (
                <SourceItem key={source.id} sourceId={source.id} />
              ))}
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Add New Source</h3>
            <p className={styles.sectionDescription}>
              Add a remote collection URL. The URL should point to a directory containing collection.json.
            </p>

            <AddSourceForm />
          </>
        );

      case "cache":
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

      case "import-export":
        return (
          <>
            <h3 className={styles.sectionHeader}>Collection</h3>

            {/* Export Collection */}
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

            {/* Import Collection */}
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

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Local Edits</h3>

            <div className={styles.row}>
              <span className={styles.label}>Modified Cards</span>
              <span className={styles.value}>{editCount}</span>
            </div>

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
            <h3 className={styles.sectionHeader}>Image Cache</h3>
            <div className={styles.helpText}>
              Images are automatically cached in your browser using IndexedDB
              storage for faster loading and offline access.
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Storage Type</span>
              <span className={styles.value}>IndexedDB</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Cache Limit</span>
              <span className={styles.value}>{formatBytes(DEFAULT_MAX_CACHE_SIZE)}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Eviction Policy</span>
              <span className={styles.value}>LRU (Least Recently Used)</span>
            </div>

            <div className={styles.helpText}>
              The cache persists across browser sessions. Clearing browser data
              or using private/incognito mode will clear the cache.
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Data Sources</h3>
            <div className={styles.infoBox}>
              <p>
                <strong>Local Collection</strong> is the built-in source that reads from the app&apos;s data directory.
              </p>
              <p>
                <strong>Remote sources</strong> can be any URL hosting a valid collection.json file.
                Health checks run automatically to monitor source availability.
              </p>
              <a
                href="https://github.com/your-repo/itemdeck#sources"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.infoLink}
              >
                Learn more about sources
                <ExternalLinkIcon />
              </a>
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
