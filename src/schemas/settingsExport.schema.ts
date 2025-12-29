/**
 * Zod schema for settings export/import validation.
 *
 * Provides type-safe validation for settings JSON files including
 * version migration support.
 */

import { z } from "zod";

// Current settings store version (matches settingsStore)
export const SETTINGS_EXPORT_VERSION = 26;

// ============================================================================
// Type Enums (matching settingsStore types)
// ============================================================================

const layoutTypeSchema = z.enum(["grid", "list", "compact", "fit"]);
const reduceMotionSchema = z.enum(["system", "on", "off"]);
const overlayStyleSchema = z.enum(["dark", "light"]);
const titleDisplayModeSchema = z.enum(["truncate", "wrap"]);
const visualThemeSchema = z.enum(["retro", "modern", "minimal"]);
const borderRadiusPresetSchema = z.enum(["none", "small", "medium", "large"]);
const borderWidthPresetSchema = z.enum(["none", "small", "medium", "large"]);
const shadowIntensitySchema = z.enum(["none", "subtle", "medium", "strong"]);
const animationStyleSchema = z.enum(["none", "subtle", "smooth", "bouncy"]);
const detailTransparencySchema = z.enum(["none", "25", "50", "75"]);
const verdictAnimationStyleSchema = z.enum(["slide", "flip"]);
const cardBackStyleSchema = z.enum(["bitmap", "svg", "colour"]);
const dragFaceSchema = z.enum(["front", "back", "both"]);
const defaultCardFaceSchema = z.enum(["front", "back"]);
const cardSizePresetSchema = z.enum(["small", "medium", "large"]);
const cardAspectRatioSchema = z.enum(["3:4", "5:7", "1:1"]);
const cardBackDisplaySchema = z.enum(["year", "logo", "both", "none"]);
const searchScopeSchema = z.enum(["all", "visible"]);
const cardBackBackgroundModeSchema = z.enum(["full", "tiled", "none"]);

// ============================================================================
// Theme Customisation Schema
// ============================================================================

const themeCustomisationSchema = z.object({
  borderRadius: borderRadiusPresetSchema.optional(),
  borderWidth: borderWidthPresetSchema.optional(),
  shadowIntensity: shadowIntensitySchema.optional(),
  animationStyle: animationStyleSchema.optional(),
  accentColour: z.string().optional(),
  hoverColour: z.string().optional(),
  cardBackgroundColour: z.string().optional(),
  borderColour: z.string().optional(),
  textColour: z.string().optional(),
  detailTransparency: detailTransparencySchema.optional(),
  overlayStyle: overlayStyleSchema.optional(),
  moreButtonLabel: z.string().optional(),
  autoExpandMore: z.boolean().optional(),
  zoomImage: z.boolean().optional(),
  flipAnimation: z.boolean().optional(),
  detailAnimation: z.boolean().optional(),
  overlayAnimation: z.boolean().optional(),
  verdictAnimationStyle: verdictAnimationStyleSchema.optional(),
  fontFamily: z.string().optional(),
  fontUrl: z.url().optional(),
  cardBackBackgroundImage: z.url().optional(),
  cardBackBackgroundMode: cardBackBackgroundModeSchema.optional(),
});

export type ThemeCustomisationExport = z.infer<typeof themeCustomisationSchema>;

// ============================================================================
// Field Mapping Schema
// ============================================================================

const fieldMappingSchema = z.object({
  titleField: z.string().optional(),
  subtitleField: z.string().optional(),
  footerBadgeField: z.string().optional(),
  logoField: z.string().optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  topBadgeField: z.string().optional(),
});

// ============================================================================
// Exportable Settings Schema
// ============================================================================

export const exportableSettingsSchema = z.object({
  // Layout settings
  layout: layoutTypeSchema.optional(),
  cardSizePreset: cardSizePresetSchema.optional(),
  cardAspectRatio: cardAspectRatioSchema.optional(),
  maxVisibleCards: z.number().int().min(1).max(10).optional(),

  // Card display settings
  cardBackDisplay: cardBackDisplaySchema.optional(),
  cardBackStyle: cardBackStyleSchema.optional(),
  cardBackBackground: z.string().optional(),
  showRankBadge: z.boolean().optional(),
  showDeviceBadge: z.boolean().optional(),
  rankPlaceholderText: z.string().optional(),
  defaultCardFace: defaultCardFaceSchema.optional(),

  // Behaviour settings
  shuffleOnLoad: z.boolean().optional(),
  dragModeEnabled: z.boolean().optional(),
  dragFace: dragFaceSchema.optional(),
  randomSelectionEnabled: z.boolean().optional(),
  randomSelectionCount: z.number().int().min(1).optional(),

  // Visual theme settings
  visualTheme: visualThemeSchema.optional(),
  themeCustomisations: z.object({
    retro: themeCustomisationSchema.optional(),
    modern: themeCustomisationSchema.optional(),
    minimal: themeCustomisationSchema.optional(),
  }).partial().optional(),

  // Accessibility settings
  reduceMotion: reduceMotionSchema.optional(),
  highContrast: z.boolean().optional(),
  titleDisplayMode: titleDisplayModeSchema.optional(),

  // UI visibility settings
  showHelpButton: z.boolean().optional(),
  showSettingsButton: z.boolean().optional(),
  showDragIcon: z.boolean().optional(),
  showStatisticsBar: z.boolean().optional(),
  showSearchBar: z.boolean().optional(),
  searchBarMinimised: z.boolean().optional(),
  showViewButton: z.boolean().optional(),
  usePlaceholderImages: z.boolean().optional(),

  // Search & filter settings
  searchFields: z.array(z.string()).optional(),
  searchScope: searchScopeSchema.optional(),
  groupByField: z.string().nullable().optional(),

  // Field mapping
  fieldMapping: fieldMappingSchema.optional(),

  // Edit mode
  editModeEnabled: z.boolean().optional(),
});

export type ExportableSettings = z.infer<typeof exportableSettingsSchema>;

// ============================================================================
// Full Export Format Schema
// ============================================================================

export const settingsExportSchema = z.object({
  version: z.number().int().min(1),
  exportedAt: z.iso.datetime(),
  settings: exportableSettingsSchema,
});

export type SettingsExport = z.infer<typeof settingsExportSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a settings export structure.
 *
 * @param data - Raw data to validate
 * @returns Safe parse result with success flag and data/error
 */
export function validateSettingsExport(data: unknown) {
  return settingsExportSchema.safeParse(data);
}

/**
 * Format Zod validation errors into a human-readable string.
 *
 * @param error - Zod error object
 * @returns Formatted error message with field paths
 */
export function formatSettingsValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path ? path + ": " : ""}${issue.message}`;
    })
    .join("\n");
}
