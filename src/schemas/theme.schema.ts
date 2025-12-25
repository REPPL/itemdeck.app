/**
 * Zod schema for external theme validation.
 *
 * Defines the structure for custom themes that can be loaded from
 * local files or remote sources.
 */

import { z } from "zod";

// ============================================================================
// Colour Schema
// ============================================================================

/**
 * Valid hex colour string (3, 6, or 8 digits for alpha, with or without #).
 */
const hexColourSchema = z
  .string()
  .regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid hex colour format")
  .transform((val) => (val.startsWith("#") ? val : `#${val}`));

/**
 * Theme colour configuration.
 */
export const themeColoursSchema = z.object({
  /** Primary accent colour */
  accent: hexColourSchema.optional(),
  /** Hover state colour */
  hover: hexColourSchema.optional(),
  /** Card background colour */
  cardBackground: hexColourSchema.optional(),
  /** Card border colour */
  border: hexColourSchema.optional(),
  /** Text colour */
  text: hexColourSchema.optional(),
  /** Secondary text colour */
  textSecondary: hexColourSchema.optional(),
});

export type ThemeColours = z.infer<typeof themeColoursSchema>;

// ============================================================================
// Animation Schema
// ============================================================================

/**
 * Animation timing configuration.
 */
export const animationTimingSchema = z.object({
  /** Duration in seconds */
  duration: z.number().positive().max(5).optional(),
  /** CSS easing function */
  easing: z
    .enum([
      "linear",
      "ease",
      "ease-in",
      "ease-out",
      "ease-in-out",
    ])
    .optional(),
});

/**
 * Theme animation configuration.
 */
export const themeAnimationsSchema = z.object({
  /** Card flip animation */
  flip: animationTimingSchema.optional(),
  /** Detail panel animation */
  detail: animationTimingSchema.optional(),
  /** Overlay animation */
  overlay: animationTimingSchema.optional(),
});

export type ThemeAnimations = z.infer<typeof themeAnimationsSchema>;

// ============================================================================
// Border Schema
// ============================================================================

/**
 * Border radius preset.
 */
export const borderRadiusSchema = z.enum(["none", "small", "medium", "large", "pill"]);

/**
 * Border width preset.
 */
export const borderWidthSchema = z.enum(["none", "small", "medium", "large"]);

/**
 * Theme border configuration.
 */
export const themeBordersSchema = z.object({
  /** Corner radius */
  radius: borderRadiusSchema.optional(),
  /** Border width */
  width: borderWidthSchema.optional(),
});

export type ThemeBorders = z.infer<typeof themeBordersSchema>;

// ============================================================================
// Shadow Schema
// ============================================================================

/**
 * Shadow intensity preset.
 */
export const shadowIntensitySchema = z.enum(["none", "subtle", "medium", "strong"]);

/**
 * Theme shadow configuration.
 */
export const themeShadowsSchema = z.object({
  /** Shadow intensity */
  intensity: shadowIntensitySchema.optional(),
});

export type ThemeShadows = z.infer<typeof themeShadowsSchema>;

// ============================================================================
// Verdict (More button overlay) Schema
// ============================================================================

/**
 * Verdict animation style.
 */
export const verdictAnimationStyleSchema = z.enum(["slide", "flip", "fade"]);

/**
 * Verdict configuration.
 */
export const themeVerdictSchema = z.object({
  /** Animation style for the verdict/more overlay */
  animationStyle: verdictAnimationStyleSchema.optional(),
});

export type ThemeVerdict = z.infer<typeof themeVerdictSchema>;

// ============================================================================
// Complete Theme Schema
// ============================================================================

/**
 * Complete theme definition.
 */
export const themeSchema = z.object({
  /** Theme identifier (kebab-case) */
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with dashes")
    .optional(),

  /** Display name */
  name: z.string().min(1),

  /** Semantic version */
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Version must be semver format (e.g., 1.0.0)")
    .optional(),

  /** Theme description */
  description: z.string().optional(),

  /** Author name or attribution */
  author: z.string().optional(),

  /** Base theme to extend (built-in theme name) */
  extends: z.enum(["retro", "modern", "minimal"]).optional(),

  /** Colour overrides */
  colours: themeColoursSchema.optional(),

  /** Animation configuration */
  animations: themeAnimationsSchema.optional(),

  /** Border configuration */
  borders: themeBordersSchema.optional(),

  /** Shadow configuration */
  shadows: themeShadowsSchema.optional(),

  /** Verdict/More overlay configuration */
  verdict: themeVerdictSchema.optional(),
});

export type Theme = z.infer<typeof themeSchema>;

// ============================================================================
// Theme Index Schema (for theme registries)
// ============================================================================

/**
 * Theme index entry (for listing available themes).
 */
export const themeIndexEntrySchema = z.object({
  /** Theme identifier */
  id: z.string().min(1),
  /** Display name */
  name: z.string().min(1),
  /** Theme file URL or path */
  url: z.string(),
  /** Optional description */
  description: z.string().optional(),
  /** Optional preview image URL */
  preview: z.string().url().optional(),
});

export type ThemeIndexEntry = z.infer<typeof themeIndexEntrySchema>;

/**
 * Theme index (list of available themes).
 */
export const themeIndexSchema = z.object({
  themes: z.array(themeIndexEntrySchema),
});

export type ThemeIndex = z.infer<typeof themeIndexSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a theme definition.
 *
 * @param data - Raw theme data to validate
 * @returns Validated theme or throws ZodError
 */
export function validateTheme(data: unknown): Theme {
  return themeSchema.parse(data);
}

/**
 * Safely validate a theme definition.
 *
 * @param data - Raw theme data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateTheme(data: unknown) {
  return themeSchema.safeParse(data);
}

/**
 * Format Zod errors into a human-readable string.
 *
 * @param error - Zod error object
 * @returns Formatted error message
 */
export function formatThemeValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path ? path + ": " : ""}${issue.message}`;
    })
    .join("\n");
}
