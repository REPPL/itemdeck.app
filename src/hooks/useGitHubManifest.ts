/**
 * GitHub manifest fetching hook.
 *
 * Fetches the repository manifest to discover available collections.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { githubKeys } from "./queryKeys";
import { buildManifestUrl } from "@/config/dataSource";

/**
 * Collection entry in the manifest.
 */
export interface ManifestCollection {
  /** Path to the collection */
  path: string;

  /** Display name */
  name: string;

  /** Collection description */
  description: string;

  /** Schema type identifier */
  schema: string;

  /** Schema version */
  schemaVersion: string;

  /** Number of items in the collection */
  itemCount: number;

  /** Number of categories in the collection */
  categoryCount: number;

  /** Whether this collection should be featured */
  featured: boolean;
}

/**
 * Repository manifest structure.
 */
export interface Manifest {
  /** Manifest version */
  version: string;

  /** Available collections */
  collections: ManifestCollection[];
}

/**
 * Fetch the repository manifest from GitHub.
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Git branch (defaults to 'main')
 * @returns Parsed manifest data
 */
async function fetchManifest(
  owner: string,
  repo: string,
  branch = "main"
): Promise<Manifest> {
  const url = buildManifestUrl(owner, repo, branch);
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Repository manifest not found");
    }
    throw new Error(`Failed to fetch manifest: ${String(response.status)}`);
  }

  return response.json() as Promise<Manifest>;
}

/**
 * Hook for fetching GitHub repository manifest.
 *
 * The manifest lists all available collections in the repository.
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Git branch (optional, defaults to 'main')
 * @param options - Additional query options
 * @returns Query result with manifest data
 *
 * @example
 * ```tsx
 * const { data: manifest, isLoading } = useGitHubManifest('REPPL', 'MyPlausibleMe');
 *
 * if (manifest) {
 *   console.log('Available collections:', manifest.collections);
 * }
 * ```
 */
export function useGitHubManifest(
  owner: string,
  repo: string,
  branch?: string,
  options?: Omit<UseQueryOptions<Manifest>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: githubKeys.manifest(owner, repo, branch),
    queryFn: () => fetchManifest(owner, repo, branch),
    staleTime: 60 * 60 * 1000, // 1 hour (manifests change rarely)
    ...options,
  });
}
