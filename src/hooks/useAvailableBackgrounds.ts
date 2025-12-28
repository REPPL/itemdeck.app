/**
 * Hook to filter available background options based on collection data.
 *
 * Examines the loaded collection to determine which logo-based backgrounds
 * are available (e.g., "Platform Logo" only shows if cards have logoUrl field).
 *
 * Built-in patterns and app logo are always available.
 */

import { useMemo } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { resolveFieldPath } from "@/utils/fieldPathResolver";
import {
  BUILT_IN_BACKGROUNDS,
  COLLECTION_BACKGROUNDS,
  APP_LOGO_BACKGROUND,
  type BackgroundOption,
} from "@/utils/fieldPathResolver";

/**
 * Check if any card in the collection has a valid value for a field path.
 *
 * @param cards - Collection cards
 * @param fieldPath - Field path to check (e.g., "logoUrl", "images[type=logo][0].url")
 * @returns Whether at least one card has this field with a non-empty value
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
 *
 * @returns Object with background options categorised by type
 */
export function useAvailableBackgrounds(): {
  builtIn: BackgroundOption[];
  collection: BackgroundOption[];
  app: BackgroundOption;
  all: BackgroundOption[];
} {
  const { cards } = useCollectionData();

  return useMemo(() => {
    // Built-in patterns are always available
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
