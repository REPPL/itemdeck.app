/**
 * Collection header component.
 *
 * Displays the collection name and description above the card grid.
 * Shows information from the collection's schema or source configuration.
 *
 * @see F-086: View Button with Popover
 */

import { useMemo } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useSourceStore } from "@/stores/sourceStore";
import styles from "./CollectionHeader.module.css";

/**
 * Header showing collection name and description.
 */
export function CollectionHeader() {
  const { collection, isLoading, error } = useCollectionData();

  // Get active source info as fallback
  const activeSourceId = useSourceStore((s) => s.activeSourceId);
  const sources = useSourceStore((s) => s.sources);

  const sourceInfo = useMemo(() => {
    const source = sources.find((s) => s.id === activeSourceId);
    return {
      name: source?.name ?? source?.mpmFolder ?? null,
      username: source?.mpmUsername ?? null,
    };
  }, [sources, activeSourceId]);

  // Determine name and description to display
  // Priority: collection meta > source config
  const displayName = collection?.meta?.name ?? sourceInfo.name;
  const displayDescription = collection?.meta?.description ?? null;

  // Don't render if loading, error, or no name
  if (isLoading || error || !displayName) {
    return null;
  }

  return (
    <header className={styles.header} role="banner" aria-label="Collection information">
      <h1 className={styles.name}>{displayName}</h1>
      {displayDescription && (
        <p className={styles.description}>{displayDescription}</p>
      )}
    </header>
  );
}

export default CollectionHeader;
