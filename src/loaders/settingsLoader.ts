/**
 * Collection settings loader.
 *
 * Fetches and validates settings.json from collection directories.
 * Settings are optional - missing or invalid settings are gracefully ignored.
 */

import type { CollectionSettings, ForcedSettings, DefaultSettings } from "@/types/collectionSettings";
import { COLLECTION_SETTINGS_VERSION } from "@/types/collectionSettings";

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
    const response = await fetch(`${basePath}/settings.json`);

    // Settings file is optional - don't fail if missing
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.warn(`Invalid content type for settings.json: ${contentType ?? "unknown"}`);
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
    console.warn(`Unsupported settings version: ${version} (expected <= ${COLLECTION_SETTINGS_VERSION})`);
    return null;
  }

  const settings: CollectionSettings = {
    version,
  };

  // Validate forced settings
  if (raw.forced && typeof raw.forced === "object") {
    settings.forced = validateForcedSettings(raw.forced as Record<string, unknown>);
  }

  // Validate default settings
  if (raw.defaults && typeof raw.defaults === "object") {
    settings.defaults = validateDefaultSettings(raw.defaults as Record<string, unknown>);
  }

  return settings;
}

/**
 * Validate forced settings.
 */
function validateForcedSettings(raw: Record<string, unknown>): ForcedSettings {
  const forced: ForcedSettings = {};

  // defaultCardFace
  if (raw.defaultCardFace && ["front", "back"].includes(String(raw.defaultCardFace))) {
    forced.defaultCardFace = raw.defaultCardFace as "front" | "back";
  }

  // cardBackDisplay
  if (raw.cardBackDisplay && ["year", "logo", "both", "none"].includes(String(raw.cardBackDisplay))) {
    forced.cardBackDisplay = raw.cardBackDisplay as ForcedSettings["cardBackDisplay"];
  }

  // cardBackStyle
  if (raw.cardBackStyle && ["plain", "pattern", "gradient"].includes(String(raw.cardBackStyle))) {
    forced.cardBackStyle = raw.cardBackStyle as ForcedSettings["cardBackStyle"];
  }

  // titleDisplayMode
  if (raw.titleDisplayMode && ["always", "hover", "never"].includes(String(raw.titleDisplayMode))) {
    forced.titleDisplayMode = raw.titleDisplayMode as ForcedSettings["titleDisplayMode"];
  }

  // Boolean fields
  if (typeof raw.showRankBadge === "boolean") {
    forced.showRankBadge = raw.showRankBadge;
  }
  if (typeof raw.showDeviceBadge === "boolean") {
    forced.showDeviceBadge = raw.showDeviceBadge;
  }

  // String fields
  if (typeof raw.rankPlaceholderText === "string") {
    forced.rankPlaceholderText = raw.rankPlaceholderText;
  }

  // Field mapping
  if (raw.fieldMapping && typeof raw.fieldMapping === "object") {
    forced.fieldMapping = raw.fieldMapping as ForcedSettings["fieldMapping"];
  }

  return forced;
}

/**
 * Validate default settings.
 */
function validateDefaultSettings(raw: Record<string, unknown>): DefaultSettings {
  const defaults: DefaultSettings = {};

  // visualTheme
  if (raw.visualTheme && ["retro", "modern", "minimal"].includes(String(raw.visualTheme))) {
    defaults.visualTheme = raw.visualTheme as DefaultSettings["visualTheme"];
  }

  // cardSizePreset
  if (raw.cardSizePreset && ["small", "medium", "large"].includes(String(raw.cardSizePreset))) {
    defaults.cardSizePreset = raw.cardSizePreset as DefaultSettings["cardSizePreset"];
  }

  // cardAspectRatio
  if (raw.cardAspectRatio && ["3:4", "5:7", "1:1"].includes(String(raw.cardAspectRatio))) {
    defaults.cardAspectRatio = raw.cardAspectRatio as DefaultSettings["cardAspectRatio"];
  }

  // maxVisibleCards
  if (typeof raw.maxVisibleCards === "number" && raw.maxVisibleCards > 0) {
    defaults.maxVisibleCards = Math.floor(raw.maxVisibleCards);
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
    defaults.searchFields = raw.searchFields.filter((f): f is string => typeof f === "string");
  }

  return defaults;
}
