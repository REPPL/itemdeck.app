/**
 * Service exports.
 *
 * Provides service-level functionality for collections and field discovery.
 */

// Field discovery
export {
  discoverFieldsForContext,
  discoverAllFields,
  getTitleFieldOptions,
  getSubtitleFieldOptions,
  getBadgeFieldOptions,
  getFooterFieldOptions,
  getLogoFieldOptions,
  getSortFieldOptions,
  type FieldContext,
} from "./fieldDiscovery";

// Update checker
export {
  checkForUpdates,
  checkMultipleForUpdates,
  type UpdateCheckResult,
} from "./updateChecker";
