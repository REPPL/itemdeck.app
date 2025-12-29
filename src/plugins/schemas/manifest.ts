/**
 * Core plugin manifest schema.
 *
 * Defines the structure for all itemdeck plugins including themes,
 * mechanics, sources, and settings contributions.
 *
 * @module plugins/schemas/manifest
 */

import { z } from "zod";

// ============================================================================
// Version Patterns
// ============================================================================

/** Semantic version pattern (e.g., "1.0.0", "2.1.3-beta") */
const semverPattern = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;

/** Semver range pattern (e.g., "^1.0.0", "~2.1.0", "1.x") */
const semverRangePattern =
  /^[\^~]?\d+(\.\d+)?(\.\d+)?(-[\w.]+)?(\+[\w.]+)?$|^\d+\.x$|^\*$/;

/** Plugin ID pattern (reverse domain notation, e.g., "org.itemdeck.theme-retro") */
const pluginIdPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;

// ============================================================================
// Author Schema
// ============================================================================

/**
 * Plugin author information.
 */
export const pluginAuthorSchema = z.object({
  /** Author display name */
  name: z.string().min(1).max(100),
  /** Author URL (GitHub profile, website, etc.) */
  url: z.url().optional(),
  /** Author email */
  email: z.email().optional(),
});

export type PluginAuthor = z.infer<typeof pluginAuthorSchema>;

// ============================================================================
// Enums
// ============================================================================

/**
 * Plugin distribution tier.
 */
export const pluginTierSchema = z.enum(["builtin", "official", "community"]);
export type PluginTier = z.infer<typeof pluginTierSchema>;

/**
 * Plugin type.
 */
export const pluginTypeSchema = z.enum([
  "theme",
  "mechanic",
  "source",
  "settings",
  "bundle",
]);
export type PluginType = z.infer<typeof pluginTypeSchema>;

/**
 * Plugin capability - what permissions a plugin can request.
 */
export const capabilitySchema = z.enum([
  // Storage capabilities
  "storage:local", // Store data in browser localStorage
  "storage:sync", // Sync data across devices (future)
  "storage:unlimited", // No storage limits

  // UI capabilities
  "ui:notifications", // Show toast notifications
  "ui:modal", // Display modal dialogs
  "ui:overlay", // Full-screen overlays (for games)
  "ui:toolbar", // Add toolbar items

  // Collection capabilities
  "collection:read", // Read card data
  "collection:write", // Modify card data (edits)
  "collection:delete", // Delete cards

  // Network capabilities
  "fetch:sameorigin", // Same-origin requests only
  "fetch:external", // External network requests

  // System capabilities
  "audio:play", // Play sound effects

  // Dangerous capabilities (blocked for community)
  "dangerous:eval", // Execute dynamic code
  "dangerous:dom", // Direct DOM manipulation
]);
export type Capability = z.infer<typeof capabilitySchema>;

// ============================================================================
// itemdeck Compatibility
// ============================================================================

/**
 * itemdeck app compatibility information.
 */
export const itemdeckCompatSchema = z.object({
  /** Minimum itemdeck version required */
  minVersion: z.string().regex(semverPattern, "Must be valid semver"),
  /** Maximum itemdeck version supported (optional) */
  maxVersion: z
    .string()
    .regex(semverRangePattern, "Must be valid semver range")
    .optional(),
  /** Plugin type */
  type: pluginTypeSchema,
  /** Distribution tier */
  tier: pluginTierSchema,
});

export type ItemdeckCompat = z.infer<typeof itemdeckCompatSchema>;

// ============================================================================
// Dependencies
// ============================================================================

/**
 * Plugin dependencies.
 */
export const pluginDependenciesSchema = z.object({
  /** Required plugin dependencies */
  plugins: z.record(z.string(), z.string().regex(semverRangePattern)).optional(),
  /** Optional plugin dependencies */
  optional: z.record(z.string(), z.string().regex(semverRangePattern)).optional(),
});

export type PluginDependencies = z.infer<typeof pluginDependenciesSchema>;

// ============================================================================
// Assets
// ============================================================================

/**
 * Plugin assets for display in browser/manager.
 */
export const pluginAssetsSchema = z.object({
  /** Plugin icon (relative path or URL) */
  icon: z.string().optional(),
  /** Banner image for details view */
  banner: z.string().optional(),
  /** Screenshots */
  screenshots: z.array(z.string()).max(10).optional(),
});

export type PluginAssets = z.infer<typeof pluginAssetsSchema>;

// ============================================================================
// Entry Points
// ============================================================================

/**
 * Plugin entry points.
 */
export const pluginEntrySchema = z.object({
  /** Main JavaScript entry point */
  main: z.string().optional(),
  /** CSS styles entry point */
  styles: z.string().optional(),
  /** Web Worker entry point (for sandboxed execution) */
  worker: z.string().optional(),
});

export type PluginEntry = z.infer<typeof pluginEntrySchema>;

// ============================================================================
// Contributions (placeholder - detailed schemas in contributions/)
// ============================================================================

/**
 * Plugin contributions - what the plugin adds to itemdeck.
 * Detailed schemas are in the contributions/ subdirectory.
 */
export const pluginContributesSchema = z.object({
  /** Settings contributions */
  settings: z.array(z.unknown()).optional(),
  /** Theme contributions */
  themes: z.array(z.unknown()).optional(),
  /** Mechanic contributions */
  mechanics: z.array(z.unknown()).optional(),
  /** Source contributions */
  sources: z.array(z.unknown()).optional(),
});

export type PluginContributes = z.infer<typeof pluginContributesSchema>;

// ============================================================================
// Core Plugin Manifest
// ============================================================================

/**
 * Core plugin manifest schema.
 *
 * Every plugin must have a manifest.json that conforms to this schema.
 */
export const pluginManifestSchema = z.object({
  /** JSON Schema URL (optional, for IDE support) */
  $schema: z.url().optional(),

  /** Unique plugin identifier (reverse domain notation) */
  id: z
    .string()
    .min(3)
    .max(100)
    .regex(pluginIdPattern, "ID must be reverse domain notation (e.g., org.itemdeck.theme-retro)"),

  /** Display name */
  name: z.string().min(1).max(50),

  /** Semantic version */
  version: z.string().regex(semverPattern, "Version must be semver (e.g., 1.0.0)"),

  /** Short description */
  description: z.string().max(500),

  /** Author information */
  author: pluginAuthorSchema,

  /** SPDX licence identifier */
  licence: z.string().optional(),

  /** Plugin homepage URL */
  homepage: z.url().optional(),

  /** Source repository URL */
  repository: z.url().optional(),

  /** Keywords for discoverability */
  keywords: z.array(z.string().max(30)).max(10).optional(),

  /** itemdeck compatibility */
  itemdeck: itemdeckCompatSchema,

  /** Required capabilities */
  capabilities: z.array(capabilitySchema).default([]),

  /** Plugin dependencies */
  dependencies: pluginDependenciesSchema.optional(),

  /** Display assets */
  assets: pluginAssetsSchema.optional(),

  /** Plugin configuration schema/defaults */
  config: z
    .object({
      /** JSON Schema for plugin config */
      schema: z.string().optional(),
      /** Default values file */
      defaults: z.string().optional(),
    })
    .optional(),

  /** Entry points */
  entry: pluginEntrySchema.optional(),

  /** Contributions to itemdeck */
  contributes: pluginContributesSchema.optional(),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a plugin manifest.
 *
 * @param data - Raw manifest data to validate
 * @returns Validated manifest or throws ZodError
 */
export function validatePluginManifest(data: unknown): PluginManifest {
  return pluginManifestSchema.parse(data);
}

/**
 * Safely validate a plugin manifest.
 *
 * @param data - Raw manifest data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidatePluginManifest(data: unknown) {
  return pluginManifestSchema.safeParse(data);
}

/**
 * Format Zod errors into a human-readable string.
 *
 * @param error - Zod error object
 * @returns Formatted error message
 */
export function formatPluginValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path ? path + ": " : ""}${issue.message}`;
    })
    .join("\n");
}
