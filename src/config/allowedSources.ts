/**
 * Allowed external data sources for itemdeck.
 *
 * Security: Only fetch from domains on this allowlist.
 * To add new providers, update this file and redeploy.
 */

/** CDN domains that serve files with CORS headers */
export const ALLOWED_CDN_DOMAINS = [
  'cdn.jsdelivr.net',
  'cdn.statically.io',
] as const;

/** Input domains users can paste URLs from (converted to CDN URLs) */
export const ALLOWED_INPUT_DOMAINS = [
  'raw.githubusercontent.com',
  'github.com',
  'gitlab.com',
] as const;

/** Supported provider codes for short-form URLs */
export const ALLOWED_PROVIDERS = ['gh', 'gl'] as const;

export type Provider = (typeof ALLOWED_PROVIDERS)[number];
export type CdnDomain = (typeof ALLOWED_CDN_DOMAINS)[number];
export type InputDomain = (typeof ALLOWED_INPUT_DOMAINS)[number];

/** Default repository name when not specified in short-form URL */
export const DEFAULT_REPO = 'MyPlausibleMe';

/**
 * Check if a CDN URL is on the allowlist.
 */
export function isAllowedCdnSource(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_CDN_DOMAINS.some((domain) => hostname === domain);
  } catch {
    return false;
  }
}

/**
 * Check if an input URL (GitHub, GitLab, etc.) is on the allowlist.
 */
export function isAllowedInputSource(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_INPUT_DOMAINS.some((domain) => hostname === domain);
  } catch {
    return false;
  }
}

/**
 * Check if a provider code is supported.
 */
export function isAllowedProvider(provider: string): provider is Provider {
  return ALLOWED_PROVIDERS.includes(provider as Provider);
}

/**
 * Sentinel base origin used to detect same-origin relative paths.
 * Relative paths resolve against it; absolute URLs keep their own origin.
 */
const SAME_ORIGIN_SENTINEL = "https://itemdeck-same-origin.invalid";

/**
 * Check whether a collection source path may be fetched.
 *
 * Same-origin relative paths are always allowed. Absolute URLs must use
 * https and point at a host on the CDN or input allowlist. Everything
 * else (unknown hosts, http, exotic schemes, unparseable input) is refused.
 */
export function isAllowedCollectionSource(path: string): boolean {
  let url: URL;
  try {
    url = new URL(path, SAME_ORIGIN_SENTINEL);
  } catch {
    return false;
  }

  // Relative paths resolve against the sentinel: same-origin, allowed.
  if (url.origin === SAME_ORIGIN_SENTINEL) {
    return true;
  }

  if (url.protocol !== "https:") {
    return false;
  }

  const { hostname } = url;
  return (
    ALLOWED_CDN_DOMAINS.some((domain) => hostname === domain) ||
    ALLOWED_INPUT_DOMAINS.some((domain) => hostname === domain)
  );
}
