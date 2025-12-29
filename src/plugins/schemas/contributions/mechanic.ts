/**
 * Mechanic contribution schema for plugins.
 *
 * Defines how plugins can contribute game mechanics to itemdeck.
 * Mechanics are interactive gameplay modes (memory, quiz, competing, etc.).
 *
 * This extends the existing mechanic manifest schema from v0.12.5
 * to integrate with the plugin system.
 *
 * @module plugins/schemas/contributions/mechanic
 */

import { z } from "zod";

// ============================================================================
// Field Requirements
// ============================================================================

/**
 * Field requirement type for mechanics.
 */
export const fieldRequirementTypeSchema = z.enum([
  "string",   // Any string field
  "number",   // Numeric field (for comparisons)
  "boolean",  // Boolean field
  "image",    // Image URL field
  "date",     // Date/datetime field
  "array",    // Array field
  "any",      // Any field type
]);

export type FieldRequirementType = z.infer<typeof fieldRequirementTypeSchema>;

/**
 * Field requirement for a mechanic.
 */
export const fieldRequirementSchema = z.object({
  /** Field key or path (e.g., "title", "stats.attack") */
  field: z.string().min(1),
  /** Required field type */
  type: fieldRequirementTypeSchema,
  /** Whether this field is required (default: true) */
  required: z.boolean().default(true),
  /** Description of what this field is used for */
  description: z.string().max(200).optional(),
});

export type FieldRequirement = z.infer<typeof fieldRequirementSchema>;

// ============================================================================
// AI Configuration
// ============================================================================

/**
 * AI opponent difficulty levels.
 */
export const aiDifficultySchema = z.enum(["easy", "medium", "hard", "expert"]);
export type AIDifficulty = z.infer<typeof aiDifficultySchema>;

/**
 * AI opponent configuration for mechanics that support it.
 */
export const mechanicAIConfigSchema = z.object({
  /** Whether AI opponent is supported */
  supported: z.boolean().default(false),
  /** Available difficulty levels */
  difficulties: z.array(aiDifficultySchema).optional(),
  /** Default difficulty */
  defaultDifficulty: aiDifficultySchema.optional(),
});

export type MechanicAIConfig = z.infer<typeof mechanicAIConfigSchema>;

// ============================================================================
// Mechanic Settings
// ============================================================================

/**
 * Mechanic-specific setting definition (reuses settings schema patterns).
 */
export const mechanicSettingSchema = z.object({
  /** Setting key */
  key: z.string().min(1).max(50),
  /** Display label */
  label: z.string().min(1).max(100),
  /** Setting type */
  type: z.enum(["boolean", "number", "select"]),
  /** Default value */
  default: z.union([z.boolean(), z.number(), z.string()]),
  /** Description */
  description: z.string().max(200).optional(),
  /** Options for select type */
  options: z.array(z.object({
    value: z.union([z.string(), z.number()]),
    label: z.string(),
  })).optional(),
  /** Min value for number type */
  min: z.number().optional(),
  /** Max value for number type */
  max: z.number().optional(),
});

export type MechanicSetting = z.infer<typeof mechanicSettingSchema>;

// ============================================================================
// Mechanic UI Configuration
// ============================================================================

/**
 * UI mode for the mechanic.
 */
export const mechanicUIModeSchema = z.enum([
  "overlay",    // Full-screen overlay on top of collection
  "inline",     // Integrated into the card grid
  "panel",      // Side panel alongside collection
  "fullscreen", // Complete takeover of the screen
]);

export type MechanicUIMode = z.infer<typeof mechanicUIModeSchema>;

/**
 * Mechanic UI configuration.
 */
export const mechanicUIConfigSchema = z.object({
  /** UI display mode */
  mode: mechanicUIModeSchema.default("overlay"),
  /** Show deck/collection in background */
  showBackground: z.boolean().default(true),
  /** Allow closing/exiting at any time */
  allowExit: z.boolean().default(true),
  /** Custom CSS class to apply to container */
  containerClass: z.string().optional(),
});

export type MechanicUIConfig = z.infer<typeof mechanicUIConfigSchema>;

// ============================================================================
// Mechanic Contribution
// ============================================================================

/**
 * Complete mechanic contribution from a plugin.
 *
 * This schema is designed to be compatible with the existing
 * MechanicManifest schema while adding plugin-specific fields.
 */
export const mechanicContributionSchema = z.object({
  /** Unique mechanic identifier (within plugin namespace) */
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with dashes"),
  /** Display name */
  name: z.string().min(1).max(100),
  /** Short description */
  description: z.string().max(500),

  /** Entry point file (relative to plugin root) */
  entrypoint: z.string().default("./index.ts"),
  /** Optional scoped CSS file */
  styles: z.string().optional(),

  /** Mechanic icon (URL or emoji) */
  icon: z.string().optional(),
  /** Preview image URL */
  preview: z.url().optional(),

  /** Minimum number of cards required */
  minCards: z.number().int().positive().default(2),
  /** Maximum cards supported (0 = unlimited) */
  maxCards: z.number().int().nonnegative().default(0),

  /** Required card fields */
  requiredFields: z.array(fieldRequirementSchema).optional(),

  /** AI opponent configuration */
  ai: mechanicAIConfigSchema.optional(),

  /** Mechanic-specific settings */
  settings: z.array(mechanicSettingSchema).optional(),

  /** UI configuration */
  ui: mechanicUIConfigSchema.optional(),

  /** Sample collection URL for demo/testing */
  sampleCollection: z.url().optional(),

  /** Documentation URL */
  docs: z.url().optional(),

  /** Whether the mechanic is experimental/beta */
  experimental: z.boolean().default(false),

  /** Keywords for discoverability */
  keywords: z.array(z.string().max(30)).max(10).optional(),
});

export type MechanicContribution = z.infer<typeof mechanicContributionSchema>;

// ============================================================================
// Mechanic State Interface
// ============================================================================

/**
 * Common mechanic state structure.
 * Mechanics can extend this for their specific needs.
 */
export interface MechanicState {
  /** Mechanic ID */
  mechanicId: string;
  /** Current game state */
  status: "idle" | "playing" | "paused" | "finished";
  /** Current score (if applicable) */
  score?: number;
  /** Current round (if applicable) */
  round?: number;
  /** Total rounds (if applicable) */
  totalRounds?: number;
  /** Start time (ISO string) */
  startedAt?: string;
  /** End time (ISO string) */
  finishedAt?: string;
  /** Custom mechanic data */
  data?: Record<string, unknown>;
}

/**
 * Mechanic result structure (returned when game ends).
 */
export interface MechanicResult {
  /** Final score */
  score: number;
  /** Maximum possible score */
  maxScore?: number;
  /** Time taken in milliseconds */
  duration?: number;
  /** Number of rounds played */
  rounds?: number;
  /** Additional statistics */
  stats?: Record<string, number | string>;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a mechanic contribution.
 *
 * @param data - Raw data to validate
 * @returns Validated mechanic contribution or throws ZodError
 */
export function validateMechanicContribution(data: unknown): MechanicContribution {
  return mechanicContributionSchema.parse(data);
}

/**
 * Safely validate a mechanic contribution.
 *
 * @param data - Raw data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateMechanicContribution(data: unknown) {
  return mechanicContributionSchema.safeParse(data);
}

/**
 * Check if a collection meets the field requirements for a mechanic.
 *
 * @param requirements - Field requirements from mechanic
 * @param availableFields - Fields available in the collection
 * @returns Object with valid flag and missing fields
 */
export function checkFieldRequirements(
  requirements: FieldRequirement[],
  availableFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const req of requirements) {
    if (req.required && !availableFields.includes(req.field)) {
      missing.push(req.field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extract default settings values from mechanic settings.
 *
 * @param settings - Mechanic settings definitions
 * @returns Object mapping setting keys to default values
 */
export function extractMechanicSettingDefaults(
  settings: MechanicSetting[]
): Record<string, unknown> {
  return Object.fromEntries(
    settings.map((setting) => [setting.key, setting.default])
  );
}
