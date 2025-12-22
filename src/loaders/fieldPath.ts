/**
 * Field path parser for v1 schema format.
 *
 * Parses and evaluates dot-notation field paths.
 */

import type { Entity, ResolvedEntity } from "@/types/schema";
import type { Image } from "@/types/image";

/**
 * Path segment types.
 */
interface PathSegment {
  type: "property" | "index" | "filter";
  value: string | number;
  filterField?: string;
}

/**
 * Parse a field path into segments.
 *
 * @param path - Dot-notation path (e.g., "platform.title" or "images[0].url")
 * @returns Array of path segments
 */
function parsePath(path: string): PathSegment[] {
  const segments: PathSegment[] = [];
  let current = path;

  while (current.length > 0) {
    // Check for bracket notation at start
    if (current.startsWith("[")) {
      const endBracket = current.indexOf("]");
      if (endBracket === -1) {
        break;
      }

      const content = current.slice(1, endBracket);

      // Check if it's a filter or index
      if (content.includes("=")) {
        const parts = content.split("=").map((s) => s.trim());
        const field = parts[0] ?? "";
        const value = parts[1] ?? "";
        segments.push({
          type: "filter",
          value,
          filterField: field,
        });
      } else {
        const index = parseInt(content, 10);
        if (!Number.isNaN(index)) {
          segments.push({
            type: "index",
            value: index,
          });
        }
      }

      current = current.slice(endBracket + 1);

      // Skip leading dot
      if (current.startsWith(".")) {
        current = current.slice(1);
      }

      continue;
    }

    // Find next separator (. or [)
    let nextDot = current.indexOf(".");
    let nextBracket = current.indexOf("[");

    let endIdx: number;
    if (nextDot === -1 && nextBracket === -1) {
      endIdx = current.length;
    } else if (nextDot === -1) {
      endIdx = nextBracket;
    } else if (nextBracket === -1) {
      endIdx = nextDot;
    } else {
      endIdx = Math.min(nextDot, nextBracket);
    }

    const property = current.slice(0, endIdx);
    if (property.length > 0) {
      segments.push({
        type: "property",
        value: property,
      });
    }

    current = current.slice(endIdx);

    // Skip leading dot
    if (current.startsWith(".")) {
      current = current.slice(1);
    }
  }

  return segments;
}

/**
 * Get a value from an entity using a field path.
 *
 * @param entity - Entity to get value from
 * @param path - Dot-notation path
 * @returns Value at the path or undefined
 *
 * @example
 * ```ts
 * const entity = {
 *   id: "game-1",
 *   title: "Super Metroid",
 *   platform: "snes",
 *   _resolved: {
 *     platform: { id: "snes", title: "SNES" }
 *   },
 *   images: [{ url: "cover.jpg", type: "cover" }]
 * };
 *
 * getFieldValue(entity, "title"); // "Super Metroid"
 * getFieldValue(entity, "platform.title"); // "SNES"
 * getFieldValue(entity, "images[0].url"); // "cover.jpg"
 * ```
 */
export function getFieldValue(
  entity: Entity | ResolvedEntity,
  path: string
): unknown {
  const segments = parsePath(path);
  let current: unknown = entity;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    switch (segment.type) {
      case "property": {
        const prop = segment.value as string;

        // Check resolved relationships first
        if (
          typeof current === "object" &&
          "_resolved" in (current as object)
        ) {
          const resolved = (current as ResolvedEntity)._resolved;
          if (resolved && prop in resolved) {
            current = resolved[prop];
            break;
          }
        }

        // Regular property access
        if (typeof current === "object" && current !== null) {
          current = (current as Record<string, unknown>)[prop];
        } else {
          return undefined;
        }
        break;
      }

      case "index": {
        if (Array.isArray(current)) {
          const index = segment.value as number;
          current = current[index];
        } else {
          return undefined;
        }
        break;
      }

      case "filter": {
        if (Array.isArray(current)) {
          const field = segment.filterField;
          const value = segment.value;
          current = current.filter((item) => {
            if (typeof item === "object" && item !== null && field) {
              return (item as Record<string, unknown>)[field] === value;
            }
            return false;
          });
        } else {
          return undefined;
        }
        break;
      }
    }
  }

  return current;
}

/**
 * Get a string value from an entity using a field path.
 *
 * @param entity - Entity to get value from
 * @param path - Dot-notation path
 * @param fallback - Fallback value if not found or not a string
 * @returns String value or fallback
 */
export function getStringValue(
  entity: Entity | ResolvedEntity,
  path: string,
  fallback: string = ""
): string {
  const value = getFieldValue(entity, path);

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

/**
 * Get a number value from an entity using a field path.
 *
 * @param entity - Entity to get value from
 * @param path - Dot-notation path
 * @param fallback - Fallback value if not found or not a number
 * @returns Number value or fallback
 */
export function getNumberValue(
  entity: Entity | ResolvedEntity,
  path: string,
  fallback: number | null = null
): number | null {
  const value = getFieldValue(entity, path);

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

/**
 * Get an image array from an entity using a field path.
 *
 * @param entity - Entity to get images from
 * @param path - Path to images (default: "images")
 * @returns Array of images or empty array
 */
export function getImagesValue(
  entity: Entity | ResolvedEntity,
  path: string = "images"
): Image[] {
  const value = getFieldValue(entity, path);

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Image =>
        typeof item === "object" && item !== null && "url" in item
    );
  }

  return [];
}
