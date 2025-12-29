/**
 * Plugin integration adapters.
 *
 * These adapters connect plugin contributions to itemdeck's existing systems.
 *
 * @module plugins/integration
 */

// ============================================================================
// Theme Adapter
// ============================================================================

export {
  themeAdapter,
  applyTheme,
  removeCurrentTheme,
  getCurrentThemeId,
  exportThemeCSS,
} from "./themeAdapter";

export type {
  ThemeAdapterConfig,
  AppliedTheme,
} from "./themeAdapter";

// ============================================================================
// Mechanic Adapter
// ============================================================================

export {
  mechanicAdapter,
  registerMechanicFromPlugin,
  unregisterMechanicsFromPlugin,
  getAllPluginMechanics,
  registerBuiltinMechanics,
} from "./mechanicAdapter";

export type { RegisteredMechanic } from "./mechanicAdapter";

// ============================================================================
// Settings Adapter
// ============================================================================

export {
  settingsAdapter,
  registerPluginSettings,
  unregisterPluginSettings,
  getGroupedPluginSettings,
  getPluginSettingValue,
  setPluginSettingValue,
} from "./settingsAdapter";

export type {
  MergedSettingDefinition,
  MergedSettingGroup,
} from "./settingsAdapter";

// ============================================================================
// Source Adapter
// ============================================================================

export {
  sourceAdapter,
  registerSourceFromPlugin,
  unregisterSourcesFromPlugin,
  getAvailableSources,
  loadCollectionFromSource,
  registerBuiltinSources,
} from "./sourceAdapter";

export type {
  RegisteredSource,
  SourceConfig,
  SourceDefinition,
  LoadedCollection,
} from "./sourceAdapter";
