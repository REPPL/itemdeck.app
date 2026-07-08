/**
 * Hook to parse URL path for collection routing.
 *
 * Supports multiple URL patterns:
 * - /gh?u=REPPL&c=my_games - Short query params (preferred)
 * - /gh?u=REPPL&c=retro/my_games - Nested folder support
 * - /gh?u=REPPL&collection=commercials - Full query params
 * - /gh/REPPL/c/my_games - Clean path format
 * - /gh/REPPL/c/retro/my_games - Nested path format
 * - /gh/{username}/ - Opens picker with username prefilled
 * - /gh/{username}/collection/{folder}/ - Legacy path format
 * - ?collection=full-url - Legacy full URL format
 *
 * Path type indicators:
 * - /c/ = collection
 * - /m/ = mechanic (future)
 * - /t/ = theme (future)
 *
 * @example
 * ```
 * itemdeck.app/gh?u=REPPL&c=retro-games
 * itemdeck.app/gh/REPPL/c/retro-games
 * itemdeck.app/gh/REPPL/c/retro/my_games
 * itemdeck.app/?collection=https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/commercials
 * ```
 */

import { useMemo } from "react";
import { parseProviderUrl, buildCollectionUrl } from "@/providers";
import { isAllowedCollectionSource } from "@/config/allowedSources";
import { getBasePath, stripBase } from "@/config/basePath";

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
  /** User-visible error when the URL was rejected (e.g. blocked source) */
  error: string | null;
}

/**
 * Parse a value as an absolute URL, or return null if it is not one.
 */
function parseAbsoluteUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Parse the current URL for collection routing.
 *
 * Supports multiple formats:
 * 1. Provider URL: /gh?u=REPPL&c=my_games (preferred, short)
 * 2. Provider URL: /gh?u=REPPL&collection=my_games (full)
 * 3. Path-based: /gh/REPPL/c/my_games (new clean format)
 * 4. Path-based: /gh/REPPL/c/retro/my_games (nested folders)
 * 5. Path-based: /gh/REPPL/collection/my_games/ (legacy)
 * 6. Legacy full URL: ?collection=https://cdn.jsdelivr.net/...
 *
 * @param pathname - URL pathname (the app base path is stripped first)
 * @param searchParams - URL search parameters
 * @returns Parsed collection info from URL
 */
export function parseUrlPath(
  pathname: string,
  searchParams?: URLSearchParams
): UrlCollectionInfo {
  const params = searchParams ?? new URLSearchParams();

  // Strip the app base path (e.g. "/demo/") so the route patterns below
  // keep matching root-relative paths like "/gh/USER/c/PATH".
  const path = stripBase(pathname);

  // 1. Check for legacy full URL format: ?collection=https://...
  const legacyCollectionUrl = params.get("collection");
  const legacyUrl = legacyCollectionUrl
    ? parseAbsoluteUrl(legacyCollectionUrl)
    : null;
  if (legacyCollectionUrl && legacyUrl) {
    // Absolute URL: enforce the source allowlist before accepting it.
    if (!isAllowedCollectionSource(legacyCollectionUrl)) {
      return {
        hasGitHubPath: false,
        username: null,
        folder: null,
        directLoad: false,
        collectionUrl: null,
        providerId: null,
        error: `Collection URL blocked: "${legacyUrl.hostname || legacyCollectionUrl}" is not an allowed source.`,
      };
    }

    return {
      hasGitHubPath: false,
      username: null,
      folder: null,
      directLoad: true,
      collectionUrl: legacyCollectionUrl,
      providerId: null,
      error: null,
    };
  }

  // 2. Check for provider URL format: /gh?u=REPPL&c=my_games or /gh?u=REPPL&collection=my_games
  // Support 'c' as alias for 'collection'
  const normalizedParams = new URLSearchParams(params);
  const shortCollection = params.get("c");
  if (shortCollection && !params.get("collection")) {
    normalizedParams.set("collection", shortCollection);
  }

  const providerResult = parseProviderUrl(path, normalizedParams);
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
        error: null,
      };
    }
  }

  // 3. Check for path-based formats: /gh/REPPL/...
  const ghMatch = /^\/gh\/([^/]+)\/?(.*)$/.exec(path);

  if (!ghMatch) {
    return {
      hasGitHubPath: false,
      username: null,
      folder: null,
      directLoad: false,
      collectionUrl: null,
      providerId: null,
      error: null,
    };
  }

  const username = ghMatch[1] ?? null;
  const rest = ghMatch[2] ?? "";

  // 4. Check for new short format: /c/{path} (supports nested folders)
  const shortPathMatch = /^c\/(.+?)\/?$/.exec(rest);
  if (shortPathMatch) {
    const folder = shortPathMatch[1] ?? null;
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
      error: null,
    };
  }

  // 5. Check for legacy format: /collection/{folder}/ (single folder only)
  const legacyPathMatch = /^collection\/([^/]+)\/?$/.exec(rest);
  if (legacyPathMatch) {
    const folder = legacyPathMatch[1] ?? null;
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
      error: null,
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
    error: null,
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
        error: null,
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
 *
 * Resets to the app base path (e.g. "/demo/"), not the origin root.
 */
export function clearUrlPath(): void {
  if (typeof window === "undefined") {
    return;
  }
  const base = getBasePath();
  if (window.location.pathname !== base) {
    window.history.replaceState({}, "", base);
  }
}
