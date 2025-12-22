/**
 * Collection data fetching hook.
 *
 * Provides TanStack Query wrapper for fetching collection data
 * from various sources (local, GitHub). Supports both legacy and v1 schema formats.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { collectionKeys } from "./queryKeys";
import {
  collectionSchema,
  joinCardsWithCategories,
  type Collection,
  type CardWithCategory,
} from "@/schemas";
import {
  loadCollection,
  isV1Collection,
  createResolverContext,
  resolveAllRelationships,
  getEntityRank,
  getPrimaryImageUrl,
  getImageUrls,
} from "@/loaders";
import type { Image } from "@/types/image";
import type { ResolvedEntity } from "@/types/schema";

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
 */
export interface DisplayCard extends Omit<CardWithCategory, "imageUrl" | "imageUrls"> {
  /** Primary image URL (always present - placeholder used if not in source) */
  imageUrl: string;

  /** Array of image URLs for gallery (always present - at least primary image) */
  imageUrls: string[];

  /** Flattened category title for display */
  categoryTitle?: string;

  /** Rank from metadata (parsed as number or null) */
  rank: number | null;

  /** Device/platform from metadata */
  device?: string;

  /** Image attribution/source information (e.g., Wikimedia Commons) */
  imageAttribution?: string;

  /** Logo URL for card back (from platform) */
  logoUrl?: string;
}

/**
 * Result of collection fetching.
 */
interface CollectionResult {
  /** Cards ready for display with imageUrl guaranteed */
  cards: DisplayCard[];

  /** Raw collection data (legacy format for backward compatibility) */
  collection: Collection;
}

/**
 * Fetch collection data from local JSON files (legacy format).
 *
 * @param basePath - Base path for the collection
 * @returns Collection data with items and categories
 */
async function fetchLegacyCollection(basePath: string): Promise<Collection> {
  // Fetch items and categories in parallel
  const [itemsResponse, categoriesResponse] = await Promise.all([
    fetch(`${basePath}/items.json`),
    fetch(`${basePath}/categories.json`),
  ]);

  if (!itemsResponse.ok) {
    throw new Error(`Failed to fetch items: ${String(itemsResponse.status)}`);
  }

  if (!categoriesResponse.ok) {
    throw new Error(
      `Failed to fetch categories: ${String(categoriesResponse.status)}`
    );
  }

  const [items, categories] = await Promise.all([
    itemsResponse.json() as Promise<unknown[]>,
    categoriesResponse.json() as Promise<unknown[]>,
  ]);

  // Optionally fetch collection metadata
  let meta: unknown;
  try {
    const metaResponse = await fetch(`${basePath}/collection.json`);
    if (metaResponse.ok) {
      meta = await metaResponse.json() as unknown;
    }
  } catch {
    // Collection metadata is optional
  }

  // Validate the assembled collection
  return collectionSchema.parse({ items, categories, meta });
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
 * Fetch and process v1 schema collection.
 *
 * @param basePath - Base path for the collection
 * @returns Collection result with display cards
 */
async function fetchV1Collection(basePath: string): Promise<CollectionResult> {
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
    const images = entity.images as Image[] | undefined;
    const imageUrls = getImageUrls(images);
    const primaryImageUrl = getPrimaryImageUrl(
      images,
      undefined,
      placeholder(entity.id)
    );

    // Get resolved platform
    const platform = entity._resolved?.platform as ResolvedEntity | undefined;

    // Get rank
    const rank = getEntityRank(entity, loaded.primaryType, context);

    return {
      id: entity.id,
      title: String(entity.title ?? ""),
      year: entity.year !== undefined ? String(entity.year) : undefined,
      summary: entity.summary as string | undefined,
      detailUrl: entity.detailUrl as string | undefined,
      imageUrl: primaryImageUrl,
      imageUrls: imageUrls.length > 0 ? imageUrls : [placeholder(entity.id)],
      categoryTitle: platform?.title as string | undefined,
      rank,
      device: platform?.title as string | undefined,
      imageAttribution: formatAttribution(images),
      logoUrl: platform?.logoUrl as string | undefined,
      metadata: Object.fromEntries(
        Object.entries({
          category: entity.platform as string | undefined,
          rank: rank !== null ? String(rank) : undefined,
        }).filter((entry): entry is [string, string] => entry[1] !== undefined)
      ),
    };
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
    categories: Object.values(loaded.entities.platform ?? []).map((p) => ({
      id: p.id,
      title: String(p.title ?? ""),
    })),
  };

  return { cards, collection: legacyCollection };
}

/**
 * Fetch collection data, auto-detecting format.
 *
 * @param basePath - Base path for the collection
 * @returns Collection result with display cards
 */
async function fetchCollection(basePath: string): Promise<CollectionResult> {
  // Check if this is a v1 collection
  const isV1 = await isV1Collection(basePath);

  if (isV1) {
    return fetchV1Collection(basePath);
  }

  // Fall back to legacy format
  const collection = await fetchLegacyCollection(basePath);

  // Join cards with categories for display
  const cards = joinCardsWithCategories(collection.items, collection.categories);

  // Process cards with placeholder images, image arrays, and metadata extraction
  const cardsWithImages: DisplayCard[] = cards.map((card) => {
    // Build imageUrls array: prefer imageUrls, fallback to imageUrl, then placeholder
    const placeholderUrl = `https://picsum.photos/seed/${card.id}/400/300`;
    let imageUrls: string[];

    if (card.imageUrls && card.imageUrls.length > 0) {
      imageUrls = card.imageUrls;
    } else if (card.imageUrl) {
      imageUrls = [card.imageUrl];
    } else {
      imageUrls = [placeholderUrl];
    }

    // Parse rank from metadata
    const rankStr = card.metadata?.rank;
    const rank = rankStr ? parseInt(rankStr, 10) : null;

    // Extract device from metadata or category
    const device = card.metadata?.device ?? card.category?.title;

    return {
      ...card,
      imageUrl: imageUrls[0] ?? placeholderUrl,
      imageUrls,
      categoryTitle: card.category?.title,
      rank: Number.isNaN(rank) ? null : rank,
      device,
    };
  });

  return { cards: cardsWithImages, collection };
}

/**
 * Hook for fetching local collection data.
 *
 * Uses TanStack Query for caching, loading states, and error handling.
 * Automatically detects and supports both legacy and v1 schema formats.
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
const DEFAULT_LOCAL_PATH = "/data/collections/retro-games";

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
