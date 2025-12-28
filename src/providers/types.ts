/**
 * Provider types for collection URL building.
 *
 * Providers define how to construct URLs for different hosting platforms.
 */

/**
 * CDN configuration for a provider.
 */
export interface ProviderCdn {
  /** Base URL of the CDN */
  baseUrl: string;
  /** URL pattern with placeholders like {user}, {repo}, etc. */
  pattern: string;
}

/**
 * Provider parameter configuration.
 */
export interface ProviderParams {
  /** Required URL parameters */
  required: string[];
  /** Optional URL parameters */
  optional: string[];
  /** Mapping from URL param names to pattern placeholders */
  mapping: Record<string, string>;
}

/**
 * Provider configuration.
 */
export interface Provider {
  /** Unique provider ID (e.g., "gh" for GitHub) */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** CDN configuration */
  cdn: ProviderCdn;
  /** Default values for pattern placeholders */
  defaults: Record<string, string>;
  /** Parameter configuration */
  params: ProviderParams;
}
