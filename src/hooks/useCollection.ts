/**
 * Collection data fetching hook.
 *
 * Provides TanStack Query wrapper for fetching collection data
 * from local sources. Uses v2 schema format exclusively.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { collectionKeys } from "./queryKeys";
import { type Collection, type CardWithCategory } from "@/schemas";
import {
  loadCollection,
  createResolverContext,
  resolveAllRelationships,
  getEntityRank,
  getImageUrls,
  getPrimaryImage,
  getLogoUrl,
} from "@/loaders";
import { cacheCollection } from "@/lib/cardCache";
import type { Image } from "@/types/image";
import type { ResolvedEntity, CollectionConfig } from "@/types/schema";
import type { DisplayConfig } from "@/types/display";
import type { RatingValue } from "@/types/rating";
import type { DetailLink } from "@/types/links";
import type { UILabels } from "@/context/CollectionUIContext";
import { normaliseRating } from "@/types/rating";
import { normaliseDetailUrls } from "@/types/links";

/**
 * Local data source configuration.
 */
interface LocalSourceConfig {
  /** Base path for data files */
  basePath: string;
}

/**
 * Card ready for display with guaranteed imageUrl and imageUrls.
 *
 * Extends CardWithCategory but ensures imageUrl and imageUrls are always present
 * (placeholder is used for cards without images).
 *
 * v2 additions:
 * - rating: Structured rating with source metadata
 * - detailUrls: Multiple detail links with sources
 * - primaryImage: Full primary image object for attribution display
 *
 * Terminology (v2):
 * - Uses generic terms (category, order) instead of game-specific (platform, rank)
 * - Legacy aliases maintained for backward compatibility
 */
export interface DisplayCard extends Omit<CardWithCategory, "imageUrl" | "imageUrls"> {
  /** Primary image URL (always present - placeholder used if not in source) */
  imageUrl: string;

  /** Array of image URLs for gallery (always present - at least primary image) */
  imageUrls: string[];

  /** Flattened category title for display */
  categoryTitle?: string;

  /** Short category name for badges (was: device) */
  categoryShort?: string;

  /** Order within category (was: rank) - null if not ordered */
  order: number | null;

  /** Image attribution/source information (e.g., Wikimedia Commons) */
  imageAttribution?: string;

  /** Logo URL for card back (from category) */
  logoUrl?: string;

  /** Resolved entity data for dynamic field path resolution */
  _resolved?: Record<string, unknown>;

  // Legacy aliases for backward compatibility

  /** @deprecated Use categoryShort instead */
  device?: string;

  /** @deprecated Use categoryTitle instead */
  platformTitle?: string;

  /** @deprecated Use order instead */
  rank?: number | null;

  // v2 additions

  /** Structured rating with source metadata (v2) */
  rating?: RatingValue;

  /** Multiple detail URLs with source info (v2) */
  detailUrls?: DetailLink[];

  /** Full primary image object for attribution display (v2) */
  primaryImage?: Image;

  /** Full category/platform info for expanded display */
  categoryInfo?: {
    id: string;
    title: string;
    year?: string;
    summary?: string;
    detailUrls?: DetailLink[];
    /** Additional fields from the platform entity for dynamic display */
    additionalFields?: Record<string, unknown>;
  };

  /** Additional entity fields for field path resolution */
  [key: string]: unknown;
}

/**
 * Result of collection fetching.
 */
interface CollectionResult {
  /** Cards ready for display with imageUrl guaranteed */
  cards: DisplayCard[];

  /** Raw collection data (legacy format for backward compatibility) */
  collection: Collection;

  /** Display configuration from collection definition */
  displayConfig?: DisplayConfig;

  /** Custom UI labels from collection definition */
  uiLabels?: Partial<UILabels>;

  /** Collection configuration defaults */
  config?: CollectionConfig;
}

/**
 * Format attribution from structured Image object.
 */
function formatAttribution(images: Image[] | undefined): string | undefined {
  if (!images || images.length === 0) {
    return undefined;
  }

  const firstWithAttribution = images.find((img) => img.attribution);
  if (!firstWithAttribution?.attribution) {
    return undefined;
  }

  const attr = firstWithAttribution.attribution;
  const parts: string[] = [];

  if (attr.source) {
    parts.push(`Image from ${attr.source}`);
  }

  if (attr.author) {
    parts.push(`by ${attr.author}`);
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * Fetch and process v2 schema collection.
 *
 * @param basePath - Base path for the collection
 * @returns Collection result with display cards
 */
async function fetchCollection(basePath: string): Promise<CollectionResult> {
  const loaded = await loadCollection(basePath);
  const context = createResolverContext(loaded.definition, loaded.entities);

  // Resolve relationships for primary entities
  const resolvedEntities = resolveAllRelationships(
    loaded.primaryType,
    context
  );

  // Convert to DisplayCard format
  const placeholder = (id: string) =>
    `https://picsum.photos/seed/${id}/400/300`;

  const cards: DisplayCard[] = resolvedEntities.map((entity: ResolvedEntity) => {
    const images = entity.images;
    const imageUrls = getImageUrls(images);
    const primaryImage = getPrimaryImage(images);
    const primaryImageUrl = primaryImage?.url ?? placeholder(entity.id);

    // Get resolved platform
    const platform = entity._resolved?.platform as ResolvedEntity | undefined;

    // Get rank
    const rank = getEntityRank(entity, loaded.primaryType, context);

    // Get title - entity.title should be a string, but we handle edge cases
    const entityTitle = entity.title;
    const title = typeof entityTitle === "string"
      ? entityTitle
      : typeof entityTitle === "number" ? String(entityTitle) : "";

    // Get year - convert to string if present, handle various types safely
    const entityYear = entity.year;
    let year: string | undefined;
    if (entityYear === undefined) {
      year = undefined;
    } else if (typeof entityYear === "string") {
      year = entityYear;
    } else if (typeof entityYear === "number") {
      year = String(entityYear);
    } else {
      year = undefined;
    }

    // v2: Normalise rating if present
    const entityRating = entity.rating ?? entity.averageRating;
    const rating = entityRating !== undefined
      ? normaliseRating(entityRating as number | { score: number })
      : undefined;

    // v2: Normalise detailUrls if present
    const detailUrls = normaliseDetailUrls(
      entity.detailUrls as string | { url: string } | { url: string }[] | undefined
    );

    // v2: Use generic terminology
    const categoryShort = (platform?.shortTitle ?? platform?.title) as string | undefined;
    const order = rank;

    // Build DisplayCard with all entity fields for field path resolution
    const displayCard: DisplayCard = {
      // Core required fields
      id: entity.id,
      title,
      year,
      summary: entity.summary as string | undefined,
      detailUrl: entity.detailUrl as string | undefined,
      imageUrl: primaryImageUrl,
      imageUrls: imageUrls.length > 0 ? imageUrls : [placeholder(entity.id)],
      // v2 terminology
      categoryTitle: platform?.title as string | undefined,
      categoryShort,
      order,
      imageAttribution: formatAttribution(images),
      logoUrl: getLogoUrl(platform?.images),
      // Legacy aliases for backward compatibility
      device: categoryShort,
      platformTitle: platform?.title as string | undefined,
      rank: order,
      metadata: Object.fromEntries(
        Object.entries({
          category: entity.platform as string | undefined,
          order: order !== null ? String(order) : undefined,
          // Legacy alias
          rank: order !== null ? String(order) : undefined,
        }).filter((entry): entry is [string, string] => entry[1] !== undefined)
      ),
      // Include resolved relationships for field path resolution
      _resolved: entity._resolved,
      // v2 additions
      rating,
      detailUrls: detailUrls.length > 0 ? detailUrls : undefined,
      primaryImage,
      // Category/platform info for expanded view
      categoryInfo: platform ? (() => {
        // Extract additional fields (exclude internal/display fields)
        const skipFields = new Set([
          "id", "title", "shortTitle", "year", "summary", "images",
          "detailUrl", "detailUrls", "_resolved", "logoUrl",
        ]);
        const additionalFields: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(platform)) {
          if (!skipFields.has(key) && value !== undefined && value !== null) {
            additionalFields[key] = value;
          }
        }

        // Get explicit detailUrls or auto-generate Wikipedia link from title
        const platformTitle = platform.title as string;
        let platformDetailUrls = normaliseDetailUrls(
          platform.detailUrls as string | { url: string } | { url: string }[] | undefined
        );

        // Auto-generate Wikipedia URL if no detailUrls specified
        if (platformDetailUrls.length === 0 && platformTitle) {
          const wikipediaTitle = platformTitle.replace(/ /g, "_");
          platformDetailUrls = [{
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipediaTitle)}`,
            source: "Wikipedia",
          }];
        }

        return {
          id: platform.id,
          title: platformTitle,
          year: typeof platform.year === "number" ? String(platform.year) : platform.year as string | undefined,
          summary: platform.summary as string | undefined,
          detailUrls: platformDetailUrls.length > 0 ? platformDetailUrls : undefined,
          additionalFields: Object.keys(additionalFields).length > 0 ? additionalFields : undefined,
        };
      })() : undefined,
    };

    // Copy all additional entity fields for field path resolution
    // This includes personal fields like verdict, rating, playedSince, status
    for (const [key, value] of Object.entries(entity)) {
      if (!(key in displayCard) && key !== "_resolved") {
        displayCard[key] = value;
      }
    }

    return displayCard;
  });

  // Create minimal legacy Collection for backward compatibility
  const legacyCollection: Collection = {
    items: cards.map((c) => ({
      id: c.id,
      title: c.title,
      year: c.year,
      summary: c.summary,
      detailUrl: c.detailUrl,
      imageUrl: c.imageUrl,
      imageUrls: c.imageUrls,
      metadata: c.metadata,
    })),
    categories: Object.values(loaded.entities.platform ?? []).map((p) => {
      const pTitle = p.title;
      return {
        id: p.id,
        title: typeof pTitle === "string"
          ? pTitle
          : typeof pTitle === "number" ? String(pTitle) : "",
      };
    }),
  };

  // Cache the collection for offline use (fire and forget)
  const sourceId = basePath.replace(/\//g, "-");
  cacheCollection(sourceId, legacyCollection).catch((error: unknown) => {
    console.warn("Failed to cache collection:", error);
  });

  return {
    cards,
    collection: legacyCollection,
    displayConfig: loaded.definition.display,
    uiLabels: loaded.definition.uiLabels,
    config: loaded.definition.config,
  };
}

/**
 * Hook for fetching local collection data.
 *
 * Uses TanStack Query for caching, loading states, and error handling.
 * Uses v2 schema format exclusively.
 *
 * @param config - Local source configuration
 * @param options - Additional query options
 * @returns Query result with cards and collection data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useLocalCollection({
 *   basePath: '/data/collections/retro-games'
 * });
 * ```
 */
export function useLocalCollection(
  config: LocalSourceConfig,
  options?: Omit<
    UseQueryOptions<CollectionResult>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: collectionKeys.local(config.basePath),
    queryFn: () => fetchCollection(config.basePath),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Default local data path.
 */
const DEFAULT_LOCAL_PATH = "/data/retro-games";

/**
 * Hook for fetching the default local collection.
 *
 * Convenience wrapper around useLocalCollection with the default path.
 *
 * @param options - Additional query options
 * @returns Query result with cards and collection data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDefaultCollection();
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <CardGrid cards={data.cards} />;
 * ```
 */
export function useDefaultCollection(
  options?: Omit<
    UseQueryOptions<CollectionResult>,
    "queryKey" | "queryFn"
  >
) {
  return useLocalCollection({ basePath: DEFAULT_LOCAL_PATH }, options);
}

/**
 * Re-export types for consumers.
 */
export type { CollectionResult, LocalSourceConfig };
