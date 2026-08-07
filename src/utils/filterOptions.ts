/**
 * Bounds for the filter option lists offered by the search bar.
 *
 * Filter values are derived from untrusted collection data, and the filter
 * dropdown renders one checkbox per option with no virtualisation.
 */

/**
 * Upper bound on the options offered for one filter field.
 *
 * The dropdown mounts every option and re-reconciles the whole list whenever
 * a filter is toggled, so an unbounded list freezes the tab two clicks after
 * load. A per-entity array such as `genres` has no ceiling at all, and the
 * card-derived fields are bounded only by the loader's entity cap, which is
 * an order of magnitude beyond anything usable as a filter — so every field
 * gets the same bound. Real collections use tens of values per field.
 */
export const MAX_FILTER_OPTIONS = 1000;

/**
 * Truncate an over-long filter option list, warning when it bites.
 *
 * Mirrors the truncate-and-warn shape of the collection loader's entity
 * caps, so an honest collection that grows past the bound is visible in the
 * console rather than silently trimmed.
 *
 * @param options - Distinct values collected for one filter field
 * @param field - Field name, used in the truncation warning
 * @returns The options, truncated to MAX_FILTER_OPTIONS
 */
export function capFilterOptions<T>(options: T[], field: string): T[] {
  if (options.length <= MAX_FILTER_OPTIONS) {
    return options;
  }

  console.warn(
    `Collection lists ${String(options.length)} distinct ${field} values; offering the first ${String(MAX_FILTER_OPTIONS)} as filters.`
  );

  return options.slice(0, MAX_FILTER_OPTIONS);
}
