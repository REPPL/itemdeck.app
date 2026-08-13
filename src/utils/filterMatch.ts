/**
 * Shared definitions for the search-bar filters.
 *
 * The filter field a card is matched against MUST be the same field the filter
 * options were collected from. Keeping the field names, the option source and
 * the match predicate in one module stops the two sides drifting apart — a past
 * bug where the Platform filter offered `shortTitle` values but matched on the
 * full `categoryTitle`, and the Genre filter listed every genre but matched
 * only each card's first one.
 */

import { resolveFieldPath } from "@/utils/fieldPathResolver";

/** The option group a filter field draws its selectable values from. */
export type FilterOptionsKey = "platforms" | "years" | "genres";

export interface FilterFieldDef {
  /** Field path used both to collect options and to match cards. */
  field: string;
  /** Human-readable chip/dropdown label. */
  label: string;
  /** Which option group in the computed filter options feeds this field. */
  optionsKey: FilterOptionsKey;
}

/**
 * Single source of truth for the filter fields. `field` is what both the
 * option collection and the match predicate resolve, so they cannot diverge.
 */
export const FILTER_FIELD_DEFS: readonly FilterFieldDef[] = [
  { field: "categoryShort", label: "Platform", optionsKey: "platforms" },
  { field: "year", label: "Year", optionsKey: "years" },
  { field: "genres", label: "Genre", optionsKey: "genres" },
] as const;

export interface ActiveFilter {
  field: string;
  values: string[];
}

/**
 * Decide whether a card satisfies an active filter.
 *
 * An array-valued field (e.g. `genres`) matches when any of its members is
 * selected, not only its first element.
 */
export function cardMatchesFilter(
  card: Record<string, unknown>,
  filter: ActiveFilter
): boolean {
  const value = resolveFieldPath(card, filter.field);
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) {
    return value.some((v) => filter.values.includes(String(v)));
  }
  const strValue =
    typeof value === "object"
      ? JSON.stringify(value)
      : String(value as string | number | boolean);
  return filter.values.includes(strValue);
}
