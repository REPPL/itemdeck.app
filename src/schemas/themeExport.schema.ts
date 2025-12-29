/**
 * Zod schema for theme customisation export/import validation.
 *
 * Provides type-safe validation for theme JSON files.
 * Theme exports only include customisation overrides, not full theme data.
 */

import { z } from "zod";

// Current theme export version
export const THEME_EXPORT_VERSION = 1;

// ============================================================================
// Colour Validation
// ============================================================================

/**
 * Valid hex colour string (6 or 8 digits with # prefix).
 */
const hexColourSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid hex colour format");

// ============================================================================
// Theme Customisation Schema
// ============================================================================

const borderRadiusPresetSchema = z.enum(["none", "small", "medium", "large"]);
const borderWidthPresetSchema = z.enum(["none", "small", "medium", "large"]);
const shadowIntensitySchema = z.enum(["none", "subtle", "medium", "strong"]);
const animationStyleSchema = z.enum(["none", "subtle", "smooth", "bouncy"]);
const detailTransparencySchema = z.enum(["none", "25", "50", "75"]);
const overlayStyleSchema = z.enum(["dark", "light"]);
const verdictAnimationStyleSchema = z.enum(["slide", "flip"]);
const cardBackBackgroundModeSchema = z.enum(["full", "tiled", "none"]);

export const themeCustomisationSchema = z.object({
  // Border settings
  borderRadius: borderRadiusPresetSchema.optional(),
  borderWidth: borderWidthPresetSchema.optional(),

  // Visual effects
  shadowIntensity: shadowIntensitySchema.optional(),
  animationStyle: animationStyleSchema.optional(),

  // Colours
  accentColour: hexColourSchema.optional(),
  hoverColour: hexColourSchema.optional(),
  cardBackgroundColour: hexColourSchema.optional(),
  borderColour: hexColourSchema.optional(),
  textColour: hexColourSchema.optional(),

  // Detail view settings
  detailTransparency: detailTransparencySchema.optional(),
  overlayStyle: overlayStyleSchema.optional(),

  // More/Verdict settings
  moreButtonLabel: z.string().optional(),
  autoExpandMore: z.boolean().optional(),

  // Animation toggles
  zoomImage: z.boolean().optional(),
  flipAnimation: z.boolean().optional(),
  detailAnimation: z.boolean().optional(),
  overlayAnimation: z.boolean().optional(),
  verdictAnimationStyle: verdictAnimationStyleSchema.optional(),

  // Typography
  fontFamily: z.string().optional(),
  fontUrl: z.url().optional(),

  // Card back customisation
  cardBackBackgroundImage: z.url().optional(),
  cardBackBackgroundMode: cardBackBackgroundModeSchema.optional(),
});

export type ThemeCustomisationExport = z.infer<typeof themeCustomisationSchema>;

// ============================================================================
// Full Export Format Schema
// ============================================================================

export const themeExportSchema = z.object({
  version: z.literal(THEME_EXPORT_VERSION),
  exportedAt: z.iso.datetime(),
  baseTheme: z.enum(["retro", "modern", "minimal"]),
  name: z.string().min(1).optional(),
  customisation: themeCustomisationSchema,
});

export type ThemeExport = z.infer<typeof themeExportSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a theme export structure.
 *
 * @param data - Raw data to validate
 * @returns Safe parse result with success flag and data/error
 */
export function validateThemeExport(data: unknown) {
  return themeExportSchema.safeParse(data);
}

/**
 * Format Zod validation errors into a human-readable string.
 *
 * @param error - Zod error object
 * @returns Formatted error message with field paths
 */
export function formatThemeValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path ? path + ": " : ""}${issue.message}`;
    })
    .join("\n");
}
