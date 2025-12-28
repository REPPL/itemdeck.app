/**
 * Provider registry and URL builder.
 *
 * Loads provider configurations and builds collection URLs from parameters.
 */

import ghProvider from "./gh.json";
import type { Provider } from "./types";

// Provider registry
const providers: Record<string, Provider> = {
  gh: ghProvider as Provider,
  // Future: gitlab, bitbucket, self-hosted
};

/**
 * Get a provider by ID.
 *
 * @param id - Provider ID (e.g., "gh")
 * @returns Provider configuration or undefined
 */
export function getProvider(id: string): Provider | undefined {
  return providers[id];
}

/**
 * Get all registered providers.
 *
 * @returns Array of all providers
 */
export function getAllProviders(): Provider[] {
  return Object.values(providers);
}

/**
 * Check if a provider exists.
 *
 * @param id - Provider ID
 * @returns True if provider exists
 */
export function hasProvider(id: string): boolean {
  return id in providers;
}

/**
 * Build a collection URL from provider and parameters.
 *
 * @param providerId - Provider ID (e.g., "gh")
 * @param params - URL parameters
 * @returns Full CDN URL or null if invalid
 *
 * @example
 * buildCollectionUrl("gh", { u: "REPPL", collection: "commercials" })
 * // Returns: https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/commercials
 */
export function buildCollectionUrl(
  providerId: string,
  params: Record<string, string>
): string | null {
  const provider = getProvider(providerId);
  if (!provider) return null;

  // Validate required params
  for (const required of provider.params.required) {
    if (!params[required]) {
      console.warn(`Missing required parameter "${required}" for provider "${providerId}"`);
      return null;
    }
  }

  // Build URL from pattern
  let url = `${provider.cdn.baseUrl}/${provider.cdn.pattern}`;

  // Replace all placeholders
  for (const [urlParam, placeholder] of Object.entries(provider.params.mapping)) {
    const value = params[urlParam] ?? provider.defaults[placeholder];
    if (value) {
      url = url.replace(`{${placeholder}}`, value);
    }
  }

  // Also replace any defaults that weren't mapped from params
  for (const [placeholder, defaultValue] of Object.entries(provider.defaults)) {
    url = url.replace(`{${placeholder}}`, defaultValue);
  }

  return url;
}

/**
 * Parse URL path and search params to extract provider and params.
 *
 * @param pathname - URL pathname (e.g., "/gh")
 * @param searchParams - URL search params
 * @returns Provider ID and params, or null if not a provider URL
 *
 * @example
 * parseProviderUrl("/gh", new URLSearchParams("u=REPPL&collection=commercials"))
 * // Returns: { providerId: "gh", params: { u: "REPPL", collection: "commercials" } }
 */
export function parseProviderUrl(
  pathname: string,
  searchParams: URLSearchParams
): { providerId: string; params: Record<string, string> } | null {
  // Extract provider ID from pathname (e.g., "/gh" -> "gh")
  const pathSegments = pathname.split("/").filter(Boolean);
  if (pathSegments.length !== 1) return null;

  const providerId = pathSegments[0];
  if (!providerId || !hasProvider(providerId)) return null;

  // Extract all params from search string
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return { providerId, params };
}

/**
 * Validate provider parameters.
 *
 * @param providerId - Provider ID
 * @param params - Parameters to validate
 * @returns Validation result with missing params if invalid
 */
export function validateProviderParams(
  providerId: string,
  params: Record<string, string>
): { valid: boolean; missing: string[] } {
  const provider = getProvider(providerId);
  if (!provider) {
    return { valid: false, missing: [] };
  }

  const missing: string[] = [];
  for (const required of provider.params.required) {
    if (!params[required]) {
      missing.push(required);
    }
  }

  return { valid: missing.length === 0, missing };
}

export type { Provider } from "./types";
