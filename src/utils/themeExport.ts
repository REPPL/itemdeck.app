/**
 * Theme customisation export/import utilities.
 *
 * Handles exporting and importing theme customisations to/from JSON files.
 * Exports only the customisation overrides (values that differ from defaults),
 * not the full theme configuration.
 */

import {
  themeExportSchema,
  THEME_EXPORT_VERSION,
  formatThemeValidationError,
  type ThemeExport,
  type ThemeCustomisationExport,
} from "@/schemas/themeExport.schema";
import {
  useSettingsStore,
  DEFAULT_THEME_CUSTOMISATIONS,
  type VisualTheme,
  type ThemeCustomisation,
} from "@/stores/settingsStore";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract only the customisation values that differ from defaults.
 *
 * @param current - Current theme customisation
 * @param defaults - Default theme customisation
 * @returns Object containing only override values
 */
function extractOverrides(
  current: ThemeCustomisation,
  defaults: ThemeCustomisation
): ThemeCustomisationExport {
  const overrides: ThemeCustomisationExport = {};

  for (const key of Object.keys(current) as (keyof ThemeCustomisation)[]) {
    const currentValue = current[key];
    const defaultValue = defaults[key];

    if (currentValue !== defaultValue) {
      // Type assertion needed for dynamic key assignment
      (overrides as Record<string, unknown>)[key] = currentValue;
    }
  }

  return overrides;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export current theme customisation (only overrides from defaults).
 *
 * @param theme - The theme to export customisation for
 * @param customName - Optional custom name for the exported theme
 */
export function exportThemeToFile(theme: VisualTheme, customName?: string): void {
  const state = useSettingsStore.getState();
  const currentCustomisation = state.themeCustomisations[theme];
  const defaults = DEFAULT_THEME_CUSTOMISATIONS[theme];

  // Extract only the overrides
  const overrides = extractOverrides(currentCustomisation, defaults);

  const exportData: ThemeExport = {
    version: THEME_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    baseTheme: theme,
    name: customName,
    customisation: overrides,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split("T")[0] ?? "export";
  const filename = customName
    ? `itemdeck-theme-${customName.toLowerCase().replace(/\s+/g, "-")}-${dateStr}.json`
    : `itemdeck-theme-${theme}-${dateStr}.json`;

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
 * Import theme customisation from file.
 *
 * @param file - The JSON file to import
 * @param switchToBaseTheme - Whether to switch to the imported theme's base theme (default: true)
 * @returns Import result with base theme and override count
 * @throws Error if file is invalid JSON or fails validation
 */
export async function importThemeFromFile(
  file: File,
  switchToBaseTheme = true
): Promise<{ baseTheme: VisualTheme; overrideCount: number; name?: string }> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const result = themeExportSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid theme file:\n${formatThemeValidationError(result.error)}`);
  }

  const { baseTheme, customisation, name } = result.data;
  const store = useSettingsStore.getState();

  // Switch to base theme if requested
  if (switchToBaseTheme && store.visualTheme !== baseTheme) {
    store.setVisualTheme(baseTheme);
  }

  // Apply customisation to the base theme
  store.setThemeCustomisation(baseTheme, customisation);

  return {
    baseTheme,
    overrideCount: Object.keys(customisation).length,
    name,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if current theme has customisations (differs from defaults).
 *
 * @param theme - The theme to check
 * @returns True if the theme has been customised from defaults
 */
export function hasThemeCustomisations(theme: VisualTheme): boolean {
  const state = useSettingsStore.getState();
  const current = state.themeCustomisations[theme];
  const defaults = DEFAULT_THEME_CUSTOMISATIONS[theme];
  return JSON.stringify(current) !== JSON.stringify(defaults);
}

/**
 * Count the number of customisation overrides for a theme.
 *
 * @param theme - The theme to count overrides for
 * @returns Number of settings that differ from defaults
 */
export function countThemeOverrides(theme: VisualTheme): number {
  const state = useSettingsStore.getState();
  const current = state.themeCustomisations[theme];
  const defaults = DEFAULT_THEME_CUSTOMISATIONS[theme];
  const overrides = extractOverrides(current, defaults);
  return Object.keys(overrides).length;
}

// ============================================================================
// Test Exports
// ============================================================================

/**
 * Export internal functions for testing.
 */
export const _testExports = {
  extractOverrides,
};
