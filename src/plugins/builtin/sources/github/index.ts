/**
 * GitHub source plugin entry point.
 *
 * Re-exports the existing GitHub discovery implementation.
 *
 * @plugin org.itemdeck.source-github
 */

import manifest from "./manifest.json";
import sourceConfig from "./gh.json";
import {
  parseJsDelivrUrl,
  discoverEntitiesViaGitHub,
  isJsDelivrGitHubUrl,
} from "@/loaders/githubDiscovery";
import type { SourceContribution } from "@/plugins/schemas/contributions/source";

/**
 * Source contribution for GitHub.
 * Note: The manifest uses a slightly different structure than SourceContribution.
 * This is a known mismatch that will be resolved in schema alignment work.
 */
export const githubSourceContribution: SourceContribution =
  manifest.contributes.sources[0] as unknown as SourceContribution;

/**
 * Plugin manifest.
 */
export { manifest };

/**
 * Source configuration.
 */
export { sourceConfig };

/**
 * Re-export discovery utilities.
 */
export { parseJsDelivrUrl, discoverEntitiesViaGitHub, isJsDelivrGitHubUrl };

/**
 * GitHub source configuration.
 */
export interface GitHubSourceConfig {
  /** GitHub username or organisation */
  owner: string;
  /** Repository name */
  repo?: string;
  /** Branch name */
  branch?: string;
  /** Path to collection within repository */
  path?: string;
}

/**
 * Build a jsDelivr CDN URL from configuration.
 *
 * @param config - GitHub source configuration
 * @returns jsDelivr CDN URL
 */
export function buildCdnUrl(config: GitHubSourceConfig): string {
  const { owner, repo = "collections", branch = "main", path = "" } = config;
  const basePath = path ? `/${path}` : "";
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}${basePath}`;
}

/**
 * Load collection from GitHub.
 *
 * @param config - GitHub source configuration
 * @returns Collection data
 */
export async function loadCollection(config: GitHubSourceConfig): Promise<unknown> {
  const cdnUrl = buildCdnUrl(config);
  const indexUrl = `${cdnUrl}/index.json`;

  const response = await fetch(indexUrl);

  if (!response.ok) {
    // Try auto-discovery if index.json doesn't exist
    const entities = await discoverEntitiesViaGitHub(cdnUrl);

    if (entities) {
      return {
        source: "github",
        config,
        entities,
        discovered: true,
      };
    }

    throw new Error(`Failed to load collection from ${cdnUrl}`);
  }

  return response.json();
}

/**
 * Default export for plugin loader.
 */
export default {
  manifest,
  sources: [githubSourceContribution],
  config: sourceConfig,
  loadCollection,
};
