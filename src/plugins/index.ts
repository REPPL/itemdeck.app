/**
 * Plugin system exports.
 *
 * This is the main entry point for the itemdeck plugin system.
 *
 * @module plugins
 */

// ============================================================================
// Schema Exports
// ============================================================================

export * from "./schemas";

// ============================================================================
// Store Exports
// ============================================================================

export { usePluginStore } from "@/stores/pluginStore";
export type {
  InstalledPluginInfo,
  PluginLoadState,
  PluginPreferences,
} from "@/stores/pluginStore";

// ============================================================================
// Cache Exports
// ============================================================================

export {
  cacheManifest,
  getCachedManifest,
  getAllCachedManifests,
  deleteCachedManifest,
  clearExpiredManifests,
  cacheAsset,
  getCachedAsset,
  getPluginAssets,
  deleteCachedAsset,
  deletePluginAssets,
  cacheConfig,
  getCachedConfig,
  deleteCachedConfig,
  getCacheStats,
  clearPluginCache,
  clearAllPluginCache,
  performCacheMaintenance,
  getPluginDB,
  closePluginDB,
} from "./cache/pluginCache";

export type {
  CachedManifest,
  CachedAsset,
  CachedConfig,
  CacheStats,
} from "./cache/pluginCache";

// ============================================================================
// Loader Exports
// ============================================================================

export {
  pluginLoader,
  registerBuiltinPlugin,
  getBuiltinPluginIds,
} from "./loader/pluginLoader";

export type {
  PluginSource,
  LoadOptions,
  LoadedPlugin,
  PluginModule,
  PluginContext,
  PluginStorage,
  PluginUI,
  PluginCollection,
} from "./loader/pluginLoader";

export {
  lazyLoader,
  lazyLoadPlugin,
  preloadPlugin,
  preloadPlugins,
} from "./loader/lazyLoader";

export type {
  PreloadStrategy,
  PreloadOptions,
} from "./loader/lazyLoader";

// ============================================================================
// Security Exports
// ============================================================================

export {
  CAPABILITY_INFO,
  TIER_LIMITS,
  getCapabilityAccess,
  isCapabilityAvailable,
  requiresConsent,
  isCapabilityBlocked,
  getBlockedCapabilities,
  getConsentCapabilities,
  getAllowedCapabilities,
  validateCapabilities,
  getCapabilitiesByCategory,
  getCapabilityInfo,
} from "./security/capabilities";

export type {
  CapabilityCategory,
  CapabilityInfo,
  CapabilityAccess,
  TierLimits,
} from "./security/capabilities";

export {
  permissionManager,
  checkPluginCapability,
  requestPluginCapabilities,
  grantPluginCapability,
  revokePluginCapability,
} from "./security/permissionManager";

export type {
  PermissionRequestResult,
  PermissionCheckResult,
} from "./security/permissionManager";

// ============================================================================
// Sandbox Exports
// ============================================================================

export {
  WorkerSandbox,
  createWorkerSandbox,
} from "./sandbox/workerSandbox";

export type {
  WorkerInMessage,
  WorkerOutMessage,
  SandboxOptions,
} from "./sandbox/workerSandbox";

export {
  createPluginAPIHandlers,
  registerSandboxAPIHandlers,
  setNotificationHandler,
  setModalHandler,
  setCollectionProvider,
} from "./sandbox/pluginAPI";

export type {
  PluginAPIHandlers,
  NotificationHandler,
  ModalHandler,
  CollectionDataProvider,
} from "./sandbox/pluginAPI";

// ============================================================================
// Validation Exports
// ============================================================================

export {
  validateManifest,
  validatePluginCode,
  formatValidationResult,
  isValidManifest,
} from "./validation/validator";

export type {
  ValidationSeverity,
  ValidationIssue,
  ValidationResult,
  ValidationOptions,
} from "./validation/validator";

// ============================================================================
// Integration Exports
// ============================================================================

export {
  themeAdapter,
  applyTheme,
  removeCurrentTheme,
  getCurrentThemeId,
  exportThemeCSS,
  mechanicAdapter,
  registerMechanicFromPlugin,
  unregisterMechanicsFromPlugin,
  getAllPluginMechanics,
  registerBuiltinMechanics,
  settingsAdapter,
  registerPluginSettings,
  unregisterPluginSettings,
  getGroupedPluginSettings,
  getPluginSettingValue,
  setPluginSettingValue,
  sourceAdapter,
  registerSourceFromPlugin,
  unregisterSourcesFromPlugin,
  getAvailableSources,
  loadCollectionFromSource,
  registerBuiltinSources,
} from "./integration";

export type {
  ThemeAdapterConfig,
  AppliedTheme,
  RegisteredMechanic,
  MergedSettingDefinition,
  MergedSettingGroup,
  RegisteredSource,
  SourceConfig,
  SourceDefinition,
  LoadedCollection,
} from "./integration";

// ============================================================================
// Built-in Plugin Exports
// ============================================================================

export {
  BUILTIN_THEME_IDS,
  BUILTIN_MECHANIC_IDS,
  BUILTIN_SOURCE_IDS,
  BUILTIN_PLUGIN_IDS,
  registerAllBuiltinPlugins,
} from "./builtin";
