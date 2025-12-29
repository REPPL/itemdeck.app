/**
 * Settings contribution schema for plugins.
 *
 * Defines how plugins can contribute settings to itemdeck.
 * Settings appear in the Settings panel under plugin-specific sections.
 *
 * @module plugins/schemas/contributions/settings
 */

import { z } from "zod";

// ============================================================================
// Setting Types
// ============================================================================

/**
 * Supported setting input types.
 */
export const settingTypeSchema = z.enum([
  "boolean",    // Toggle switch
  "string",     // Text input
  "number",     // Numeric input
  "select",     // Dropdown selection
  "multiselect", // Multiple selection
  "colour",     // Colour picker
  "slider",     // Range slider
  "text",       // Multi-line text area
]);

export type SettingType = z.infer<typeof settingTypeSchema>;

// ============================================================================
// Setting Option (for select/multiselect)
// ============================================================================

/**
 * Option for select/multiselect settings.
 */
export const settingOptionSchema = z.object({
  /** Option value (stored in config) */
  value: z.union([z.string(), z.number(), z.boolean()]),
  /** Display label */
  label: z.string().min(1).max(100),
  /** Optional description */
  description: z.string().max(500).optional(),
});

export type SettingOption = z.infer<typeof settingOptionSchema>;

// ============================================================================
// Setting Definition
// ============================================================================

/**
 * Base setting definition (common fields).
 */
const settingBaseSchema = z.object({
  /** Unique setting key within the plugin */
  key: z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must be alphanumeric with underscores"),
  /** Display label */
  label: z.string().min(1).max(100),
  /** Description shown below the setting */
  description: z.string().max(500).optional(),
  /** Category for grouping in UI (optional) */
  category: z.string().max(50).optional(),
  /** Whether setting requires app restart to take effect */
  requiresRestart: z.boolean().default(false),
  /** Condition for showing this setting (e.g., "showAdvanced === true") */
  when: z.string().optional(),
});

/**
 * Boolean setting (toggle).
 */
export const booleanSettingSchema = settingBaseSchema.extend({
  type: z.literal("boolean"),
  default: z.boolean(),
});

/**
 * String setting (text input).
 */
export const stringSettingSchema = settingBaseSchema.extend({
  type: z.literal("string"),
  default: z.string(),
  /** Minimum length */
  minLength: z.number().int().nonnegative().optional(),
  /** Maximum length */
  maxLength: z.number().int().positive().optional(),
  /** Validation pattern (regex) */
  pattern: z.string().optional(),
  /** Placeholder text */
  placeholder: z.string().optional(),
});

/**
 * Number setting (numeric input).
 */
export const numberSettingSchema = settingBaseSchema.extend({
  type: z.literal("number"),
  default: z.number(),
  /** Minimum value */
  min: z.number().optional(),
  /** Maximum value */
  max: z.number().optional(),
  /** Step increment */
  step: z.number().positive().optional(),
  /** Unit label (e.g., "px", "ms", "%") */
  unit: z.string().max(10).optional(),
});

/**
 * Select setting (dropdown).
 */
export const selectSettingSchema = settingBaseSchema.extend({
  type: z.literal("select"),
  default: z.union([z.string(), z.number()]),
  options: z.array(settingOptionSchema).min(1),
});

/**
 * Multi-select setting (multiple selection).
 */
export const multiselectSettingSchema = settingBaseSchema.extend({
  type: z.literal("multiselect"),
  default: z.array(z.union([z.string(), z.number()])),
  options: z.array(settingOptionSchema).min(1),
  /** Maximum number of selections */
  maxSelections: z.number().int().positive().optional(),
});

/**
 * Colour setting (colour picker).
 */
export const colourSettingSchema = settingBaseSchema.extend({
  type: z.literal("colour"),
  default: z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, "Must be hex colour"),
  /** Whether to show alpha channel */
  showAlpha: z.boolean().default(false),
});

/**
 * Slider setting (range slider).
 */
export const sliderSettingSchema = settingBaseSchema.extend({
  type: z.literal("slider"),
  default: z.number(),
  /** Minimum value */
  min: z.number(),
  /** Maximum value */
  max: z.number(),
  /** Step increment */
  step: z.number().positive().optional(),
  /** Whether to show current value */
  showValue: z.boolean().default(true),
  /** Unit label (e.g., "px", "ms", "%") */
  unit: z.string().max(10).optional(),
});

/**
 * Text setting (multi-line text area).
 */
export const textSettingSchema = settingBaseSchema.extend({
  type: z.literal("text"),
  default: z.string(),
  /** Number of rows to display */
  rows: z.number().int().positive().default(3),
  /** Maximum length */
  maxLength: z.number().int().positive().optional(),
  /** Placeholder text */
  placeholder: z.string().optional(),
});

/**
 * Union of all setting types.
 */
export const settingDefinitionSchema = z.discriminatedUnion("type", [
  booleanSettingSchema,
  stringSettingSchema,
  numberSettingSchema,
  selectSettingSchema,
  multiselectSettingSchema,
  colourSettingSchema,
  sliderSettingSchema,
  textSettingSchema,
]);

export type SettingDefinition = z.infer<typeof settingDefinitionSchema>;

// ============================================================================
// Settings Contribution
// ============================================================================

/**
 * Settings category for grouping related settings.
 */
export const settingsCategorySchema = z.object({
  /** Category identifier */
  id: z.string().min(1).max(50),
  /** Display label */
  label: z.string().min(1).max(100),
  /** Category icon (emoji or icon name) */
  icon: z.string().optional(),
  /** Category description */
  description: z.string().max(500).optional(),
  /** Display order (lower = higher) */
  order: z.number().int().default(0),
});

export type SettingsCategory = z.infer<typeof settingsCategorySchema>;

/**
 * Settings contribution from a plugin.
 */
export const settingsContributionSchema = z.object({
  /** Section title in settings panel */
  title: z.string().min(1).max(100),
  /** Section description */
  description: z.string().max(500).optional(),
  /** Section icon (emoji or icon name) */
  icon: z.string().optional(),
  /** Display order in settings panel (lower = higher) */
  order: z.number().int().default(100),
  /** Categories for grouping settings */
  categories: z.array(settingsCategorySchema).optional(),
  /** Settings definitions */
  settings: z.array(settingDefinitionSchema).min(1),
});

export type SettingsContribution = z.infer<typeof settingsContributionSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a settings contribution.
 *
 * @param data - Raw data to validate
 * @returns Validated settings contribution or throws ZodError
 */
export function validateSettingsContribution(data: unknown): SettingsContribution {
  return settingsContributionSchema.parse(data);
}

/**
 * Safely validate a settings contribution.
 *
 * @param data - Raw data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateSettingsContribution(data: unknown) {
  return settingsContributionSchema.safeParse(data);
}

/**
 * Extract default values from settings definitions.
 *
 * @param settings - Array of setting definitions
 * @returns Object mapping setting keys to default values
 */
export function extractSettingDefaults(
  settings: SettingDefinition[]
): Record<string, unknown> {
  return Object.fromEntries(
    settings.map((setting) => [setting.key, setting.default])
  );
}
