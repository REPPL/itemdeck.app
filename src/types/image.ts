/**
 * Image type definitions for the v2 schema.
 *
 * Provides structured image objects with attribution support,
 * including isPrimary flag and enhanced source links.
 */

/**
 * Image type identifiers.
 */
export type ImageType =
  | "cover"
  | "screenshot"
  | "title-screen"
  | "logo"
  | "promotional"
  | "fan-art"
  | "photo"
  | "artwork";

/**
 * Attribution information for an image.
 *
 * Tracks source, author, and licensing for proper credit.
 */
export interface Attribution {
  /** Source of the image (e.g., "Wikimedia Commons") */
  source?: string;

  /** Direct URL to the source page (e.g., Wikipedia File: page) */
  sourceUrl?: string;

  /** Author or creator of the image */
  author?: string;

  /** Licence under which the image is used (e.g., "CC BY-SA 4.0", "fair-use") */
  licence?: string;

  /** URL to the licence text */
  licenceUrl?: string;

  /**
   * @deprecated Use sourceUrl instead. Kept for backward compatibility.
   */
  url?: string;
}

/**
 * Structured image object.
 *
 * Represents an image with metadata and attribution.
 */
export interface Image {
  /** URL to the image */
  url: string;

  /** Type of image (cover, screenshot, etc.) */
  type?: ImageType;

  /** Whether this is the primary/preferred image for display */
  isPrimary?: boolean;

  /** Accessibility text describing the image */
  alt?: string;

  /** Image width in pixels */
  width?: number;

  /** Image height in pixels */
  height?: number;

  /** Attribution information */
  attribution?: Attribution;
}

/**
 * Get the primary image from an array.
 *
 * Priority:
 * 1. Image with isPrimary=true
 * 2. Image with type "cover" or "boxart"
 * 3. First image in array
 *
 * @param images - Array of images
 * @returns Primary image or undefined if empty
 */
export function getPrimaryImage(images: Image[]): Image | undefined {
  if (images.length === 0) {
    return undefined;
  }

  // 1. Explicit isPrimary flag
  const primary = images.find((img) => img.isPrimary);
  if (primary) {
    return primary;
  }

  // 2. Type-based fallback (cover or boxart)
  const cover = images.find(
    (img) => img.type === "cover" || img.type === "artwork"
  );
  if (cover) {
    return cover;
  }

  // 3. First image
  return images[0];
}

/**
 * Type guard to check if a value is a valid Image.
 */
export function isImage(value: unknown): value is Image {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.url === "string";
}

/**
 * Type guard to check if a value is a valid Attribution.
 */
export function isAttribution(value: unknown): value is Attribution {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return true;
}
