/**
 * Collection browser component for discovering and selecting collections.
 *
 * Displays available collections from a source with health status
 * and allows switching between them.
 */

import { useSourceHealth } from "@/hooks/useSourceHealth";
import { SourceHealthIndicator } from "@/components/SourceHealth";
import type { CollectionInfo } from "@/hooks/useCollectionManifest";
import styles from "./CollectionBrowser.module.css";

/**
 * Props for CollectionCard component.
 */
interface CollectionCardProps {
  /** Collection metadata */
  collection: CollectionInfo;
  /** Whether this collection is currently selected */
  isActive?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Individual collection card with thumbnail and metadata.
 */
export function CollectionCard({
  collection,
  isActive = false,
  onClick,
}: CollectionCardProps) {
  const { data: health, isLoading } = useSourceHealth(collection.url, {
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <button
      type="button"
      className={[
        styles.card,
        isActive ? styles.cardActive : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      aria-pressed={isActive}
    >
      {/* Thumbnail */}
      {collection.thumbnail && (
        <div className={styles.cardThumbnail}>
          <img
            src={collection.thumbnail}
            alt=""
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{collection.title}</h3>
          {!isLoading && health && (
            <SourceHealthIndicator status={health.status} size="small" />
          )}
        </div>

        {collection.description && (
          <p className={styles.cardDescription}>{collection.description}</p>
        )}

        <p className={styles.cardMeta}>
          {collection.itemCount} items
          {health?.latency != null && ` • ${String(health.latency)}ms`}
        </p>
      </div>

      {/* Active indicator */}
      {isActive && (
        <span className={styles.cardActiveIndicator} aria-hidden="true">
          Active
        </span>
      )}
    </button>
  );
}

/**
 * Props for CollectionBrowser component.
 */
interface CollectionBrowserProps {
  /** Available collections */
  collections: CollectionInfo[];
  /** Currently active collection URL */
  activeUrl?: string;
  /** Collection selection handler */
  onSelect: (collection: CollectionInfo) => void;
  /** Whether browser is loading */
  isLoading?: boolean;
}

/**
 * Grid of collection cards for browsing and selection.
 */
export function CollectionBrowser({
  collections,
  activeUrl,
  onSelect,
  isLoading = false,
}: CollectionBrowserProps) {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3].map((i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No collections found</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          isActive={collection.url === activeUrl}
          onClick={() => { onSelect(collection); }}
        />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for collection cards.
 */
export function CollectionCardSkeleton() {
  return (
    <div className={[styles.card, styles.cardSkeleton].join(" ")}>
      <div className={styles.cardThumbnail}>
        <div className={styles.skeleton} style={{ aspectRatio: "16/10" }} />
      </div>
      <div className={styles.cardContent}>
        <div className={styles.skeleton} style={{ width: "60%", height: "1.25rem" }} />
        <div className={styles.skeleton} style={{ width: "100%", height: "0.875rem" }} />
        <div className={styles.skeleton} style={{ width: "40%", height: "0.75rem" }} />
      </div>
    </div>
  );
}

/**
 * Compact collection switcher for sidebar/header.
 */
interface CollectionSwitcherProps {
  /** Available collections */
  collections: CollectionInfo[];
  /** Currently active collection */
  activeCollection?: CollectionInfo;
  /** Selection handler */
  onSelect: (collection: CollectionInfo) => void;
}

export function CollectionSwitcher({
  collections,
  activeCollection,
  onSelect,
}: CollectionSwitcherProps) {
  if (collections.length <= 1) {
    return null;
  }

  return (
    <select
      className={styles.switcher}
      value={activeCollection?.url ?? ""}
      onChange={(e) => {
        const collection = collections.find((c) => c.url === e.target.value);
        if (collection) {
          onSelect(collection);
        }
      }}
      aria-label="Select collection"
    >
      {collections.map((collection) => (
        <option key={collection.id} value={collection.url}>
          {collection.title} ({collection.itemCount})
        </option>
      ))}
    </select>
  );
}
