/**
 * Theme contribution schema for plugins.
 *
 * Defines how plugins can contribute themes to itemdeck.
 * Themes control visual styling: colours, fonts, radii, shadows, animations.
 *
 * @module plugins/schemas/contributions/theme
 */

import { z } from "zod";

// ============================================================================
// Colour Definitions
// ============================================================================

/** Hex colour pattern (with optional alpha) */
const hexColourPattern = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

/**
 * Theme colour scheme - core colours used throughout the UI.
 */
export const themeColoursSchema = z.object({
  /** Primary accent colour */
  primary: z.string().regex(hexColourPattern).optional(),
  /** Primary colour hover state */
  primaryHover: z.string().regex(hexColourPattern).optional(),
  /** Secondary accent colour */
  secondary: z.string().regex(hexColourPattern).optional(),
  /** Generic accent colour */
  accent: z.string().regex(hexColourPattern).optional(),

  /** Background colours */
  background: z.string().regex(hexColourPattern).optional(),
  backgroundSecondary: z.string().regex(hexColourPattern).optional(),
  surface: z.string().regex(hexColourPattern).optional(),
  surfaceHover: z.string().regex(hexColourPattern).optional(),

  /** Text colours */
  text: z.string().regex(hexColourPattern).optional(),
  textSecondary: z.string().regex(hexColourPattern).optional(),
  textMuted: z.string().regex(hexColourPattern).optional(),

  /** Border colours */
  border: z.string().regex(hexColourPattern).optional(),
  borderHover: z.string().regex(hexColourPattern).optional(),

  /** Semantic colours */
  success: z.string().regex(hexColourPattern).optional(),
  warning: z.string().regex(hexColourPattern).optional(),
  error: z.string().regex(hexColourPattern).optional(),
  info: z.string().regex(hexColourPattern).optional(),

  /** Card-specific colours */
  cardBackground: z.string().regex(hexColourPattern).optional(),
  cardBorder: z.string().regex(hexColourPattern).optional(),
  cardText: z.string().regex(hexColourPattern).optional(),
});

export type ThemeColours = z.infer<typeof themeColoursSchema>;

// ============================================================================
// Typography Definitions
// ============================================================================

/**
 * Font definition with optional fallbacks and loading URL.
 */
export const fontDefinitionSchema = z.object({
  /** Font family name */
  family: z.string().min(1).max(100),
  /** Fallback fonts (system fonts) */
  fallbacks: z.array(z.string()).optional(),
  /** URL to load font from (Google Fonts, custom URL) */
  url: z.string().url().optional(),
  /** Font weight (for variable fonts) */
  weight: z.union([z.string(), z.number()]).optional(),
  /** Font style */
  style: z.enum(["normal", "italic", "oblique"]).optional(),
});

export type FontDefinition = z.infer<typeof fontDefinitionSchema>;

/**
 * Theme typography settings.
 */
export const themeTypographySchema = z.object({
  /** Heading font */
  heading: fontDefinitionSchema.optional(),
  /** Body text font */
  body: fontDefinitionSchema.optional(),
  /** Monospace font (code, technical text) */
  mono: fontDefinitionSchema.optional(),
});

export type ThemeTypography = z.infer<typeof themeTypographySchema>;

// ============================================================================
// Spacing & Sizing
// ============================================================================

/**
 * Border radius presets.
 */
export const themeBorderRadiiSchema = z.object({
  /** Small radius (buttons, badges) */
  sm: z.string().optional(),
  /** Medium radius (cards, inputs) */
  md: z.string().optional(),
  /** Large radius (modals, panels) */
  lg: z.string().optional(),
  /** Extra large radius */
  xl: z.string().optional(),
  /** Full/pill radius */
  full: z.string().optional(),
  /** Card-specific radius */
  card: z.string().optional(),
});

export type ThemeBorderRadii = z.infer<typeof themeBorderRadiiSchema>;

/**
 * Shadow definitions.
 */
export const themeShadowsSchema = z.object({
  /** Small shadow (hover states) */
  sm: z.string().optional(),
  /** Medium shadow (elevated elements) */
  md: z.string().optional(),
  /** Large shadow (modals) */
  lg: z.string().optional(),
  /** Extra large shadow (popovers) */
  xl: z.string().optional(),
  /** Card shadow */
  card: z.string().optional(),
  /** Card hover shadow */
  cardHover: z.string().optional(),
});

export type ThemeShadows = z.infer<typeof themeShadowsSchema>;

// ============================================================================
// Animation Definitions
// ============================================================================

/**
 * Theme animation/transition settings.
 */
export const themeAnimationsSchema = z.object({
  /** Fast transition duration (e.g., "100ms") */
  fast: z.string().optional(),
  /** Normal transition duration (e.g., "200ms") */
  normal: z.string().optional(),
  /** Slow transition duration (e.g., "400ms") */
  slow: z.string().optional(),
  /** Default easing function */
  easing: z.string().optional(),
  /** Bounce easing function */
  easingBounce: z.string().optional(),
});

export type ThemeAnimations = z.infer<typeof themeAnimationsSchema>;

// ============================================================================
// Card Back Customisation
// ============================================================================

/**
 * Card back visual customisation.
 */
export const themeCardBackSchema = z.object({
  /** Background image URL */
  backgroundImage: z.string().url().optional(),
  /** Background mode: full (cover), tiled (repeat), none */
  backgroundMode: z.enum(["full", "tiled", "none"]).optional(),
  /** Logo/watermark image URL */
  logoImage: z.string().url().optional(),
  /** Logo opacity (0-1) */
  logoOpacity: z.number().min(0).max(1).optional(),
  /** Pattern overlay (SVG pattern or gradient) */
  pattern: z.string().optional(),
});

export type ThemeCardBack = z.infer<typeof themeCardBackSchema>;

// ============================================================================
// Special Effects
// ============================================================================

/**
 * Special visual effects (optional, theme-specific).
 */
export const themeEffectsSchema = z.object({
  /** Enable CRT scanline effect */
  crtScanlines: z.boolean().optional(),
  /** Scanline colour */
  scanlineColour: z.string().regex(hexColourPattern).optional(),
  /** Scanline size */
  scanlineSize: z.string().optional(),
  /** Enable glow effect on interactive elements */
  glowEffect: z.boolean().optional(),
  /** Glow colour */
  glowColour: z.string().regex(hexColourPattern).optional(),
  /** Enable noise/grain texture */
  noiseTexture: z.boolean().optional(),
  /** Custom CSS filter for the entire app */
  globalFilter: z.string().optional(),
});

export type ThemeEffects = z.infer<typeof themeEffectsSchema>;

// ============================================================================
// Theme Contribution
// ============================================================================

/**
 * Complete theme contribution from a plugin.
 */
export const themeContributionSchema = z.object({
  /** Unique theme identifier (within plugin namespace) */
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with dashes"),
  /** Display name */
  name: z.string().min(1).max(100),
  /** Theme description */
  description: z.string().max(500).optional(),
  /** Theme preview image URL */
  preview: z.string().url().optional(),
  /** Theme category (e.g., "dark", "light", "retro", "minimal") */
  category: z.enum(["dark", "light", "retro", "minimal", "custom"]).default("custom"),

  /** Colour scheme */
  colours: themeColoursSchema.optional(),
  /** Typography settings */
  typography: themeTypographySchema.optional(),
  /** Border radii */
  borderRadii: themeBorderRadiiSchema.optional(),
  /** Shadows */
  shadows: themeShadowsSchema.optional(),
  /** Animations/transitions */
  animations: themeAnimationsSchema.optional(),
  /** Card back customisation */
  cardBack: themeCardBackSchema.optional(),
  /** Special effects */
  effects: themeEffectsSchema.optional(),

  /** Raw CSS to inject (for advanced customisation) */
  customCSS: z.string().max(50000).optional(),
  /** External CSS file URL to load */
  cssUrl: z.string().url().optional(),
});

export type ThemeContribution = z.infer<typeof themeContributionSchema>;

// ============================================================================
// CSS Variable Generation
// ============================================================================

/**
 * Map theme colours to CSS custom properties.
 */
export function themeColoursToCSSVariables(colours: ThemeColours): Record<string, string> {
  const mapping: Record<keyof ThemeColours, string> = {
    primary: "--colour-primary",
    primaryHover: "--colour-primary-hover",
    secondary: "--colour-secondary",
    accent: "--colour-accent",
    background: "--colour-background",
    backgroundSecondary: "--colour-background-secondary",
    surface: "--colour-surface",
    surfaceHover: "--colour-surface-hover",
    text: "--colour-text",
    textSecondary: "--colour-text-secondary",
    textMuted: "--colour-text-muted",
    border: "--colour-border",
    borderHover: "--colour-border-hover",
    success: "--colour-success",
    warning: "--colour-warning",
    error: "--colour-error",
    info: "--colour-info",
    cardBackground: "--colour-card-background",
    cardBorder: "--card-border-colour",
    cardText: "--colour-card-text",
  };

  const variables: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(mapping)) {
    const value = colours[key as keyof ThemeColours];
    if (value) {
      variables[cssVar] = value;
    }
  }
  return variables;
}

/**
 * Map theme border radii to CSS custom properties.
 */
export function themeBorderRadiiToCSSVariables(radii: ThemeBorderRadii): Record<string, string> {
  const mapping: Record<keyof ThemeBorderRadii, string> = {
    sm: "--radius-sm",
    md: "--radius-md",
    lg: "--radius-lg",
    xl: "--radius-xl",
    full: "--radius-full",
    card: "--card-border-radius",
  };

  const variables: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(mapping)) {
    const value = radii[key as keyof ThemeBorderRadii];
    if (value) {
      variables[cssVar] = value;
    }
  }
  return variables;
}

/**
 * Map theme shadows to CSS custom properties.
 */
export function themeShadowsToCSSVariables(shadows: ThemeShadows): Record<string, string> {
  const mapping: Record<keyof ThemeShadows, string> = {
    sm: "--shadow-sm",
    md: "--shadow-md",
    lg: "--shadow-lg",
    xl: "--shadow-xl",
    card: "--shadow-card",
    cardHover: "--shadow-card-hover",
  };

  const variables: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(mapping)) {
    const value = shadows[key as keyof ThemeShadows];
    if (value) {
      variables[cssVar] = value;
    }
  }
  return variables;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a theme contribution.
 *
 * @param data - Raw data to validate
 * @returns Validated theme contribution or throws ZodError
 */
export function validateThemeContribution(data: unknown): ThemeContribution {
  return themeContributionSchema.parse(data);
}

/**
 * Safely validate a theme contribution.
 *
 * @param data - Raw data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateThemeContribution(data: unknown) {
  return themeContributionSchema.safeParse(data);
}
