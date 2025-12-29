/**
 * Zod schema for mechanic manifest validation.
 *
 * Defines the structure for mechanic manifests that describe
 * game mechanics (plugins) for itemdeck.
 *
 * v0.12.5: Plugin-ready architecture - internal mechanics use manifests
 * to prepare for external plugin extraction in v0.13.0.
 */

import { z } from "zod";

// ============================================================================
// Author Schema
// ============================================================================

/**
 * Mechanic author information.
 */
export const mechanicAuthorSchema = z.object({
  /** Author display name */
  name: z.string().min(1),
  /** Author URL (GitHub profile, website, etc.) */
  url: z.url().optional(),
});

export type MechanicAuthor = z.infer<typeof mechanicAuthorSchema>;

// ============================================================================
// Mechanic Manifest Schema
// ============================================================================

/**
 * Complete mechanic manifest definition.
 *
 * Every mechanic (internal or external) should have a manifest.json
 * that describes its metadata, requirements, and capabilities.
 */
export const mechanicManifestSchema = z.object({
  /** Unique mechanic identifier (kebab-case) */
  id: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with dashes"),

  /** Display name */
  name: z.string().min(1).max(100),

  /** Semantic version */
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Version must be semver format (e.g., 1.0.0)"),

  /** Short description of the mechanic */
  description: z.string().max(500),

  /** Entry point file (relative path from manifest location) */
  entrypoint: z.string().default("./index.ts"),

  /** Optional scoped theme file (relative path) */
  theme: z.string().optional(),

  /** Sample collection URL for demo/testing */
  sampleCollection: z.url().optional(),

  /** Minimum number of cards required to play */
  minCards: z.number().int().positive().optional(),

  /** Maximum number of cards supported (0 = unlimited) */
  maxCards: z.number().int().nonnegative().optional(),

  /** Required card fields for the mechanic to function */
  requiredFields: z.array(z.string()).optional(),

  /** Minimum itemdeck app version required */
  minAppVersion: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Version must be semver format")
    .optional(),

  /** Author information */
  author: mechanicAuthorSchema.optional(),

  /** Keywords for discoverability */
  keywords: z.array(z.string()).optional(),

  /** URL to the mechanic's icon */
  icon: z.url().optional(),

  /** URL to the mechanic's documentation */
  docs: z.url().optional(),

  /** URL to the mechanic's source repository */
  repository: z.url().optional(),

  /** Licence identifier (SPDX) */
  licence: z.string().optional(),

  /** Whether the mechanic is experimental/beta */
  experimental: z.boolean().default(false),
});

export type MechanicManifest = z.infer<typeof mechanicManifestSchema>;

// ============================================================================
// Mechanic Registry Schema
// ============================================================================

/**
 * Entry in a mechanic registry (for listing available mechanics).
 */
export const mechanicRegistryEntrySchema = z.object({
  /** Mechanic identifier */
  id: z.string().min(1),
  /** Display name */
  name: z.string().min(1),
  /** Manifest URL */
  manifestUrl: z.url(),
  /** Short description */
  description: z.string().optional(),
  /** Preview image URL */
  preview: z.url().optional(),
  /** Whether this is an official mechanic */
  official: z.boolean().default(false),
});

export type MechanicRegistryEntry = z.infer<typeof mechanicRegistryEntrySchema>;

/**
 * Mechanic registry (list of available mechanics).
 */
export const mechanicRegistrySchema = z.object({
  /** Registry version */
  version: z.string(),
  /** Last updated timestamp (ISO 8601) */
  lastUpdated: z.iso.datetime().optional(),
  /** List of available mechanics */
  mechanics: z.array(mechanicRegistryEntrySchema),
});

export type MechanicRegistry = z.infer<typeof mechanicRegistrySchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a mechanic manifest.
 *
 * @param data - Raw manifest data to validate
 * @returns Validated manifest or throws ZodError
 */
export function validateMechanicManifest(data: unknown): MechanicManifest {
  return mechanicManifestSchema.parse(data);
}

/**
 * Safely validate a mechanic manifest.
 *
 * @param data - Raw manifest data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateMechanicManifest(data: unknown) {
  return mechanicManifestSchema.safeParse(data);
}

/**
 * Format Zod errors into a human-readable string.
 *
 * @param error - Zod error object
 * @returns Formatted error message
 */
export function formatManifestValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path ? path + ": " : ""}${issue.message}`;
    })
    .join("\n");
}
