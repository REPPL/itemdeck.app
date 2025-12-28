/**
 * Hook to parse URL path for collection routing.
 *
 * Supports multiple URL patterns:
 * - /gh?u=REPPL&collection=commercials - Query params (preferred)
 * - /gh/{username}/ - Opens picker with username prefilled
 * - /gh/{username}/collection/{folder}/ - Loads collection directly
 * - ?collection=full-url - Legacy full URL format
 *
 * @example
 * ```
 * itemdeck.app/gh?u=REPPL&collection=commercials
 * itemdeck.app/gh/REPPL/
 * itemdeck.app/gh/REPPL/collection/retro-games/
 * itemdeck.app/?collection=https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/commercials
 * ```
 */

import { useMemo } from "react";
import { parseProviderUrl, buildCollectionUrl } from "@/providers";

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
  /** Full collection URL if using provider or legacy format */
  collectionUrl: string | null;
  /** Provider ID if using provider URL format */
  providerId: string | null;
}

/**
 * Parse the current URL for collection routing.
 *
 * Supports multiple formats:
 * 1. Provider URL: /gh?u=REPPL&collection=commercials (preferred)
 * 2. Path-based: /gh/REPPL/collection/commercials/ (legacy)
 * 3. Legacy full URL: ?collection=https://cdn.jsdelivr.net/...
 *
 * @param pathname - URL pathname
 * @param searchParams - URL search parameters
 * @returns Parsed collection info from URL
 */
export function parseUrlPath(
  pathname: string,
  searchParams?: URLSearchParams
): UrlCollectionInfo {
  const params = searchParams ?? new URLSearchParams();

  // 1. Check for legacy full URL format: ?collection=https://...
  const legacyCollectionUrl = params.get("collection");
  if (legacyCollectionUrl?.startsWith("http")) {
    return {
      hasGitHubPath: false,
      username: null,
      folder: null,
      directLoad: true,
      collectionUrl: legacyCollectionUrl,
      providerId: null,
    };
  }

  // 2. Check for provider URL format: /gh?u=REPPL&collection=commercials
  const providerResult = parseProviderUrl(pathname, params);
  if (providerResult) {
    const { providerId, params: providerParams } = providerResult;
    const collectionUrl = buildCollectionUrl(providerId, providerParams);

    if (collectionUrl) {
      return {
        hasGitHubPath: providerId === "gh",
        username: providerParams.u ?? null,
        folder: providerParams.collection ?? null,
        directLoad: true,
        collectionUrl,
        providerId,
      };
    }
  }

  // 3. Check for path-based format: /gh/REPPL/collection/commercials/
  const ghMatch = /^\/gh\/([^/]+)\/?(.*)$/.exec(pathname);

  if (!ghMatch) {
    return {
      hasGitHubPath: false,
      username: null,
      folder: null,
      directLoad: false,
      collectionUrl: null,
      providerId: null,
    };
  }

  const username = ghMatch[1] ?? null;
  const rest = ghMatch[2] ?? "";

  // Check for /collection/{folder}/ pattern
  const collectionMatch = /^collection\/([^/]+)\/?$/.exec(rest);

  if (collectionMatch) {
    const folder = collectionMatch[1] ?? null;
    // Build collection URL from path parameters
    const collectionUrl = username && folder
      ? buildCollectionUrl("gh", { u: username, collection: folder })
      : null;

    return {
      hasGitHubPath: true,
      username,
      folder,
      directLoad: true,
      collectionUrl,
      providerId: "gh",
    };
  }

  // Just username, no specific collection
  return {
    hasGitHubPath: true,
    username,
    folder: null,
    directLoad: false,
    collectionUrl: null,
    providerId: null,
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
        collectionUrl: null,
        providerId: null,
      };
    }

    return parseUrlPath(
      window.location.pathname,
      new URLSearchParams(window.location.search)
    );
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
