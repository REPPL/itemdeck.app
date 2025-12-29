/**
 * Sources sub-tab for Collections settings.
 *
 * Displays configured data sources with health status
 * and allows setting active/default sources.
 */

import { useState, useCallback } from "react";
import { useSourceStore, useSources } from "@/stores/sourceStore";
import { useSourceHealth } from "@/hooks/useSourceHealth";
import { SourceHealthIndicator } from "@/components/SourceHealth";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TrashIcon, CheckIcon, WarningIcon, PlusIcon } from "@/components/Icons";
import { getAvailableExamples, buildExampleCollectionUrl } from "@/config/devSources";
import type { ExampleCollection } from "@/config/devSources";
import styles from "../SettingsPanel.module.css";

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

  // Confirmation dialog state
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const handleRemoveClick = useCallback(() => {
    setConfirmRemoveOpen(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    removeSource(sourceId);
    setConfirmRemoveOpen(false);
  }, [removeSource, sourceId]);

  const handleCancelRemove = useCallback(() => {
    setConfirmRemoveOpen(false);
  }, []);

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
            {source.sourceType === "legacy" && (
              <span className={styles.legacyBadge} title="Legacy source format">
                <WarningIcon size={12} />
                Legacy
              </span>
            )}
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
            onClick={handleRemoveClick}
            title="Remove source"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Confirm remove dialog */}
      <ConfirmDialog
        isOpen={confirmRemoveOpen}
        title="Remove Source"
        message={`Are you sure you want to remove "${source.name ?? source.url}"? This action cannot be undone.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </div>
  );
}

/**
 * Example collection item component.
 */
function ExampleCollectionItem({ example }: { example: ExampleCollection }) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSource = useSourceStore((state) => state.addSource);
  const sources = useSources();

  const url = buildExampleCollectionUrl(example.folder);
  const isAlreadyAdded = sources.some((s) => s.url === url);

  const handleAdd = useCallback(async () => {
    if (isAlreadyAdded || isAdding) return;

    setIsAdding(true);
    setError(null);

    try {
      // Validate the source exists
      const testUrl = `${url}/collection.json`;
      const response = await fetch(testUrl, {
        method: "HEAD",
        cache: "no-store",
      });

      if (!response.ok) {
        setError(`Not accessible (HTTP ${String(response.status)})`);
        setIsAdding(false);
        return;
      }

      // Add the source
      addSource(url, example.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setIsAdding(false);
    }
  }, [url, example.name, isAlreadyAdded, isAdding, addSource]);

  return (
    <div className={styles.exampleItem}>
      <div className={styles.exampleInfo}>
        <span className={styles.exampleName}>{example.name}</span>
        <span className={styles.exampleDescription}>{example.description}</span>
        {example.itemCount && (
          <span className={styles.exampleCount}>{example.itemCount} items</span>
        )}
      </div>
      <div className={styles.exampleActions}>
        {error && <span className={styles.exampleError}>{error}</span>}
        {isAlreadyAdded ? (
          <span className={styles.exampleAdded}>
            <CheckIcon />
            Added
          </span>
        ) : (
          <button
            type="button"
            className={styles.exampleAddButton}
            onClick={() => { void handleAdd(); }}
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : (
              <>
                <PlusIcon />
                Add
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Sources tab component - displays configured data sources.
 */
export function SourcesTab() {
  const sources = useSources();
  const examples = getAvailableExamples();

  return (
    <>
      {/* User-configured sources */}
      <div className={styles.sourceList}>
        {sources.map((source) => (
          <SourceItem key={source.id} sourceId={source.id} />
        ))}
      </div>

      {/* Example collections section */}
      {examples.length > 0 && (
        <div className={styles.exampleSection}>
          <h4 className={styles.exampleSectionTitle}>Example Collections</h4>
          <p className={styles.exampleSectionDescription}>
            Try these pre-configured collections.
          </p>
          <div className={styles.exampleList}>
            {examples.map((example) => (
              <ExampleCollectionItem key={example.id} example={example} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
