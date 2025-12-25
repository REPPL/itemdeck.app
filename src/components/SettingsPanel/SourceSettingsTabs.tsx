/**
 * Source settings tabs for managing data sources.
 *
 * Allows users to add, remove, and manage remote data sources.
 */

import { useState, useCallback } from "react";
import { useSourceStore, useSources } from "@/stores/sourceStore";
import { useSourceHealth } from "@/hooks/useSourceHealth";
import { SourceHealthIndicator } from "@/components/SourceHealth";
import { PlusIcon, TrashIcon, CheckIcon, ExternalLinkIcon } from "@/components/Icons";
import styles from "./SettingsPanel.module.css";

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
 * Source settings tabs component.
 */
export function SourceSettingsTabs() {
  const sources = useSources();

  return (
    <div className={styles.tabContent}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Configured Sources</h3>
        <p className={styles.sectionDescription}>
          Manage your data sources. The active source provides the current collection.
        </p>

        <div className={styles.sourceList}>
          {sources.map((source) => (
            <SourceItem key={source.id} sourceId={source.id} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Add New Source</h3>
        <p className={styles.sectionDescription}>
          Add a remote collection URL. The URL should point to a directory containing collection.json.
        </p>

        <AddSourceForm />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>About Sources</h3>
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
      </section>
    </div>
  );
}
