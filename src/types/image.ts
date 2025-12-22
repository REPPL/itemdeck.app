/**
 * Image type definitions for the v1 schema.
 *
 * Provides structured image objects with attribution support.
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

  /** Author or creator of the image */
  author?: string;

  /** Licence under which the image is used */
  licence?: string;

  /** URL to the original source or licence */
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
