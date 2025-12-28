/**
 * Hook to detect available grouping fields from collection data.
 *
 * Examines the loaded collection cards to determine which grouping
 * options are actually available (e.g., only show "Platform" if
 * cards have categoryTitle, only show "Genre" if cards have genres).
 */

import { useMemo } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { resolveFieldPath } from "@/utils/fieldPathResolver";
import type { FieldOption } from "@/utils/fieldPathResolver";

/**
 * All possible grouping options with their field paths.
 *
 * This is the superset - actual availability depends on collection data.
 */
const ALL_GROUP_OPTIONS: FieldOption[] = [
  { value: "none", label: "None" },
  { value: "categoryTitle", label: "Platform" },
  { value: "year", label: "Year" },
  { value: "decade", label: "Decade" },
  { value: "genres[0]", label: "Genre" },
];

/**
 * Check if a field path exists in at least one card.
 *
 * @param cards - Collection cards to check
 * @param fieldPath - Field path to look for
 * @returns True if at least one card has a non-null/undefined value
 */
function fieldExistsInCards(
  cards: Record<string, unknown>[],
  fieldPath: string
): boolean {
  // Special cases that are always available
  if (fieldPath === "none") return true;
  if (fieldPath === "decade") {
    // Decade is derived from year - available if year exists
    return cards.some((card) => {
      const year = resolveFieldPath(card, "year");
      return year !== undefined && year !== null;
    });
  }

  // Check if any card has this field
  return cards.some((card) => {
    const value = resolveFieldPath(card, fieldPath);
    return value !== undefined && value !== null && value !== "";
  });
}

/**
 * Hook to get available grouping field options based on collection data.
 *
 * Only returns options for fields that actually exist in the current
 * collection's cards. "None" is always available.
 *
 * @returns Array of available FieldOption objects
 *
 * @example
 * ```tsx
 * function ViewPopover() {
 *   const groupOptions = useAvailableGroupFields();
 *
 *   return (
 *     <ul>
 *       {groupOptions.map(({ value, label }) => (
 *         <li key={value}>{label}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useAvailableGroupFields(): FieldOption[] {
  const { cards } = useCollectionData();

  return useMemo(() => {
    if (cards.length === 0) {
      // If no cards loaded, only show "None"
      return [{ value: "none", label: "None" }];
    }

    // Filter options based on which fields exist in the data
    return ALL_GROUP_OPTIONS.filter((option) =>
      fieldExistsInCards(cards as Record<string, unknown>[], option.value)
    );
  }, [cards]);
}

export { ALL_GROUP_OPTIONS };
