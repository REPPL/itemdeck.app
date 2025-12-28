/**
 * SourcesOverlay component.
 *
 * Consolidated overlay for displaying all item detail URLs/sources.
 * Replaces multiple individual source buttons with a single "Sources" button.
 *
 * @see F-084: Consolidated Sources Overlay
 */

import { motion } from "framer-motion";
import { SourceIcon, isKnownSource, getSourceShortName } from "@/components/SourceIcon";
import { ExternalLinkIcon, CloseIcon } from "@/components/Icons";
import type { DetailLink } from "@/types/links";
import styles from "./SourcesOverlay.module.css";

// ============================================================================
// Types
// ============================================================================

interface SourcesOverlayProps {
  /** List of detail URLs to display */
  detailUrls: DetailLink[];
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Callback to close the overlay */
  onClose: () => void;
  /** Whether overlay animations are enabled */
  animationEnabled?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Group sources by type for organised display.
 */
function categoriseSources(links: DetailLink[]): {
  official: DetailLink[];
  databases: DetailLink[];
  reviews: DetailLink[];
  other: DetailLink[];
} {
  const categories = {
    official: [] as DetailLink[],
    databases: [] as DetailLink[],
    reviews: [] as DetailLink[],
    other: [] as DetailLink[],
  };

  links.forEach((link) => {
    const url = link.url.toLowerCase();
    const source = (link.source ?? "").toLowerCase();

    // Official sources
    if (source.includes("official") || url.includes("official")) {
      categories.official.push(link);
    }
    // Database sources
    else if (
      url.includes("mobygames") ||
      url.includes("wikipedia") ||
      url.includes("wikidata") ||
      url.includes("imdb") ||
      url.includes("igdb") ||
      url.includes("rawg") ||
      url.includes("giantbomb")
    ) {
      categories.databases.push(link);
    }
    // Review sources
    else if (
      url.includes("ign") ||
      url.includes("gamespot") ||
      url.includes("metacritic") ||
      url.includes("kotaku") ||
      url.includes("polygon") ||
      url.includes("eurogamer")
    ) {
      categories.reviews.push(link);
    }
    // Everything else
    else {
      categories.other.push(link);
    }
  });

  return categories;
}

/**
 * Get display name for a category.
 */
function getCategoryLabel(category: string): string {
  switch (category) {
    case "official":
      return "Official";
    case "databases":
      return "Databases";
    case "reviews":
      return "Reviews";
    case "other":
      return "Other Sources";
    default:
      return category;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * SourcesOverlay component.
 *
 * Displays all detail URLs in a categorised overlay.
 */
export function SourcesOverlay({
  detailUrls,
  isOpen,
  onClose,
  animationEnabled = true,
}: SourcesOverlayProps) {
  if (!isOpen) return null;

  const categories = categoriseSources(detailUrls);
  const hasCategories =
    categories.official.length > 0 ||
    categories.databases.length > 0 ||
    categories.reviews.length > 0 ||
    categories.other.length > 0;

  // If all sources fit in one category, show flat list
  const categoriesWithItems = Object.entries(categories).filter(
    ([_, items]) => items.length > 0
  );
  const showCategorised = categoriesWithItems.length > 1;

  const renderLink = (link: DetailLink, index: number) => {
    const hasKnownIcon = isKnownSource(link.url);
    const sourceInfo = getSourceShortName(link.url);
    const displayName =
      sourceInfo?.title ?? link.source ?? link.label ?? "Source";

    return (
      <a
        key={index}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.sourceLink}
      >
        <span className={styles.sourceLinkIcon}>
          {hasKnownIcon ? (
            <SourceIcon url={link.url} source={link.source} />
          ) : (
            <ExternalLinkIcon size={18} />
          )}
        </span>
        <span className={styles.sourceLinkName}>{displayName}</span>
        <span className={styles.sourceLinkExternal}>
          <ExternalLinkIcon size={14} />
        </span>
      </a>
    );
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={animationEnabled ? { opacity: 0, y: 20 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={animationEnabled ? { opacity: 0, y: 20 } : { opacity: 0 }}
      transition={{ duration: animationEnabled ? 0.2 : 0 }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Sources</h3>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close sources"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <div className={styles.content}>
        {!hasCategories ? (
          <p className={styles.emptyMessage}>No sources available</p>
        ) : showCategorised ? (
          // Categorised display
          Object.entries(categories).map(([category, items]) =>
            items.length > 0 ? (
              <div key={category} className={styles.category}>
                <h4 className={styles.categoryTitle}>
                  {getCategoryLabel(category)}
                </h4>
                <div className={styles.categoryLinks}>
                  {items.map(renderLink)}
                </div>
              </div>
            ) : null
          )
        ) : (
          // Flat list display
          <div className={styles.flatLinks}>
            {detailUrls.map(renderLink)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SourcesOverlay;
