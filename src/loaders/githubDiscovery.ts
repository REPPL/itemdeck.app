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
        "Accept": "application/vnd.github.v3+json",
        // Note: For higher rate limits, add Authorization header with token
      },
    });

    if (!response.ok) {
      // GitHub API error (404 = directory doesn't exist, 403 = rate limited)
      if (response.status === 403) {
        console.warn("GitHub API rate limit exceeded");
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
    console.warn("GitHub API discovery failed:", error);
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
