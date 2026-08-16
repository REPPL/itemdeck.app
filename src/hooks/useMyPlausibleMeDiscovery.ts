/**
 * MyPlausibleMe collection discovery hook.
 *
 * Scans a MyPlausibleMe repository via GitHub API to discover
 * available collections by finding collection.json files.
 *
 * @module hooks/useMyPlausibleMeDiscovery
 * @see F-087: Collection Discovery & Startup Picker
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { isCollectionCached } from "@/lib/cardCache";
import { useSourceStore } from "@/stores/sourceStore";

/**
 * Collection entry discovered from repository.
 */
export interface CollectionEntry {
  /**
   * GitHub username this collection was scanned from.
   *
   * Carried on the entry rather than read from the caller's current username
   * state: a scan is asynchronous, so the entry on screen may belong to an
   * earlier username. Pairing that folder with the newer username would build
   * (and persist) a source that can never resolve.
   */
  username: string;
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
 * Upper bound on the number of collections discovered from one repository.
 *
 * The username is attacker-controlled (it comes from the `/gh/<user>/` URL and
 * auto-runs on the picker with no click), and the GitHub tree can list tens of
 * thousands of `collection.json` files. Firing a metadata fetch for each would
 * amplify one page load into a CDN request flood. Cap the count; a real user
 * repository holds a handful of collections.
 */
const MAX_DISCOVERED_COLLECTIONS = 200;

/**
 * Number of metadata fetches kept in flight at once.
 */
const METADATA_FETCH_CONCURRENCY = 8;

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
    const url = buildCdnUrl(
      username,
      `data/collections/${collectionPath}/collection.json`
    );
    const response = await fetch(url);
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;
    // collection.json is untrusted third-party content. Its metadata is
    // rendered directly as React children in the startup picker (which sits
    // outside any error boundary), so a non-primitive name/description/
    // itemCount would throw "Objects are not valid as a React child" and blank
    // the whole app. Coerce to primitives at this trust boundary; the same
    // sanitised value is what persists into the source store on select.
    const record = data as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : undefined,
      description:
        typeof record.description === "string" ? record.description : undefined,
      itemCount:
        typeof record.itemCount === "number" &&
        Number.isFinite(record.itemCount)
          ? record.itemCount
          : undefined,
    };
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

  /**
   * Generation counter identifying the newest discovery run.
   *
   * A scan is one tree fetch plus up to MAX_DISCOVERED_COLLECTIONS metadata
   * fetches, so it can take seconds. Without a generation guard a superseded
   * run finishing late would overwrite the newer run's collections (or wipe
   * them with a stale error), leaving entries on screen that belong to a
   * different username.
   */
  const runIdRef = useRef(0);

  const discover = useCallback(async () => {
    const runId = ++runIdRef.current;
    const isStale = () => runIdRef.current !== runId;

    if (!username.trim()) {
      setCollections([]);
      setError(null);
      setIsLoading(false);
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

      if (isStale()) return;

      if (!response.ok) {
        if (response.status === 404) {
          setError("Repository not found. Check the username.");
        } else if (response.status === 403) {
          setError("GitHub API rate limit exceeded. Try again later.");
        } else {
          setError(
            `Failed to scan repository (HTTP ${String(response.status)})`
          );
        }
        setCollections([]);
        setIsLoading(false);
        return;
      }

      const treeData: unknown = await response.json();

      if (isStale()) return;

      if (!treeData || typeof treeData !== "object" || !("tree" in treeData)) {
        setError("Invalid repository structure");
        setCollections([]);
        setIsLoading(false);
        return;
      }

      const tree = (treeData as GitHubTreeResponse).tree;

      // Step 2: Find all collection.json files under data/collections/
      // Pattern: data/collections/{path}/collection.json
      const allCollectionJsonFiles = tree.filter(
        (entry) =>
          entry.type === "blob" &&
          entry.path.startsWith("data/collections/") &&
          entry.path.endsWith("/collection.json")
      );

      if (allCollectionJsonFiles.length === 0) {
        setError("No collections found in repository");
        setCollections([]);
        setIsLoading(false);
        return;
      }

      // The username is untrusted, so a hostile repository can list a huge
      // number of collection.json files. Cap before fanning out a metadata
      // fetch per file.
      const collectionJsonFiles = allCollectionJsonFiles.slice(
        0,
        MAX_DISCOVERED_COLLECTIONS
      );
      if (allCollectionJsonFiles.length > MAX_DISCOVERED_COLLECTIONS) {
        console.warn(
          `Repository lists ${String(allCollectionJsonFiles.length)} collections; showing the first ${String(MAX_DISCOVERED_COLLECTIONS)}.`
        );
      }

      // Step 3: Extract collection paths and fetch metadata
      // e.g., "data/collections/retro/games/collection.json" -> "retro/games"
      const validCollections: CollectionEntry[] = [];

      // Fetch metadata through a fixed-size pool rather than all at once.
      let fileCursor = 0;
      const metadataWorker = async (): Promise<void> => {
        while (fileCursor < collectionJsonFiles.length) {
          // A superseded run keeps no results, so stop spending fetches on it.
          if (isStale()) return;
          const index = fileCursor;
          fileCursor += 1;
          const file = collectionJsonFiles[index];
          if (!file) continue;
          // Extract the collection path (everything between data/collections/ and /collection.json)
          const match = /^data\/collections\/(.+)\/collection\.json$/.exec(
            file.path
          );
          if (!match?.[1]) continue;

          const collectionPath = match[1];
          const metadata = await fetchCollectionMetadata(
            trimmedUsername,
            collectionPath
          );

          if (metadata !== null) {
            // Cache entries are keyed by the sourceStore source.id (the
            // canonical convention). Look up the registered source for this
            // collection; an unregistered collection cannot have been cached.
            const collectionUrl = buildCdnUrl(
              trimmedUsername,
              `data/collections/${collectionPath}`
            );
            const registeredSource = useSourceStore
              .getState()
              .sources.find(
                (s) =>
                  (s.sourceType === "myplausibleme" &&
                    s.mpmUsername?.toLowerCase() ===
                      trimmedUsername.toLowerCase() &&
                    s.mpmFolder?.toLowerCase() ===
                      collectionPath.toLowerCase()) ||
                  s.url === collectionUrl
              );
            const cached = registeredSource
              ? await isCollectionCached(registeredSource.id)
              : false;

            // Use the last segment of the path as display name fallback
            const pathSegments = collectionPath.split("/");
            const folderName =
              pathSegments[pathSegments.length - 1] ?? collectionPath;

            validCollections.push({
              username: trimmedUsername,
              folder: collectionPath,
              name: metadata.name ?? folderName,
              description: metadata.description,
              itemCount: metadata.itemCount,
              isCached: cached,
            });
          }
        }
      };

      const metadataWorkerCount = Math.min(
        METADATA_FETCH_CONCURRENCY,
        collectionJsonFiles.length
      );
      await Promise.all(
        Array.from({ length: metadataWorkerCount }, () => metadataWorker())
      );

      if (isStale()) return;

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
      if (isStale()) return;
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
      setIsLoading(false);
      return;
    }

    // Debounce discovery to avoid excessive requests while typing
    const timeoutId = setTimeout(() => {
      void discover();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      // Invalidate any run already in flight for the previous username. The
      // next run only starts after the debounce, so without this bump a scan
      // resolving inside that window would still be the newest generation and
      // would publish results for a username the caller has moved on from.
      runIdRef.current += 1;
    };
  }, [username, enabled, discover]);

  const refresh = useCallback(() => {
    void discover();
  }, [discover]);

  return { collections, isLoading, error, refresh };
}
