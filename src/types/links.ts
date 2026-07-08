/**
 * Link type definitions for the v2 schema.
 *
 * Supports structured detail URLs with source metadata.
 */

import { safeExternalUrl } from "@/utils/safeUrl";

/**
 * Structured detail link with source metadata.
 *
 * Represents a link to external information about an entity.
 */
export interface DetailLink {
  /** The URL to the external resource */
  url: string;

  /** Source name (e.g., "Wikipedia", "MobyGames") */
  source?: string;

  /** Custom label for the link (defaults to source name) */
  label?: string;

  /** Whether this is the primary/canonical link */
  isPrimary?: boolean;
}

/**
 * Detail URLs type - string, single link, or array of links.
 */
export type DetailUrls = string | DetailLink | DetailLink[];

/**
 * Type guard to check if a value is a DetailLink object.
 */
export function isDetailLink(value: unknown): value is DetailLink {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.url === "string";
}

/**
 * Normalise detail URLs to an array of DetailLink objects.
 *
 * Links whose URL fails safeExternalUrl validation (e.g. javascript:
 * or data: schemes) are dropped, so collection-supplied links are
 * sanitised at this choke point.
 *
 * @param urls - String URL, single DetailLink, or array
 * @returns Array of DetailLink objects with safe URLs
 */
export function normaliseDetailUrls(
  urls: DetailUrls | undefined | null
): DetailLink[] {
  if (!urls) {
    return [];
  }

  const links: DetailLink[] =
    typeof urls === "string"
      ? [{ url: urls }]
      : Array.isArray(urls)
        ? urls
        : [urls];

  return links.filter((link) => safeExternalUrl(link.url) !== null);
}

/**
 * Get the primary link from an array of detail links.
 *
 * Returns the first link marked as primary, or the first link if none is primary.
 *
 * @param links - Array of DetailLink objects
 * @returns Primary DetailLink or undefined if empty
 */
export function getPrimaryLink(links: DetailLink[]): DetailLink | undefined {
  if (links.length === 0) {
    return undefined;
  }

  const primary = links.find((link) => link.isPrimary);
  return primary ?? links[0];
}

/**
 * Get the display label for a detail link.
 *
 * Uses label if provided, falls back to source, then "View Source".
 *
 * @param link - DetailLink to get label for
 * @returns Display label string
 */
export function getLinkLabel(link: DetailLink): string {
  return link.label ?? link.source ?? "View Source";
}
