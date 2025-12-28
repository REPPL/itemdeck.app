/**
 * Hook to parse URL path for collection routing.
 *
 * Supports two URL patterns:
 * - /gh/{username}/ - Opens picker with username prefilled
 * - /gh/{username}/collection/{folder}/ - Loads collection directly
 *
 * @example
 * ```
 * itemdeck.app/gh/REPPL/
 * itemdeck.app/gh/REPPL/collection/retro-games/
 * ```
 */

import { useMemo } from "react";

/**
 * Parsed URL collection info.
 */
export interface UrlCollectionInfo {
  /** Whether a GitHub path was detected */
  hasGitHubPath: boolean;
  /** GitHub username from URL */
  username: string | null;
  /** Collection folder from URL (if specified) */
  folder: string | null;
  /** Whether to load collection directly (vs show picker) */
  directLoad: boolean;
}

/**
 * Parse the current URL path for collection routing.
 *
 * @returns Parsed collection info from URL
 */
export function parseUrlPath(pathname: string): UrlCollectionInfo {
  // Match /gh/{username}/ or /gh/{username}/collection/{folder}/
  const ghMatch = /^\/gh\/([^/]+)\/?(.*)$/.exec(pathname);

  if (!ghMatch) {
    return {
      hasGitHubPath: false,
      username: null,
      folder: null,
      directLoad: false,
    };
  }

  const username = ghMatch[1] ?? null;
  const rest = ghMatch[2] ?? "";

  // Check for /collection/{folder}/ pattern
  const collectionMatch = /^collection\/([^/]+)\/?$/.exec(rest);

  if (collectionMatch) {
    return {
      hasGitHubPath: true,
      username,
      folder: collectionMatch[1] ?? null,
      directLoad: true,
    };
  }

  // Just username, no specific collection
  return {
    hasGitHubPath: true,
    username,
    folder: null,
    directLoad: false,
  };
}

/**
 * Hook to get collection info from URL.
 *
 * @returns Parsed collection info from current URL
 */
export function useUrlCollection(): UrlCollectionInfo {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        hasGitHubPath: false,
        username: null,
        folder: null,
        directLoad: false,
      };
    }

    return parseUrlPath(window.location.pathname);
  }, []);
}

/**
 * Clear the URL path after loading (to avoid re-triggering on refresh).
 */
export function clearUrlPath(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.history.replaceState({}, "", "/");
  }
}
