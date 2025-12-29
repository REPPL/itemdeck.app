/**
 * MyPlausibleMe collection discovery hook.
 *
 * Scans a MyPlausibleMe repository via GitHub API to discover
 * available collections by finding collection.json files.
 *
 * @module hooks/useMyPlausibleMeDiscovery
 * @see F-087: Collection Discovery & Startup Picker
 */

import { useState, useEffect, useCallback } from "react";
import { isCollectionCached } from "@/lib/cardCache";

/**
 * Collection entry discovered from repository.
 */
export interface CollectionEntry {
  /** Collection folder name */
  folder: string;
  /** Display name (from collection.json or folder name) */
  name: string;
  /** Description (optional, from collection.json) */
  description?: string;
  /** Item count (optional, from collection.json) */
  itemCount?: number;
  /** Whether this collection is already cached locally */
  isCached?: boolean;
}

/**
 * GitHub Tree API entry.
 */
interface GitHubTreeEntry {
  path: string;
  type: "blob" | "tree";
  sha: string;
}

/**
 * GitHub Tree API response.
 */
interface GitHubTreeResponse {
  sha: string;
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

/**
 * Collection metadata from collection.json.
 */
interface CollectionMetadata {
  name?: string;
  description?: string;
  itemCount?: number;
}

/**
 * Discovery result.
 */
interface DiscoveryResult {
  /** Available collections */
  collections: CollectionEntry[];
  /** Whether discovery is in progress */
  isLoading: boolean;
  /** Error message if discovery failed */
  error: string | null;
  /** Trigger a manual refresh */
  refresh: () => void;
}

/**
 * Build GitHub API URL to get repository tree (recursive).
 */
function buildGitHubTreeApiUrl(username: string): string {
  return `https://api.github.com/repos/${username}/MyPlausibleMe/git/trees/main?recursive=1`;
}

/**
 * Build jsDelivr CDN URL for a file.
 */
function buildCdnUrl(username: string, path: string, branch = "main"): string {
  return `https://cdn.jsdelivr.net/gh/${username}/MyPlausibleMe@${branch}/${path}`;
}

/**
 * Fetch collection metadata from collection.json.
 *
 * @param username - GitHub username
 * @param collectionPath - Path relative to data/collections/ (e.g., "retro/games" or "retro-games")
 */
async function fetchCollectionMetadata(
  username: string,
  collectionPath: string
): Promise<CollectionMetadata | null> {
  try {
    const url = buildCdnUrl(username, `data/collections/${collectionPath}/collection.json`);
    const response = await fetch(url);
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;
    return data as CollectionMetadata;
  } catch {
    return null;
  }
}

/**
 * Hook to discover collections from a MyPlausibleMe repository.
 *
 * Uses GitHub API to scan the data/collections directory for subdirectories,
 * then validates each by checking for a collection.json file.
 *
 * @param username - GitHub username to discover from
 * @param options - Discovery options
 * @returns Discovery result with collections list
 *
 * @example
 * ```tsx
 * const { collections, isLoading, error } = useMyPlausibleMeDiscovery("REPPL");
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <select>
 *     {collections.map(c => (
 *       <option key={c.folder} value={c.folder}>{c.name}</option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useMyPlausibleMeDiscovery(
  username: string,
  options: { enabled?: boolean } = {}
): DiscoveryResult {
  const { enabled = true } = options;

  const [collections, setCollections] = useState<CollectionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discover = useCallback(async () => {
    if (!username.trim()) {
      setCollections([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const trimmedUsername = username.trim();

      // Step 1: Use GitHub Tree API to recursively find all collection.json files
      // This handles nested folder structures like data/collections/retro/games/
      const treeUrl = buildGitHubTreeApiUrl(trimmedUsername);
      const response = await fetch(treeUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("Repository not found. Check the username.");
        } else if (response.status === 403) {
          setError("GitHub API rate limit exceeded. Try again later.");
        } else {
          setError(`Failed to scan repository (HTTP ${String(response.status)})`);
        }
        setCollections([]);
        setIsLoading(false);
        return;
      }

      const treeData: unknown = await response.json();

      if (!treeData || typeof treeData !== "object" || !("tree" in treeData)) {
        setError("Invalid repository structure");
        setCollections([]);
        setIsLoading(false);
        return;
      }

      const tree = (treeData as GitHubTreeResponse).tree;

      // Step 2: Find all collection.json files under data/collections/
      // Pattern: data/collections/{path}/collection.json
      const collectionJsonFiles = tree.filter(
        (entry) =>
          entry.type === "blob" &&
          entry.path.startsWith("data/collections/") &&
          entry.path.endsWith("/collection.json")
      );

      if (collectionJsonFiles.length === 0) {
        setError("No collections found in repository");
        setCollections([]);
        setIsLoading(false);
        return;
      }

      // Step 3: Extract collection paths and fetch metadata
      // e.g., "data/collections/retro/games/collection.json" -> "retro/games"
      const validCollections: CollectionEntry[] = [];

      await Promise.all(
        collectionJsonFiles.map(async (file) => {
          // Extract the collection path (everything between data/collections/ and /collection.json)
          const match = /^data\/collections\/(.+)\/collection\.json$/.exec(file.path);
          if (!match?.[1]) return;

          const collectionPath = match[1];
          const metadata = await fetchCollectionMetadata(trimmedUsername, collectionPath);

          if (metadata !== null) {
            // Build source ID to check cache status
            // Use the full path (e.g., "retro/games") as the folder identifier
            const sourceId = `myplausibleme:${trimmedUsername}:${collectionPath}`;
            const cached = await isCollectionCached(sourceId);

            // Use the last segment of the path as display name fallback
            const pathSegments = collectionPath.split("/");
            const folderName = pathSegments[pathSegments.length - 1] ?? collectionPath;

            validCollections.push({
              folder: collectionPath,
              name: metadata.name ?? folderName,
              description: metadata.description,
              itemCount: metadata.itemCount,
              isCached: cached,
            });
          }
        })
      );

      // Sort: cached collections first, then alphabetically by name
      validCollections.sort((a, b) => {
        // Cached collections come first
        if (a.isCached && !b.isCached) return -1;
        if (!a.isCached && b.isCached) return 1;
        // Then sort alphabetically
        return a.name.localeCompare(b.name);
      });

      if (validCollections.length === 0) {
        setError("No valid collections found (missing collection.json files)");
        setCollections([]);
      } else {
        setCollections(validCollections);
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
      setCollections([]);
      setIsLoading(false);
    }
  }, [username]);

  // Auto-discover when username changes
  useEffect(() => {
    if (!enabled) {
      setCollections([]);
      setError(null);
      return;
    }

    // Debounce discovery to avoid excessive requests while typing
    const timeoutId = setTimeout(() => {
      void discover();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [username, enabled, discover]);

  const refresh = useCallback(() => {
    void discover();
  }, [discover]);

  return { collections, isLoading, error, refresh };
}
