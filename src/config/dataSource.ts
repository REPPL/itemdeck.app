/**
 * Data source configuration.
 *
 * Defines where to fetch collection data from.
 */

/**
 * Check if a string is a valid GitHub raw URL.
 *
 * @param url - URL to check
 * @returns True if URL is a valid raw.githubusercontent.com URL
 */
export function isGitHubRawUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "raw.githubusercontent.com";
  } catch {
    return false;
  }
}

/**
 * MyPlausibleMe repository configuration.
 */
export interface MyPlausibleMeConfig {
  /** GitHub username */
  username: string;
  /** Collection folder name */
  folder: string;
  /** Git branch (defaults to 'main') */
  branch?: string;
}

/**
 * Build a jsDelivr CDN URL for a MyPlausibleMe collection.
 *
 * Uses jsDelivr for CORS-friendly access to GitHub files.
 *
 * @param config - MyPlausibleMe configuration
 * @returns CDN URL for the collection
 *
 * @example
 * ```ts
 * buildMyPlausibleMeUrl({ username: "REPPL", folder: "retro/games" });
 * // "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro/games"
 * ```
 */
export function buildMyPlausibleMeUrl(config: MyPlausibleMeConfig): string {
  const { username, folder, branch = "main" } = config;
  return `https://cdn.jsdelivr.net/gh/${username}/MyPlausibleMe@${branch}/data/collections/${folder}`;
}

/**
 * Check if a URL follows the MyPlausibleMe format.
 *
 * The collection path may be nested (e.g. `retro/games`), so the trailing
 * segment matches one or more path segments, not just one.
 *
 * @param url - URL to check
 * @returns True if URL matches the MyPlausibleMe pattern
 */
export function isMyPlausibleMeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Check jsdelivr CDN format
    if (parsed.hostname === "cdn.jsdelivr.net") {
      return /^\/gh\/[^/]+\/MyPlausibleMe@[^/]+\/data\/collections\/.+$/.test(parsed.pathname);
    }
    // Check raw GitHub format
    if (parsed.hostname === "raw.githubusercontent.com") {
      return /^\/[^/]+\/MyPlausibleMe\/[^/]+\/data\/collections\/.+$/.test(parsed.pathname);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Parse a MyPlausibleMe URL to extract configuration.
 *
 * @param url - MyPlausibleMe URL to parse
 * @returns Configuration or null if not a valid MyPlausibleMe URL
 */
export function parseMyPlausibleMeUrl(url: string): MyPlausibleMeConfig | null {
  try {
    const parsed = new URL(url);

    // Parse jsdelivr CDN format
    if (parsed.hostname === "cdn.jsdelivr.net") {
      const match = /^\/gh\/([^/]+)\/MyPlausibleMe@([^/]+)\/data\/collections\/(.+)$/.exec(parsed.pathname);
      if (match?.[1] && match[2] && match[3]) {
        return {
          username: match[1],
          folder: match[3],
          branch: match[2],
        };
      }
    }

    // Parse raw GitHub format
    if (parsed.hostname === "raw.githubusercontent.com") {
      const match = /^\/([^/]+)\/MyPlausibleMe\/([^/]+)\/data\/collections\/(.+)$/.exec(parsed.pathname);
      if (match?.[1] && match[2] && match[3]) {
        return {
          username: match[1],
          folder: match[3],
          branch: match[2],
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
