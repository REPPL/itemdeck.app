/**
 * Update checker service.
 *
 * Checks remote sources for updates by comparing timestamps.
 * For GitHub sources, uses the GitHub API to check the last commit date.
 */

import type { Source } from "@/stores/sourceStore";

/**
 * Result of checking for updates.
 */
export interface UpdateCheckResult {
  /** Whether an update is available */
  hasUpdate: boolean;

  /** Remote timestamp (last modified) */
  remoteTimestamp?: number;

  /** Local cache timestamp */
  localTimestamp?: number;

  /** Error message if check failed */
  error?: string;

  /** When this check was performed */
  checkedAt: Date;
}

/**
 * GitHub API response for commits.
 */
interface GitHubCommitResponse {
  sha: string;
  commit: {
    committer: {
      date: string;
    };
  };
}

/**
 * Parsed GitHub URL information.
 */
interface GitHubUrlInfo {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

/**
 * Parse GitHub information from a jsdelivr CDN URL.
 *
 * @param url - jsdelivr CDN URL
 * @returns GitHub owner, repo, and path, or null if not a GitHub URL
 */
function parseGitHubUrl(url: string): GitHubUrlInfo | null {
  // Match jsdelivr GitHub pattern:
  // https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}
  const jsdelivrRegex =
    /^https?:\/\/cdn\.jsdelivr\.net\/gh\/([^/]+)\/([^@]+)@([^/]+)\/(.+)$/;
  const jsdelivrMatch = jsdelivrRegex.exec(url);

  if (jsdelivrMatch) {
    const [, owner, repo, branch, path] = jsdelivrMatch;
    if (owner && repo && branch && path) {
      return { owner, repo, branch, path };
    }
  }

  // Match raw GitHub URL:
  // https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
  const rawRegex =
    /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/;
  const rawMatch = rawRegex.exec(url);

  if (rawMatch) {
    const [, owner, repo, branch, path] = rawMatch;
    if (owner && repo && branch && path) {
      return { owner, repo, branch, path };
    }
  }

  return null;
}

/**
 * Get the last commit timestamp for a GitHub repository path.
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param path - Path to check (folder or file)
 * @returns Timestamp of last commit, or null if failed
 */
async function getGitHubLastCommit(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<number | null> {
  try {
    // Use GitHub API to get commits for the specific path
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&path=${path}&per_page=1`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`GitHub API returned ${String(response.status)} for ${apiUrl}`);
      return null;
    }

    const commits = (await response.json()) as GitHubCommitResponse[];

    if (commits.length === 0) {
      return null;
    }

    const lastCommit = commits[0];
    if (lastCommit?.commit.committer.date) {
      return new Date(lastCommit.commit.committer.date).getTime();
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch GitHub commit info:", error);
    return null;
  }
}

/**
 * Get the last modified timestamp using HEAD request.
 *
 * @param url - URL to check
 * @returns Last-Modified timestamp, or null if not available
 */
async function getLastModifiedHeader(url: string): Promise<number | null> {
  try {
    // Construct the collection.json URL
    const collectionUrl = url.endsWith("/")
      ? `${url}collection.json`
      : `${url}/collection.json`;

    const response = await fetch(collectionUrl, {
      method: "HEAD",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const lastModified = response.headers.get("Last-Modified");
    if (lastModified) {
      return new Date(lastModified).getTime();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a source has updates available.
 *
 * For GitHub sources (jsdelivr CDN), checks the GitHub API for the last commit.
 * For other sources, checks the Last-Modified header.
 *
 * @param source - Source to check
 * @param localTimestamp - Local cache timestamp (optional)
 * @returns Update check result
 */
export async function checkForUpdates(
  source: Source,
  localTimestamp?: number
): Promise<UpdateCheckResult> {
  const checkedAt = new Date();

  try {
    // Try to parse as GitHub URL
    const githubInfo = parseGitHubUrl(source.url);

    let remoteTimestamp: number | null = null;

    if (githubInfo) {
      // Use GitHub API for more accurate timestamp
      remoteTimestamp = await getGitHubLastCommit(
        githubInfo.owner,
        githubInfo.repo,
        githubInfo.branch,
        githubInfo.path
      );
    }

    // Fall back to Last-Modified header if GitHub API didn't work
    remoteTimestamp = remoteTimestamp ?? (await getLastModifiedHeader(source.url));

    // If we couldn't get a remote timestamp, we can't determine if there's an update
    if (remoteTimestamp === null) {
      return {
        hasUpdate: false,
        localTimestamp,
        checkedAt,
        error: "Could not determine remote timestamp",
      };
    }

    // Compare timestamps
    const hasUpdate = localTimestamp ? remoteTimestamp > localTimestamp : false;

    return {
      hasUpdate,
      remoteTimestamp,
      localTimestamp,
      checkedAt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      hasUpdate: false,
      localTimestamp,
      checkedAt,
      error: errorMessage,
    };
  }
}

/**
 * Check multiple sources for updates.
 *
 * @param sources - Array of sources to check
 * @param localTimestamps - Map of source ID to local cache timestamp
 * @returns Map of source ID to update check result
 */
export async function checkMultipleForUpdates(
  sources: Source[],
  localTimestamps: Map<string, number>
): Promise<Map<string, UpdateCheckResult>> {
  const results = new Map<string, UpdateCheckResult>();

  const checks = sources.map(async (source) => {
    const localTimestamp = localTimestamps.get(source.id);
    const result = await checkForUpdates(source, localTimestamp);
    results.set(source.id, result);
  });

  await Promise.all(checks);

  return results;
}
