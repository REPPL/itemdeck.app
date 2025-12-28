/**
 * Hook to discover available background options dynamically.
 *
 * Uses Vite's import.meta.glob to scan the public/backgrounds/ directory
 * and build the list of available background patterns.
 *
 * v0.11.5: Dynamic background discovery.
 */

import { useMemo } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { resolveFieldPath } from "@/utils/fieldPathResolver";
import type { BackgroundOption } from "@/utils/fieldPathResolver";

/**
 * Scan src/assets/backgrounds directory for available images.
 * Vite transforms this at build time to discover all matching files.
 * Files must be in src/assets (not public/) for import.meta.glob to work.
 */
const fullBackgrounds = import.meta.glob<string>("@/assets/backgrounds/full/*.{png,jpg,jpeg,webp,svg}", { eager: true, query: "?url", import: "default" });
const tiledBackgrounds = import.meta.glob<string>("@/assets/backgrounds/tiled/*.{png,jpg,jpeg,webp,svg}", { eager: true, query: "?url", import: "default" });

/**
 * Extract filename without extension for display.
 */
function getPatternName(path: string): string {
  const filename = path.split("/").pop() ?? "";
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
  // Convert "1" to "Pattern 1", "cool-pattern" to "Cool Pattern"
  const readable = nameWithoutExt
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return /^\d+$/.test(nameWithoutExt) ? `Pattern ${nameWithoutExt}` : readable;
}

/**
 * Build background options from glob results.
 */
function buildBackgroundOptions(): BackgroundOption[] {
  const options: BackgroundOption[] = [];

  // Process full backgrounds
  for (const [path, url] of Object.entries(fullBackgrounds)) {
    const name = getPatternName(path);
    options.push({
      value: `full-${path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? ""}`,
      label: `${name} (Full)`,
      type: "full",
      url: url as unknown as string,
    });
  }

  // Process tiled backgrounds
  for (const [path, url] of Object.entries(tiledBackgrounds)) {
    const name = getPatternName(path);
    options.push({
      value: `tiled-${path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? ""}`,
      label: `${name} (Tiled)`,
      type: "tiled",
      url: url as unknown as string,
    });
  }

  return options;
}

// Build static options once at module load
const BUILT_IN_BACKGROUNDS = buildBackgroundOptions();

/**
 * Collection-specific background options (logos from entity data).
 */
const COLLECTION_BACKGROUNDS: BackgroundOption[] = [
  { value: "platform-logo", label: "Platform Logo", type: "logo", fieldPath: "logoUrl" },
  { value: "card-logo", label: "Card Logo", type: "logo", fieldPath: "images[type=logo][0].url" },
];

/**
 * App logo background option.
 */
const APP_LOGO_BACKGROUND: BackgroundOption = {
  value: "app-logo",
  label: "itemdeck App Logo",
  type: "app",
};

/**
 * Check if any card in the collection has a valid value for a field path.
 */
function fieldExistsInCards(
  cards: Record<string, unknown>[],
  fieldPath: string
): boolean {
  if (!fieldPath || fieldPath === "none") {
    return false;
  }

  // Sample first 10 cards for performance
  const sample = cards.slice(0, 10);

  return sample.some((card) => {
    const value = resolveFieldPath(card, fieldPath);
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === "string") {
      return value.trim() !== "";
    }
    return true;
  });
}

/**
 * Returns available background options filtered by collection data.
 * Dynamically discovers backgrounds from public/backgrounds/ directory.
 *
 * @returns Object with background options categorised by type
 */
export function useBackgroundOptions(): {
  builtIn: BackgroundOption[];
  collection: BackgroundOption[];
  app: BackgroundOption;
  all: BackgroundOption[];
} {
  const { cards } = useCollectionData();

  return useMemo(() => {
    // Built-in patterns discovered dynamically
    const builtIn = BUILT_IN_BACKGROUNDS;

    // App logo is always available
    const app = APP_LOGO_BACKGROUND;

    // Filter collection logos based on available data
    let collection: BackgroundOption[] = [];

    if (cards.length > 0) {
      collection = COLLECTION_BACKGROUNDS.filter((option) => {
        if (!option.fieldPath) {
          return false;
        }
        return fieldExistsInCards(cards as Record<string, unknown>[], option.fieldPath);
      });
    }

    // Combine all available options
    const all: BackgroundOption[] = [...builtIn, ...collection, app];

    return { builtIn, collection, app, all };
  }, [cards]);
}

/**
 * Get the field path for a logo background option.
 * Used by Card component to resolve logo URL from entity data.
 *
 * @param optionValue - The background option value (e.g., "platform-logo", "card-logo")
 * @returns The field path to resolve, or undefined if not a logo type
 */
export function getLogoFieldPath(optionValue: string): string | undefined {
  // Check collection logos first
  const collectionOption = COLLECTION_BACKGROUNDS.find((opt) => opt.value === optionValue);
  if (collectionOption?.fieldPath) {
    return collectionOption.fieldPath;
  }

  // App logo or built-in patterns don't have a field path
  return undefined;
}

// Re-export for backwards compatibility
export { BUILT_IN_BACKGROUNDS, COLLECTION_BACKGROUNDS, APP_LOGO_BACKGROUND };
