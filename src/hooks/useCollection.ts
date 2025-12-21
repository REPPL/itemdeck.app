/**
 * Collection data fetching hook.
 *
 * Provides TanStack Query wrapper for fetching collection data
 * from various sources (local, GitHub).
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { collectionKeys } from "./queryKeys";
import {
  collectionSchema,
  joinCardsWithCategories,
  type Collection,
  type CardWithCategory,
} from "@/schemas";

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
}

/**
 * Result of collection fetching.
 */
interface CollectionResult {
  /** Cards ready for display with imageUrl guaranteed */
  cards: DisplayCard[];

  /** Raw collection data */
  collection: Collection;
}

/**
 * Fetch collection data from local JSON files.
 *
 * @param basePath - Base path for the collection (e.g., '/data/collections/retro-games')
 * @returns Collection data with items and categories
 */
async function fetchLocalCollection(basePath: string): Promise<Collection> {
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
 * Hook for fetching local collection data.
 *
 * Uses TanStack Query for caching, loading states, and error handling.
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
    queryFn: async (): Promise<CollectionResult> => {
      const collection = await fetchLocalCollection(config.basePath);

      // Join cards with categories for display
      const cards = joinCardsWithCategories(
        collection.items,
        collection.categories
      );

      // Process cards with placeholder images, image arrays, and metadata extraction
      const cardsWithImages: DisplayCard[] = cards.map((card) => {
        // Build imageUrls array: prefer imageUrls, fallback to imageUrl, then placeholder
        const placeholder = `https://picsum.photos/seed/${card.id}/400/300`;
        let imageUrls: string[];

        if (card.imageUrls && card.imageUrls.length > 0) {
          imageUrls = card.imageUrls;
        } else if (card.imageUrl) {
          imageUrls = [card.imageUrl];
        } else {
          imageUrls = [placeholder];
        }

        // Parse rank from metadata
        const rankStr = card.metadata?.rank;
        const rank = rankStr ? parseInt(rankStr, 10) : null;

        // Extract device from metadata or category
        const device = card.metadata?.device ?? card.category?.title;

        return {
          ...card,
          imageUrl: imageUrls[0] ?? placeholder,
          imageUrls,
          categoryTitle: card.category?.title,
          rank: Number.isNaN(rank) ? null : rank,
          device,
        };
      });

      return { cards: cardsWithImages, collection };
    },
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
