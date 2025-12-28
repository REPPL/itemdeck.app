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
 * GitHub API directory entry.
 */
interface GitHubDirEntry {
  name: string;
  path: string;
  type: "file" | "dir";
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
 * Build GitHub API URL to list directory contents.
 */
function buildGitHubApiUrl(username: string, path: string): string {
  return `https://api.github.com/repos/${username}/MyPlausibleMe/contents/${path}`;
}

/**
 * Build jsDelivr CDN URL for a file.
 */
function buildCdnUrl(username: string, path: string, branch = "main"): string {
  return `https://cdn.jsdelivr.net/gh/${username}/MyPlausibleMe@${branch}/${path}`;
}

/**
 * Fetch collection metadata from collection.json.
 */
async function fetchCollectionMetadata(
  username: string,
  folder: string
): Promise<CollectionMetadata | null> {
  try {
    const url = buildCdnUrl(username, `data/collections/${folder}/collection.json`);
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
      // Step 1: List the data/collections directory via GitHub API
      const apiUrl = buildGitHubApiUrl(username.trim(), "data/collections");
      const response = await fetch(apiUrl, {
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

      const entries: unknown = await response.json();

      if (!Array.isArray(entries)) {
        setError("Invalid repository structure");
        setCollections([]);
        setIsLoading(false);
        return;
      }

      // Step 2: Filter for directories only
      const directories = (entries as GitHubDirEntry[]).filter(
        (entry) => entry.type === "dir"
      );

      if (directories.length === 0) {
        setError("No collections found in repository");
        setCollections([]);
        setIsLoading(false);
        return;
      }

      // Step 3: For each directory, check if it has a collection.json
      // and fetch metadata
      const validCollections: CollectionEntry[] = [];
      const trimmedUsername = username.trim();

      await Promise.all(
        directories.map(async (dir) => {
          const metadata = await fetchCollectionMetadata(trimmedUsername, dir.name);
          // Only include if collection.json exists (metadata fetch succeeded)
          if (metadata !== null) {
            // Build source ID to check cache status (matches sourceStore format)
            const sourceId = `myplausibleme:${trimmedUsername}:${dir.name}`;
            const cached = await isCollectionCached(sourceId);

            validCollections.push({
              folder: dir.name,
              name: metadata.name ?? dir.name,
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
