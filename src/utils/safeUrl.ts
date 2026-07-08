/**
 * URL safety helpers.
 *
 * Collection data is user-supplied, so any URL rendered into an anchor
 * href must be validated to prevent stored XSS via javascript:, data:,
 * or similar script-capable schemes.
 */

/**
 * Protocols allowed in external links.
 *
 * mailto: is allowed deliberately: it cannot execute script in-origin
 * and collections may reasonably link to contact addresses.
 */
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Base used to resolve relative URLs during validation.
 *
 * Relative and protocol-relative URLs inherit http(s) from this base,
 * so they are treated as safe (they cannot introduce a script scheme).
 */
const VALIDATION_BASE = "https://url-validation.invalid/";

/**
 * Validate a URL for use in an anchor href.
 *
 * Returns the trimmed URL when its parsed protocol is http:, https:,
 * or mailto:; returns null for anything else (javascript:, data:,
 * vbscript:, file:, unparseable input, empty strings). The WHATWG URL
 * parser strips ASCII tabs/newlines and lowercases the scheme, so
 * obfuscated payloads like "\tjavascript:" or "JAVASCRIPT:" are caught.
 *
 * @param url - Untrusted URL string (e.g. from collection data)
 * @returns The URL when safe to render as a link, null otherwise
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed === "") {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, VALIDATION_BASE);
  } catch {
    return null;
  }

  return SAFE_PROTOCOLS.has(parsed.protocol) ? trimmed : null;
}
