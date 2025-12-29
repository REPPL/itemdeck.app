/**
 * GitHub API-based entity discovery.
 *
 * When no index.json exists, this module can discover entity files
 * by calling the GitHub Contents API to list directory contents.
 *
 * @see F-091: Entity Auto-Discovery
 */

/**
 * GitHub Contents API response item.
 */
interface GitHubContentItem {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
}

/**
 * GitHub API rate limit info.
 */
export interface RateLimitInfo {
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Track rate limit state.
 */
let lastRateLimitReset: number | null = null;

/**
 * Parse GitHub API rate limit headers.
 *
 * @param response - Fetch Response object
 * @returns Rate limit info or null if headers are missing
 */
export function parseRateLimitHeaders(response: Response): RateLimitInfo | null {
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const reset = response.headers.get("X-RateLimit-Reset");

  if (remaining && reset) {
    return {
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
  }
  return null;
}

/**
 * Check if we should skip GitHub API due to rate limiting.
 *
 * @returns True if currently rate limited
 */
export function isRateLimited(): boolean {
  if (!lastRateLimitReset) return false;
  return Date.now() / 1000 < lastRateLimitReset;
}

/**
 * Clear rate limit state (e.g., after reset time passes).
 */
export function clearRateLimitState(): void {
  lastRateLimitReset = null;
}

/**
 * Set rate limit reset timestamp (exposed for testing).
 *
 * @param resetTimestamp - Unix timestamp when rate limit resets
 */
export function setRateLimitReset(resetTimestamp: number | null): void {
  lastRateLimitReset = resetTimestamp;
}

/**
 * Parsed GitHub repository info from a CDN URL.
 */
export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

/**
 * Parse a jsDelivr CDN URL to extract GitHub repository info.
 *
 * @param cdnUrl - jsDelivr CDN URL (e.g., https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games)
 * @returns GitHub repo info or null if not a valid jsDelivr URL
 *
 * @example
 * parseJsDelivrUrl("https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games")
 * // Returns: { owner: "REPPL", repo: "MyPlausibleMe", branch: "main", path: "data/collections/retro-games" }
 */
export function parseJsDelivrUrl(cdnUrl: string): GitHubRepoInfo | null {
  // Match jsDelivr GitHub CDN pattern
  // Format: https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}
  const match = /^https?:\/\/cdn\.jsdelivr\.net\/gh\/([^/]+)\/([^@]+)@([^/]+)\/(.+)$/.exec(cdnUrl);

  if (!match) {
    return null;
  }

  const [, owner, repo, branch, path] = match;

  if (!owner || !repo || !branch || !path) {
    return null;
  }

  return { owner, repo, branch, path };
}

/**
 * Discover entity IDs by listing a GitHub directory.
 *
 * Uses the GitHub Contents API to list files in the entity directory,
 * then filters for JSON files that aren't prefixed with underscore.
 *
 * Rate limiting is tracked to prevent repeated failed API calls.
 * When rate limited, the function returns null immediately without
 * making an API call.
 *
 * @param cdnUrl - jsDelivr CDN URL pointing to entity directory
 * @returns Array of entity IDs or null if discovery failed
 *
 * @example
 * discoverEntitiesViaGitHub("https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games/games")
 * // Returns: ["001-super-mario-bros", "002-zelda", ...] or null
 */
export async function discoverEntitiesViaGitHub(
  cdnUrl: string
): Promise<string[] | null> {
  // Skip if currently rate limited
  if (isRateLimited()) {
    console.warn("[GitHub Discovery] Skipping due to rate limit");
    return null;
  }

  const repoInfo = parseJsDelivrUrl(cdnUrl);

  if (!repoInfo) {
    // Not a jsDelivr URL, can't use GitHub API
    return null;
  }

  const { owner, repo, branch, path } = repoInfo;

  // Build GitHub Contents API URL
  // Format: https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // User-Agent is required by GitHub API
        "User-Agent": "itemdeck-app",
      },
    });

    if (!response.ok) {
      // Handle rate limiting from 403 response
      if (response.status === 403) {
        const rateLimit = parseRateLimitHeaders(response);
        if (rateLimit?.remaining === 0) {
          lastRateLimitReset = rateLimit.reset;
          const resetDate = new Date(rateLimit.reset * 1000);
          console.warn(
            `[GitHub Discovery] Rate limited until ${resetDate.toISOString()}`
          );
        } else {
          console.warn("[GitHub Discovery] Access forbidden (403)");
        }
      }
      return null;
    }

    const contents = (await response.json()) as GitHubContentItem[] | GitHubContentItem;

    // Contents API returns array for directories, single object for files
    if (!Array.isArray(contents)) {
      return null;
    }

    // Filter for JSON files, excluding:
    // - Files starting with underscore (_template.json, _schema.json)
    // - index.json itself
    // - Non-JSON files
    const entityIds = contents
      .filter((item): item is GitHubContentItem => {
        if (item.type !== "file") return false;
        if (!item.name.endsWith(".json")) return false;
        if (item.name.startsWith("_")) return false;
        if (item.name === "index.json") return false;
        return true;
      })
      .map((item) => item.name.replace(/\.json$/, ""))
      .sort();

    return entityIds.length > 0 ? entityIds : null;
  } catch (error) {
    console.warn("[GitHub Discovery] API discovery failed:", error);
    return null;
  }
}

/**
 * Check if a URL is a jsDelivr GitHub CDN URL.
 *
 * @param url - URL to check
 * @returns True if URL points to jsDelivr GitHub CDN
 */
export function isJsDelivrGitHubUrl(url: string): boolean {
  return /^https?:\/\/cdn\.jsdelivr\.net\/gh\//.test(url);
}
