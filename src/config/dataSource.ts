/**
 * Data source configuration.
 *
 * Defines where to fetch collection data from.
 */

/**
 * GitHub raw URL data source configuration.
 */
export interface GitHubRawConfig {
  /** Repository owner */
  owner: string;

  /** Repository name */
  repo: string;

  /** Collection path within the repository */
  collection: string;

  /** Git branch (defaults to 'main') */
  branch?: string;
}

/**
 * Build a raw GitHub URL for a file.
 *
 * @param config - GitHub source configuration
 * @param file - Filename to fetch
 * @returns Full raw GitHub URL
 */
export function buildRawUrl(config: GitHubRawConfig, file: string): string {
  const { owner, repo, collection, branch = "main" } = config;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/collections/${collection}/${file}`;
}

/**
 * Build the manifest URL for a repository.
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Git branch (defaults to 'main')
 * @returns Full raw GitHub URL for manifest.json
 */
export function buildManifestUrl(
  owner: string,
  repo: string,
  branch = "main"
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/manifest.json`;
}

/**
 * Default data source for the demo application.
 *
 * Points to the MyPlausibleMe repository's retro-games collection.
 */
export const defaultDataSource: GitHubRawConfig = {
  owner: "REPPL",
  repo: "MyPlausibleMe",
  collection: "retro-games",
  branch: "main",
};

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
