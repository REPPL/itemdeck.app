/**
 * Collection settings loader.
 *
 * Fetches and validates settings.json from collection directories.
 * Settings are optional - missing or invalid settings are gracefully ignored.
 */

import type {
  CollectionSettings,
  ForcedSettings,
  DefaultSettings,
} from "@/types/collectionSettings";
import { COLLECTION_SETTINGS_VERSION } from "@/types/collectionSettings";
import { isAllowedCollectionSource } from "@/config/allowedSources";

/**
 * Upper bound on a collection's suggested `maxVisibleCards`.
 *
 * `settings.json` is untrusted and this loader is the only ingress for the
 * key that lacks the positive-integer bound every sibling schema enforces
 * (config, settings export, collection v2). An out-of-range value is written
 * straight into the persisted global settings, so it outlives the collection
 * that supplied it: a value below 1 makes CardGrid discard every card on
 * flip, and a non-finite one serialises to null and does the same after the
 * next reload. Matches the settings-panel stepper's maximum.
 */
const MAX_VISIBLE_CARDS = 10;

/**
 * Upper bound on the number of searchable field paths a collection may set.
 *
 * Search resolves every field on every card for each settled query, so an
 * unbounded list scales that product with attacker-chosen input and freezes
 * the tab. Like `maxVisibleCards`, the value persists globally and is not
 * covered by the forced-settings restore, so it would follow the visitor to
 * every later collection. The built-in default uses three fields.
 */
const MAX_SEARCH_FIELDS = 32;

/**
 * Upper bound on the length of a forced free-text label such as
 * `rankPlaceholderText`.
 *
 * The value is written into persisted global settings and rendered once per
 * card (every unranked card shows the rank placeholder), with no virtualisation
 * — so an unbounded string is amplified by the entity count into a huge layout
 * pass that freezes or OOMs the tab, and it reproduces on reload before the
 * user can reach the settings panel. A short bound covers every real label.
 */
const MAX_LABEL_LENGTH = 120;

/**
 * Load collection settings from a collection directory.
 *
 * @param basePath - Base path to the collection directory
 * @returns Loaded settings or null if not found/invalid
 */
export async function loadCollectionSettings(
  basePath: string
): Promise<CollectionSettings | null> {
  try {
    const settingsUrl = `${basePath}/settings.json`;

    // Defence in depth: never issue an outbound request to an origin outside
    // the allowlist, matching the collection loader. The active basePath can
    // be an arbitrary user-added source, so an un-gated fetch here would leak
    // the visitor's presence to a non-allowlisted origin even when the
    // collection fetch itself is refused. Settings are optional, so a
    // non-allowlisted source is treated the same as a missing file.
    if (!isAllowedCollectionSource(settingsUrl)) {
      return null;
    }

    const response = await fetch(settingsUrl);

    // Settings file is optional - don't fail if missing
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.warn(
        `Invalid content type for settings.json: ${contentType ?? "unknown"}`
      );
      return null;
    }

    const data = (await response.json()) as unknown;
    return validateCollectionSettings(data);
  } catch (error) {
    // Log but don't throw - settings are optional
    console.debug("Could not load collection settings:", error);
    return null;
  }
}

/**
 * Validate collection settings from raw JSON data.
 *
 * @param data - Raw settings data from JSON
 * @returns Validated settings or null if invalid
 */
function validateCollectionSettings(data: unknown): CollectionSettings | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const raw = data as Record<string, unknown>;

  // Check version
  const version = typeof raw.version === "number" ? raw.version : 1;
  if (version > COLLECTION_SETTINGS_VERSION) {
    console.warn(
      `Unsupported settings version: ${String(version)} (expected <= ${String(COLLECTION_SETTINGS_VERSION)})`
    );
    return null;
  }

  const settings: CollectionSettings = {
    version,
  };

  // Validate forced settings
  if (raw.forced && typeof raw.forced === "object") {
    settings.forced = validateForcedSettings(
      raw.forced as Record<string, unknown>
    );
  }

  // Validate default settings
  if (raw.defaults && typeof raw.defaults === "object") {
    settings.defaults = validateDefaultSettings(
      raw.defaults as Record<string, unknown>
    );
  }

  return settings;
}

/**
 * Validate forced settings.
 */
function validateForcedSettings(raw: Record<string, unknown>): ForcedSettings {
  const forced: ForcedSettings = {};

  // defaultCardFace
  if (
    typeof raw.defaultCardFace === "string" &&
    ["front", "back"].includes(raw.defaultCardFace)
  ) {
    forced.defaultCardFace = raw.defaultCardFace as "front" | "back";
  }

  // cardBackDisplay
  if (
    typeof raw.cardBackDisplay === "string" &&
    ["year", "logo", "both", "none"].includes(raw.cardBackDisplay)
  ) {
    forced.cardBackDisplay =
      raw.cardBackDisplay as ForcedSettings["cardBackDisplay"];
  }

  // cardBackStyle — must match the CardBackStyle enum. The previous allowlist
  // ("plain"/"pattern"/"gradient") was stale: it silently dropped every valid
  // forced value and admitted only out-of-enum ones, which then persisted into
  // global settings and made the user's own settings export non-reimportable
  // (the export schema rejects them).
  if (
    typeof raw.cardBackStyle === "string" &&
    ["bitmap", "svg", "colour"].includes(raw.cardBackStyle)
  ) {
    forced.cardBackStyle = raw.cardBackStyle as ForcedSettings["cardBackStyle"];
  }

  // titleDisplayMode — must match the TitleDisplayMode enum (same stale-allowlist
  // bug as cardBackStyle above).
  if (
    typeof raw.titleDisplayMode === "string" &&
    ["truncate", "wrap"].includes(raw.titleDisplayMode)
  ) {
    forced.titleDisplayMode =
      raw.titleDisplayMode as ForcedSettings["titleDisplayMode"];
  }

  // Boolean fields
  if (typeof raw.showRankBadge === "boolean") {
    forced.showRankBadge = raw.showRankBadge;
  }
  if (typeof raw.showDeviceBadge === "boolean") {
    forced.showDeviceBadge = raw.showDeviceBadge;
  }

  // String fields. `rankPlaceholderText` is rendered once per unranked card,
  // so an unbounded value is amplified by the card count; cap the length.
  if (typeof raw.rankPlaceholderText === "string") {
    forced.rankPlaceholderText = raw.rankPlaceholderText.slice(
      0,
      MAX_LABEL_LENGTH
    );
  }

  // Field mapping — validate each value, not just the container. Field paths
  // are later split (e.g. on "??" / ".") during card rendering, so a non-string
  // value from an untrusted settings.json would throw at render time. Because
  // fieldMapping is persisted, a poisoned value would brick the grid across
  // reloads until a manual reset.
  if (raw.fieldMapping && typeof raw.fieldMapping === "object") {
    const rawMapping = raw.fieldMapping as Record<string, unknown>;
    const mapping: NonNullable<ForcedSettings["fieldMapping"]> = {};

    for (const key of [
      "titleField",
      "subtitleField",
      "footerBadgeField",
      "logoField",
      "sortField",
      "topBadgeField",
    ] as const) {
      if (typeof rawMapping[key] === "string") {
        mapping[key] = rawMapping[key];
      }
    }

    if (
      typeof rawMapping.sortDirection === "string" &&
      ["asc", "desc"].includes(rawMapping.sortDirection)
    ) {
      mapping.sortDirection = rawMapping.sortDirection as "asc" | "desc";
    }

    if (Object.keys(mapping).length > 0) {
      forced.fieldMapping = mapping;
    }
  }

  return forced;
}

/**
 * Validate default settings.
 */
function validateDefaultSettings(
  raw: Record<string, unknown>
): DefaultSettings {
  const defaults: DefaultSettings = {};

  // visualTheme
  if (
    typeof raw.visualTheme === "string" &&
    ["retro", "modern", "minimal"].includes(raw.visualTheme)
  ) {
    defaults.visualTheme = raw.visualTheme as DefaultSettings["visualTheme"];
  }

  // cardSizePreset
  if (
    typeof raw.cardSizePreset === "string" &&
    ["small", "medium", "large"].includes(raw.cardSizePreset)
  ) {
    defaults.cardSizePreset =
      raw.cardSizePreset as DefaultSettings["cardSizePreset"];
  }

  // cardAspectRatio
  if (
    typeof raw.cardAspectRatio === "string" &&
    ["3:4", "5:7", "1:1"].includes(raw.cardAspectRatio)
  ) {
    defaults.cardAspectRatio =
      raw.cardAspectRatio as DefaultSettings["cardAspectRatio"];
  }

  // maxVisibleCards
  if (typeof raw.maxVisibleCards === "number") {
    const requested = Math.floor(raw.maxVisibleCards);
    if (Number.isFinite(requested) && requested >= 1) {
      defaults.maxVisibleCards = Math.min(requested, MAX_VISIBLE_CARDS);
    }
  }

  // shuffleOnLoad
  if (typeof raw.shuffleOnLoad === "boolean") {
    defaults.shuffleOnLoad = raw.shuffleOnLoad;
  }

  // groupByField
  if (typeof raw.groupByField === "string" || raw.groupByField === null) {
    defaults.groupByField = raw.groupByField;
  }

  // searchFields
  if (Array.isArray(raw.searchFields)) {
    defaults.searchFields = raw.searchFields
      .filter((f): f is string => typeof f === "string")
      .slice(0, MAX_SEARCH_FIELDS);
  }

  return defaults;
}
