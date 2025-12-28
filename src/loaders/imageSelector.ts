/**
 * Image selector for v1/v2 schema format.
 *
 * Parses and evaluates image selection expressions.
 * Supports isPrimary flag (v2) and type-based filtering (v1/v2).
 */

import type { Image } from "@/types/image";

/**
 * Image selector expression format:
 * - `images[0]` - First image by index
 * - `images[type=cover]` - All images of type "cover"
 * - `images[type=cover][0]` - First cover image
 * - `images[isPrimary=true]` - Image marked as primary (v2)
 * - `images[isPrimary=true][0] ?? images[type=cover][0] ?? images[0]` - Primary or cover or first
 */

/**
 * Parse token for image selection.
 */
interface SelectToken {
  type: "index" | "filter" | "fallback";
  value: string | number | boolean;
  filterField?: string;
}

/**
 * Parse an image selection expression into tokens.
 *
 * @param expression - Expression to parse
 * @returns Array of tokens
 */
function parseExpression(expression: string): SelectToken[][] {
  // Split by fallback operator
  const parts = expression.split("??").map((p) => p.trim());

  return parts.map((part) => {
    const tokens: SelectToken[] = [];

    // Match bracket expressions like [0] or [type=cover]
    const bracketRegex = /\[([^\]]+)\]/g;
    let match;

    while ((match = bracketRegex.exec(part)) !== null) {
      const content = match[1]?.trim();
      if (!content) continue;

      // Check if it's a filter (contains =)
      if (content.includes("=")) {
        const parts = content.split("=").map((s) => s.trim());
        const field = parts[0] ?? "";
        const rawValue = parts[1] ?? "";

        // Parse boolean values for isPrimary filter
        let value: string | boolean = rawValue;
        if (rawValue === "true") {
          value = true;
        } else if (rawValue === "false") {
          value = false;
        }

        tokens.push({
          type: "filter",
          value,
          filterField: field,
        });
      } else {
        // It's an index
        const index = parseInt(content, 10);
        if (!Number.isNaN(index)) {
          tokens.push({
            type: "index",
            value: index,
          });
        }
      }
    }

    return tokens;
  });
}

/**
 * Apply tokens to an array of images.
 *
 * @param images - Array of images to select from
 * @param tokens - Selection tokens to apply
 * @returns Selected images
 */
function applyTokens(images: Image[], tokens: SelectToken[]): Image[] {
  let result = [...images];

  for (const token of tokens) {
    if (result.length === 0) {
      break;
    }

    switch (token.type) {
      case "filter": {
        const field = token.filterField;
        const value = token.value;

        if (field && value) {
          result = result.filter((img) => {
            const imgValue = img[field as keyof Image];
            return imgValue === value;
          });
        }
        break;
      }

      case "index": {
        const index = token.value as number;
        if (index >= 0 && index < result.length) {
          const item = result[index];
          result = item ? [item] : [];
        } else {
          result = [];
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Select images using an expression.
 *
 * @param images - Array of images to select from
 * @param expression - Selection expression
 * @returns Array of selected images
 *
 * @example
 * ```ts
 * const images = [
 *   { url: "cover.jpg", type: "cover" },
 *   { url: "screenshot.jpg", type: "screenshot" },
 * ];
 *
 * selectImages(images, "images[type=cover]");
 * // Returns [{ url: "cover.jpg", type: "cover" }]
 *
 * selectImages(images, "images[0]");
 * // Returns [{ url: "cover.jpg", type: "cover" }]
 * ```
 */
export function selectImages(images: Image[], expression: string): Image[] {
  if (images.length === 0) {
    return [];
  }

  const tokenGroups = parseExpression(expression);

  // Try each fallback group in order
  for (const tokens of tokenGroups) {
    const result = applyTokens(images, tokens);
    if (result.length > 0) {
      return result;
    }
  }

  return [];
}

/**
 * Select a single image using an expression.
 *
 * @param images - Array of images to select from
 * @param expression - Selection expression
 * @returns Selected image or undefined
 *
 * @example
 * ```ts
 * const images = [
 *   { url: "cover.jpg", type: "cover" },
 *   { url: "screenshot.jpg", type: "screenshot" },
 * ];
 *
 * selectImage(images, "images[type=cover][0] ?? images[0]");
 * // Returns { url: "cover.jpg", type: "cover" }
 * ```
 */
export function selectImage(
  images: Image[],
  expression: string
): Image | undefined {
  const result = selectImages(images, expression);
  return result[0];
}

/**
 * Get the primary image from an entity.
 *
 * Priority (v2):
 * 1. Image with isPrimary=true
 * 2. Image with type "cover"
 * 3. First image in array
 *
 * Uses the expression "images[isPrimary=true][0] ?? images[type=cover][0] ?? images[0]" by default.
 *
 * @param images - Array of images
 * @param preferredExpression - Optional custom expression
 * @returns Primary image or undefined
 */
export function getPrimaryImage(
  images: Image[] | undefined,
  preferredExpression?: string
): Image | undefined {
  if (!images || images.length === 0) {
    return undefined;
  }

  const expression =
    preferredExpression ?? "images[isPrimary=true][0] ?? images[type=cover][0] ?? images[0]";

  return selectImage(images, expression);
}

/**
 * Get the URL of the primary image.
 *
 * @param images - Array of images
 * @param preferredExpression - Optional custom expression
 * @param fallbackUrl - URL to use if no image is found
 * @returns Image URL
 */
export function getPrimaryImageUrl(
  images: Image[] | undefined,
  preferredExpression?: string,
  fallbackUrl?: string
): string {
  const image = getPrimaryImage(images, preferredExpression);
  return image?.url ?? fallbackUrl ?? "";
}

/**
 * Check if a string is a valid absolute URL.
 */
function isValidUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Get all image URLs from an entity.
 *
 * Handles various data formats:
 * - Image objects: { url: "..." }
 * - Plain string URLs: "https://..."
 * - Mixed arrays of both
 *
 * Only returns valid absolute URLs (http/https).
 * Invalid or relative URLs are filtered out.
 *
 * @param images - Array of images or URLs
 * @returns Array of URLs
 */
export function getImageUrls(images: Image[] | undefined): string[] {
  if (!images) {
    return [];
  }

  return images
    .map((img) => {
      // Handle plain string URLs
      if (typeof img === "string") {
        return isValidUrl(img) ? img : null;
      }
      // Handle Image objects with url property
      if (img && typeof img === "object" && typeof img.url === "string") {
        return isValidUrl(img.url) ? img.url : null;
      }
      // Skip invalid entries
      return null;
    })
    .filter((url): url is string => url !== null);
}

/**
 * Get the logo URL from an entity's images.
 *
 * @param images - Array of images
 * @returns Logo URL or undefined
 */
export function getLogoUrl(images: Image[] | undefined): string | undefined {
  if (!images || images.length === 0) {
    return undefined;
  }

  const logoImage = selectImage(images, "images[type=logo][0]");
  return logoImage?.url;
}
