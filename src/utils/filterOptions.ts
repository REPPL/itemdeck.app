/**
 * Bounds for the filter option lists offered by the search bar.
 *
 * Filter values are derived from untrusted collection data, and the filter
 * dropdown renders one checkbox per option with no virtualisation.
 */

/**
 * Upper bound on the options offered for one filter field.
 *
 * Card-derived options (platform, year) are one value per card and so are
 * already bounded by the collection loader's entity cap, but a per-entity
 * array such as `genres` is uncapped, leaving the option list with no
 * ceiling. The dropdown mounts every option and re-reconciles the whole list
 * whenever a filter is toggled, so an unbounded list freezes the tab two
 * clicks after load. Real collections use tens of values per field.
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
export function capFilterOptions(options: string[], field: string): string[] {
  if (options.length <= MAX_FILTER_OPTIONS) {
    return options;
  }

  console.warn(
    `Collection lists ${String(options.length)} distinct ${field} values; offering the first ${String(MAX_FILTER_OPTIONS)} as filters.`
  );

  return options.slice(0, MAX_FILTER_OPTIONS);
}
