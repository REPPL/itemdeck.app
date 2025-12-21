/**
 * Configuration schemas for itemdeck.
 *
 * Uses Zod for runtime validation with TypeScript type inference.
 * All configuration values have sensible defaults and validation constraints.
 */

import { z } from "zod";

/**
 * Card display configuration.
 */
export const CardConfigSchema = z.object({
  /** Base card width in pixels (100-600) */
  width: z.number().min(100).max(600),

  /** Card aspect ratio - height = width * aspectRatio (1-2) */
  aspectRatio: z.number().min(1).max(2),

  /** Gap between cards in pixels (0-100) */
  gap: z.number().min(0).max(100),

  /** Card border radius in pixels (0-50) */
  borderRadius: z.number().min(0).max(50),

  /** Default logo URL for card backs */
  logoUrl: z.string().optional(),
});

/**
 * Animation timing configuration.
 */
export const AnimationConfigSchema = z.object({
  /** Card flip animation duration in seconds (0-2) */
  flipDuration: z.number().min(0).max(2),

  /** Grid transition duration in seconds (0-1) */
  transitionDuration: z.number().min(0).max(1),

  /** Enable/disable all animations */
  enableAnimations: z.boolean(),
});

/**
 * Application behaviour configuration.
 */
export const BehaviourConfigSchema = z.object({
  /** Maximum number of face-up cards at once (1-20) */
  maxVisibleCards: z.number().min(1).max(20),
});

/**
 * Complete application configuration schema.
 */
export const AppConfigSchema = z.object({
  card: CardConfigSchema,
  animation: AnimationConfigSchema,
  behaviour: BehaviourConfigSchema,
});

/**
 * Inferred TypeScript types from schemas.
 */
export type CardConfig = z.infer<typeof CardConfigSchema>;
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type BehaviourConfig = z.infer<typeof BehaviourConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Deep partial type for configuration updates.
 * Allows updating nested properties without providing the full object.
 */
export interface DeepPartialAppConfig {
  card?: Partial<CardConfig>;
  animation?: Partial<AnimationConfig>;
  behaviour?: Partial<BehaviourConfig>;
}

/** Default card configuration values */
export const DEFAULT_CARD_CONFIG: CardConfig = {
  width: 300,
  aspectRatio: 1.4,
  gap: 16,
  borderRadius: 12,
  logoUrl: undefined,
};

/** Default animation configuration values */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  flipDuration: 0.6,
  transitionDuration: 0.3,
  enableAnimations: true,
};

/** Default behaviour configuration values */
export const DEFAULT_BEHAVIOUR_CONFIG: BehaviourConfig = {
  maxVisibleCards: 2,
};

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: AppConfig = {
  card: DEFAULT_CARD_CONFIG,
  animation: DEFAULT_ANIMATION_CONFIG,
  behaviour: DEFAULT_BEHAVIOUR_CONFIG,
};

/**
 * Parse and validate configuration, returning defaults for invalid values.
 * Merges input with defaults for missing fields.
 */
export function parseConfig(input: unknown): AppConfig {
  // If input is not an object, return defaults
  if (typeof input !== "object" || input === null) {
    return DEFAULT_CONFIG;
  }

  const inputObj = input as Record<string, unknown>;

  // Merge with defaults before validation
  const merged = {
    card: { ...DEFAULT_CARD_CONFIG, ...(inputObj.card as object) },
    animation: { ...DEFAULT_ANIMATION_CONFIG, ...(inputObj.animation as object) },
    behaviour: { ...DEFAULT_BEHAVIOUR_CONFIG, ...(inputObj.behaviour as object) },
  };

  const result = AppConfigSchema.safeParse(merged);

  if (result.success) {
    return result.data;
  }

  // Log validation errors in development
  if (import.meta.env.DEV) {
    console.warn("Config validation failed, using defaults:", z.treeifyError(result.error));
  }

  return DEFAULT_CONFIG;
}

/**
 * Validate a partial configuration update.
 * Returns the validated partial or null if invalid.
 */
export function validatePartialConfig(
  input: unknown
): Partial<AppConfig> | null {
  // Create a partial schema that allows missing fields
  const PartialAppConfigSchema = z.object({
    card: CardConfigSchema.partial().optional(),
    animation: AnimationConfigSchema.partial().optional(),
    behaviour: BehaviourConfigSchema.partial().optional(),
  });

  const result = PartialAppConfigSchema.safeParse(input);

  if (result.success) {
    return result.data as Partial<AppConfig>;
  }

  if (import.meta.env.DEV) {
    console.warn("Partial config validation failed:", z.treeifyError(result.error));
  }

  return null;
}
