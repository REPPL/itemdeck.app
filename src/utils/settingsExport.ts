/**
 * Settings export/import utilities.
 *
 * Handles exporting and importing user settings to/from JSON files
 * with Zod validation and version migration support.
 */

import {
  settingsExportSchema,
  SETTINGS_EXPORT_VERSION,
  formatSettingsValidationError,
  type SettingsExport,
  type ExportableSettings,
} from "@/schemas/settingsExport.schema";
import { useSettingsStore } from "@/stores/settingsStore";

export type ImportMode = "replace" | "merge";

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Extract exportable settings from the current store state.
 *
 * Excludes transient state and internal-only fields.
 */
function extractExportableSettings(
  state: ReturnType<typeof useSettingsStore.getState>
): ExportableSettings {
  return {
    // Layout settings
    layout: state.layout,
    cardSizePreset: state.cardSizePreset,
    cardAspectRatio: state.cardAspectRatio,
    maxVisibleCards: state.maxVisibleCards,

    // Card display settings
    cardBackDisplay: state.cardBackDisplay,
    cardBackStyle: state.cardBackStyle,
    cardBackBackground: state.cardBackBackground,
    showRankBadge: state.showRankBadge,
    showDeviceBadge: state.showDeviceBadge,
    rankPlaceholderText: state.rankPlaceholderText,
    defaultCardFace: state.defaultCardFace,

    // Behaviour settings
    shuffleOnLoad: state.shuffleOnLoad,
    dragModeEnabled: state.dragModeEnabled,
    dragFace: state.dragFace,
    randomSelectionEnabled: state.randomSelectionEnabled,
    randomSelectionCount: state.randomSelectionCount,

    // Visual theme settings
    visualTheme: state.visualTheme,
    themeCustomisations: state.themeCustomisations,

    // Accessibility settings
    reduceMotion: state.reduceMotion,
    highContrast: state.highContrast,
    titleDisplayMode: state.titleDisplayMode,

    // UI visibility settings
    showHelpButton: state.showHelpButton,
    showSettingsButton: state.showSettingsButton,
    showDragIcon: state.showDragIcon,
    showStatisticsBar: state.showStatisticsBar,
    showSearchBar: state.showSearchBar,
    searchBarMinimised: state.searchBarMinimised,
    showViewButton: state.showViewButton,
    usePlaceholderImages: state.usePlaceholderImages,

    // Search & filter settings
    searchFields: state.searchFields,
    searchScope: state.searchScope,
    groupByField: state.groupByField,

    // Field mapping
    fieldMapping: state.fieldMapping,

    // Edit mode
    editModeEnabled: state.editModeEnabled,
  };
}

/**
 * Export current settings to a downloadable JSON file.
 */
export function exportSettingsToFile(): void {
  const state = useSettingsStore.getState();

  const exportData: SettingsExport = {
    version: SETTINGS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings: extractExportableSettings(state),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split("T")[0] ?? "export";
  const filename = `itemdeck-settings-${dateStr}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Migrate settings from an older version to the current version.
 *
 * @param settings - Settings to migrate
 * @param fromVersion - Version the settings were exported from
 * @returns Migrated settings
 */
function migrateSettings(
  settings: ExportableSettings,
  fromVersion: number
): ExportableSettings {
  const migrated = { ...settings };

  // v26 added showViewButton
  if (fromVersion < 26) {
    migrated.showViewButton = migrated.showViewButton ?? true;
    migrated.usePlaceholderImages = migrated.usePlaceholderImages ?? true;
  }

  // v25 added cache consent (not exportable, but version bump)
  // v24 added navExpanded (not exportable, but version bump)
  // v23 removed activeMechanicId from persistence
  // v22 added searchBarMinimised
  if (fromVersion < 22) {
    migrated.searchBarMinimised = migrated.searchBarMinimised ?? false;
  }

  // v21 added searchScope
  if (fromVersion < 21) {
    migrated.searchScope = migrated.searchScope ?? "all";
  }

  // v20 added showSearchBar
  if (fromVersion < 20) {
    migrated.showSearchBar = migrated.showSearchBar ?? true;
  }

  // v19 added searchFields, groupByField
  if (fromVersion < 19) {
    migrated.searchFields = migrated.searchFields ?? ["title", "summary", "verdict"];
    migrated.groupByField = migrated.groupByField ?? null;
  }

  // v17 added editModeEnabled
  if (fromVersion < 17) {
    migrated.editModeEnabled = migrated.editModeEnabled ?? false;
  }

  // v16 added showStatisticsBar
  if (fromVersion < 16) {
    migrated.showStatisticsBar = migrated.showStatisticsBar ?? true;
  }

  // v15 added defaultCardFace
  if (fromVersion < 15) {
    migrated.defaultCardFace = migrated.defaultCardFace ?? "back";
  }

  // v14 added random selection
  if (fromVersion < 14) {
    migrated.randomSelectionEnabled = migrated.randomSelectionEnabled ?? false;
    migrated.randomSelectionCount = migrated.randomSelectionCount ?? 10;
  }

  return migrated;
}

/**
 * Apply settings to the store.
 *
 * @param settings - Settings to apply
 * @param mode - Import mode: "replace" resets first, "merge" only updates provided values
 */
function applySettings(settings: ExportableSettings, mode: ImportMode): void {
  const store = useSettingsStore.getState();

  // Reset to defaults first if replace mode
  if (mode === "replace") {
    store.resetToDefaults();
  }

  // Apply each setting if it exists in the import
  if (settings.layout !== undefined) store.setLayout(settings.layout);
  if (settings.cardSizePreset !== undefined) store.setCardSizePreset(settings.cardSizePreset);
  if (settings.cardAspectRatio !== undefined) store.setCardAspectRatio(settings.cardAspectRatio);
  if (settings.maxVisibleCards !== undefined) store.setMaxVisibleCards(settings.maxVisibleCards);
  if (settings.cardBackDisplay !== undefined) store.setCardBackDisplay(settings.cardBackDisplay);
  if (settings.cardBackStyle !== undefined) store.setCardBackStyle(settings.cardBackStyle);
  if (settings.cardBackBackground !== undefined) store.setCardBackBackground(settings.cardBackBackground);
  if (settings.showRankBadge !== undefined) store.setShowRankBadge(settings.showRankBadge);
  if (settings.showDeviceBadge !== undefined) store.setShowDeviceBadge(settings.showDeviceBadge);
  if (settings.rankPlaceholderText !== undefined) store.setRankPlaceholderText(settings.rankPlaceholderText);
  if (settings.defaultCardFace !== undefined) store.setDefaultCardFace(settings.defaultCardFace);
  if (settings.shuffleOnLoad !== undefined) store.setShuffleOnLoad(settings.shuffleOnLoad);
  if (settings.dragModeEnabled !== undefined) store.setDragModeEnabled(settings.dragModeEnabled);
  if (settings.dragFace !== undefined) store.setDragFace(settings.dragFace);
  if (settings.randomSelectionEnabled !== undefined) store.setRandomSelectionEnabled(settings.randomSelectionEnabled);
  if (settings.randomSelectionCount !== undefined) store.setRandomSelectionCount(settings.randomSelectionCount);
  if (settings.visualTheme !== undefined) store.setVisualTheme(settings.visualTheme);
  if (settings.reduceMotion !== undefined) store.setReduceMotion(settings.reduceMotion);
  if (settings.highContrast !== undefined) store.setHighContrast(settings.highContrast);
  if (settings.titleDisplayMode !== undefined) store.setTitleDisplayMode(settings.titleDisplayMode);
  if (settings.showHelpButton !== undefined) store.setShowHelpButton(settings.showHelpButton);
  if (settings.showSettingsButton !== undefined) store.setShowSettingsButton(settings.showSettingsButton);
  if (settings.showDragIcon !== undefined) store.setShowDragIcon(settings.showDragIcon);
  if (settings.showStatisticsBar !== undefined) store.setShowStatisticsBar(settings.showStatisticsBar);
  if (settings.showSearchBar !== undefined) store.setShowSearchBar(settings.showSearchBar);
  if (settings.searchBarMinimised !== undefined) store.setSearchBarMinimised(settings.searchBarMinimised);
  if (settings.showViewButton !== undefined) store.setShowViewButton(settings.showViewButton);
  if (settings.usePlaceholderImages !== undefined) store.setUsePlaceholderImages(settings.usePlaceholderImages);
  if (settings.searchFields !== undefined) store.setSearchFields(settings.searchFields);
  if (settings.searchScope !== undefined) store.setSearchScope(settings.searchScope);
  if (settings.groupByField !== undefined) store.setGroupByField(settings.groupByField);
  if (settings.editModeEnabled !== undefined) store.setEditModeEnabled(settings.editModeEnabled);

  // Handle nested objects
  if (settings.fieldMapping !== undefined) {
    store.setFieldMapping(settings.fieldMapping);
  }

  // Handle theme customisations per theme
  if (settings.themeCustomisations !== undefined) {
    for (const theme of Object.keys(settings.themeCustomisations) as (keyof typeof settings.themeCustomisations)[]) {
      const customisation = settings.themeCustomisations[theme];
      if (customisation !== undefined) {
        store.setThemeCustomisation(theme, customisation);
      }
    }
  }
}

/**
 * Count the number of settings in an export.
 *
 * @param settings - Settings to count
 * @returns Number of non-undefined settings
 */
function countSettings(settings: ExportableSettings): number {
  let count = 0;

  for (const key of Object.keys(settings) as (keyof ExportableSettings)[]) {
    const value = settings[key];
    if (value !== undefined && value !== null) {
      if (key === "themeCustomisations" && typeof value === "object" && !Array.isArray(value)) {
        // Count each theme customisation separately
        count += Object.keys(value as object).length;
      } else if (key === "fieldMapping" && typeof value === "object" && !Array.isArray(value)) {
        // Count each field mapping separately
        count += Object.keys(value as object).length;
      } else {
        count += 1;
      }
    }
  }

  return count;
}

/**
 * Import settings from a file.
 *
 * @param file - The JSON file to import
 * @param mode - Import mode: "replace" resets to defaults first, "merge" only updates provided values
 * @returns Import result with settings count and version
 * @throws Error if file is invalid JSON or fails validation
 */
export async function importSettingsFromFile(
  file: File,
  mode: ImportMode
): Promise<{ settingsCount: number; version: number }> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const result = settingsExportSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid settings file:\n${formatSettingsValidationError(result.error)}`);
  }

  const { version, settings } = result.data;
  const migratedSettings = migrateSettings(settings, version);

  applySettings(migratedSettings, mode);

  return {
    settingsCount: countSettings(migratedSettings),
    version,
  };
}

// ============================================================================
// Test Exports
// ============================================================================

/**
 * Export internal functions for testing.
 */
export const _testExports = {
  extractExportableSettings,
  migrateSettings,
  applySettings,
  countSettings,
};
