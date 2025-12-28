/**
 * Media type definitions and helpers.
 *
 * Utilities for detecting and handling different media types
 * (images, YouTube videos) in the gallery.
 *
 * @module types/media
 */

/**
 * Media types supported by the gallery.
 */
export type MediaType = "image" | "youtube";

/**
 * Parsed media item.
 */
export interface MediaItem {
  /** Original URL */
  url: string;
  /** Detected media type */
  type: MediaType;
  /** YouTube video ID (if YouTube) */
  videoId?: string;
}

/**
 * YouTube URL patterns.
 */
const YOUTUBE_PATTERNS = [
  // youtube.com/watch?v=VIDEO_ID
  /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
  // youtu.be/VIDEO_ID
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  // youtube.com/embed/VIDEO_ID
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
] as const;

/**
 * Check if a URL is a YouTube video URL.
 *
 * @param url - URL to check
 * @returns True if YouTube URL
 *
 * @example
 * ```ts
 * isYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"); // true
 * isYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"); // true
 * isYouTubeUrl("https://example.com/image.jpg"); // false
 * ```
 */
export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Extract YouTube video ID from a URL.
 *
 * @param url - YouTube URL
 * @returns Video ID or null if not a valid YouTube URL
 *
 * @example
 * ```ts
 * extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"); // "dQw4w9WgXcQ"
 * extractYouTubeId("https://youtu.be/dQw4w9WgXcQ"); // "dQw4w9WgXcQ"
 * extractYouTubeId("https://example.com/image.jpg"); // null
 * ```
 */
export function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = pattern.exec(url);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Get YouTube thumbnail URL for a video.
 *
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality
 * @returns Thumbnail URL
 *
 * @example
 * ```ts
 * getYouTubeThumbnail("dQw4w9WgXcQ", "maxresdefault");
 * // "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
 * ```
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: "default" | "mqdefault" | "hqdefault" | "sddefault" | "maxresdefault" = "hqdefault"
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Get YouTube embed URL for a video.
 *
 * @param videoId - YouTube video ID
 * @param options - Embed options
 * @returns Embed URL
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    modestbranding?: boolean;
  } = {}
): string {
  const params = new URLSearchParams();

  if (options.autoplay) {
    params.set("autoplay", "1");
  }
  if (options.modestbranding !== false) {
    params.set("modestbranding", "1");
  }

  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Parse a URL into a MediaItem.
 *
 * @param url - URL to parse
 * @returns Parsed media item
 */
export function parseMediaUrl(url: string): MediaItem {
  const videoId = extractYouTubeId(url);

  if (videoId) {
    return {
      url,
      type: "youtube",
      videoId,
    };
  }

  return {
    url,
    type: "image",
  };
}

/**
 * Parse an array of URLs into MediaItems.
 *
 * @param urls - URLs to parse
 * @returns Parsed media items
 */
export function parseMediaUrls(urls: string[]): MediaItem[] {
  return urls.map(parseMediaUrl);
}
