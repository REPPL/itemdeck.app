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
import { TrashIcon, CheckIcon, WarningIcon } from "@/components/Icons";
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
 * Sources tab component - displays configured data sources.
 */
export function SourcesTab() {
  const sources = useSources();

  return (
    <>
      <div className={styles.sourceList}>
        {sources.map((source) => (
          <SourceItem key={source.id} sourceId={source.id} />
        ))}
      </div>
    </>
  );
}
