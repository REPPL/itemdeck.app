/**
 * GitHub collection data fetching hook.
 *
 * Fetches collection data from GitHub repositories using raw URLs.
 * This approach avoids API rate limits and works for public repositories.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { collectionKeys } from "./queryKeys";
import {
  collectionSchema,
  joinCardsWithCategories,
  type Collection,
} from "@/schemas";
import {
  buildRawUrl,
  type GitHubRawConfig,
  defaultDataSource,
} from "@/config/dataSource";
import type { DisplayCard } from "./useCollection";

/**
 * Result of GitHub collection fetching.
 */
interface GitHubCollectionResult {
  /** Cards ready for display with imageUrl guaranteed */
  cards: DisplayCard[];

  /** Raw collection data */
  collection: Collection;

  /** Data source configuration used */
  source: GitHubRawConfig;
}

/**
 * Fetch a file from GitHub raw URL.
 *
 * @param url - Full raw GitHub URL
 * @returns Parsed JSON response
 * @throws Error if fetch fails or response is not OK
 */
async function fetchRawFile<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${url}`);
    }
    throw new Error(`Failed to fetch: ${String(response.status)}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch collection data from GitHub.
 *
 * @param config - GitHub source configuration
 * @returns Collection data with items and categories
 */
async function fetchGitHubCollection(
  config: GitHubRawConfig
): Promise<Collection> {
  // Fetch items and categories in parallel
  const [items, categories] = await Promise.all([
    fetchRawFile<unknown[]>(buildRawUrl(config, "items.json")),
    fetchRawFile<unknown[]>(buildRawUrl(config, "categories.json")),
  ]);

  // Optionally fetch collection metadata
  let meta;
  try {
    meta = await fetchRawFile<unknown>(buildRawUrl(config, "collection.json"));
  } catch {
    // Collection metadata is optional
  }

  // Validate the assembled collection
  return collectionSchema.parse({ items, categories, meta });
}

/**
 * Hook for fetching GitHub collection data.
 *
 * Uses TanStack Query for caching, loading states, and error handling.
 *
 * @param config - GitHub source configuration
 * @param options - Additional query options
 * @returns Query result with cards and collection data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGitHubCollection({
 *   owner: 'REPPL',
 *   repo: 'MyPlausibleMe',
 *   collection: 'retro-games',
 * });
 * ```
 */
export function useGitHubCollection(
  config: GitHubRawConfig,
  options?: Omit<
    UseQueryOptions<GitHubCollectionResult>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: collectionKeys.github(config),
    queryFn: async (): Promise<GitHubCollectionResult> => {
      const collection = await fetchGitHubCollection(config);

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

      return { cards: cardsWithImages, collection, source: config };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (GitHub data changes less frequently)
    ...options,
  });
}

/**
 * Hook for fetching the default GitHub collection.
 *
 * Convenience wrapper around useGitHubCollection with the default data source.
 *
 * @param options - Additional query options
 * @returns Query result with cards and collection data
 */
export function useDefaultGitHubCollection(
  options?: Omit<
    UseQueryOptions<GitHubCollectionResult>,
    "queryKey" | "queryFn"
  >
) {
  return useGitHubCollection(defaultDataSource, options);
}

/**
 * Re-export types for consumers.
 */
export type { GitHubCollectionResult };
