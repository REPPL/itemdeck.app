/**
 * Collection manifest hook for discovering available collections.
 *
 * Fetches and caches manifest.json from sources to discover
 * available collections for selection.
 */

import { useQuery } from "@tanstack/react-query";

/**
 * Collection metadata from manifest.
 */
export interface CollectionInfo {
  /** Unique collection identifier */
  id: string;
  /** Display name */
  title: string;
  /** Optional description */
  description?: string;
  /** Number of items in collection */
  itemCount: number;
  /** Optional thumbnail URL */
  thumbnail?: string;
  /** Full URL to collection.json */
  url: string;
}

/**
 * Manifest structure for a source.
 */
export interface CollectionManifest {
  /** Available collections */
  collections: CollectionInfo[];
  /** When manifest was last updated */
  lastUpdated: Date;
}

/**
 * Query key factory for collection manifests.
 */
export const manifestKeys = {
  all: ["collection-manifest"] as const,
  single: (url: string) => [...manifestKeys.all, url] as const,
};

/**
 * Stale time for manifests (10 minutes).
 */
const MANIFEST_STALE_TIME = 10 * 60 * 1000;

/**
 * Fetch manifest from a source URL.
 *
 * If manifest.json doesn't exist, creates a single-collection
 * manifest from the source's collection.json.
 */
async function fetchManifest(sourceUrl: string): Promise<CollectionManifest> {
  // Normalise source URL
  const baseUrl = sourceUrl.endsWith("/")
    ? sourceUrl.slice(0, -1)
    : sourceUrl;

  // Try manifest.json first
  const manifestUrl = `${baseUrl}/manifest.json`;

  try {
    const response = await fetch(manifestUrl, { cache: "no-store" });

    if (response.ok) {
      const data = await response.json() as {
        collections?: {
          id: string;
          title?: string;
          name?: string;
          description?: string;
          itemCount?: number;
          thumbnail?: string;
          url?: string;
        }[];
        lastUpdated?: string;
      };

      // Parse manifest structure
      const collections: CollectionInfo[] = (data.collections ?? []).map((c) => ({
        id: c.id,
        title: c.title ?? c.name ?? c.id,
        description: c.description,
        itemCount: c.itemCount ?? 0,
        thumbnail: c.thumbnail,
        url: c.url ?? `${baseUrl}/${c.id}/collection.json`,
      }));

      return {
        collections,
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
      };
    }
  } catch {
    // Manifest not found, fall through to collection.json
  }

  // Fallback: Create manifest from collection.json
  const collectionUrl = `${baseUrl}/collection.json`;

  try {
    const response = await fetch(collectionUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to fetch collection: ${String(response.status)}`);
    }

    const data = await response.json() as {
      meta?: {
        name?: string;
        description?: string;
      };
      items?: unknown[];
    };

    // Create single-collection manifest
    return {
      collections: [{
        id: "default",
        title: data.meta?.name ?? "Collection",
        description: data.meta?.description,
        itemCount: data.items?.length ?? 0,
        url: collectionUrl,
      }],
      lastUpdated: new Date(),
    };
  } catch (error) {
    throw new Error(
      `Failed to discover collections: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Hook for fetching collection manifest from a source.
 *
 * @param sourceUrl - Base URL of the source
 * @param options - Query options
 * @returns Query result with manifest data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCollectionManifest("https://example.com/data");
 *
 * if (data) {
 *   data.collections.map(c => (
 *     <CollectionCard key={c.id} collection={c} />
 *   ));
 * }
 * ```
 */
export function useCollectionManifest(
  sourceUrl: string,
  options?: {
    /** Whether to enable the query (default: true) */
    enabled?: boolean;
    /** Stale time in ms (default: 10 minutes) */
    staleTime?: number;
  }
) {
  const {
    enabled = true,
    staleTime = MANIFEST_STALE_TIME,
  } = options ?? {};

  return useQuery({
    queryKey: manifestKeys.single(sourceUrl),
    queryFn: () => fetchManifest(sourceUrl),
    enabled: enabled && Boolean(sourceUrl),
    staleTime,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
