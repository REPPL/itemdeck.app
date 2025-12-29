/**
 * Source contribution schema for plugins.
 *
 * Defines how plugins can contribute data sources to itemdeck.
 * Sources provide collections from external locations (GitHub, APIs, local files, etc.).
 *
 * @module plugins/schemas/contributions/source
 */

import { z } from "zod";

// ============================================================================
// Source Types
// ============================================================================

/**
 * Source type - where data comes from.
 */
export const sourceTypeSchema = z.enum([
  "github",     // GitHub repository
  "url",        // Direct URL to JSON/data
  "api",        // REST API endpoint
  "local",      // Local file (browser storage)
  "custom",     // Custom source type (plugin handles fetching)
]);

export type SourceType = z.infer<typeof sourceTypeSchema>;

// ============================================================================
// Authentication Configuration
// ============================================================================

/**
 * Authentication method for sources requiring auth.
 */
export const authMethodSchema = z.enum([
  "none",       // No authentication required
  "token",      // Bearer token
  "basic",      // Basic auth (username/password)
  "oauth",      // OAuth flow
  "apiKey",     // API key in header or query
]);

export type AuthMethod = z.infer<typeof authMethodSchema>;

/**
 * Authentication configuration.
 */
export const authConfigSchema = z.object({
  /** Authentication method */
  method: authMethodSchema.default("none"),
  /** Header name for token/apiKey (default: "Authorization") */
  headerName: z.string().optional(),
  /** Query parameter name for apiKey */
  queryParam: z.string().optional(),
  /** OAuth configuration */
  oauth: z.object({
    /** OAuth provider */
    provider: z.string().optional(),
    /** OAuth scopes required */
    scopes: z.array(z.string()).optional(),
    /** OAuth authorize URL */
    authorizeUrl: z.string().url().optional(),
    /** OAuth token URL */
    tokenUrl: z.string().url().optional(),
  }).optional(),
});

export type AuthConfig = z.infer<typeof authConfigSchema>;

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limiting configuration for API sources.
 */
export const rateLimitConfigSchema = z.object({
  /** Maximum requests per window */
  maxRequests: z.number().int().positive().default(60),
  /** Window duration in seconds */
  windowSeconds: z.number().int().positive().default(60),
  /** Retry after rate limit (with exponential backoff) */
  retryEnabled: z.boolean().default(true),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

// ============================================================================
// Caching Configuration
// ============================================================================

/**
 * Caching configuration for sources.
 */
export const cacheConfigSchema = z.object({
  /** Whether caching is enabled */
  enabled: z.boolean().default(true),
  /** Cache TTL in seconds (default: 1 hour) */
  ttlSeconds: z.number().int().positive().default(3600),
  /** Cache key strategy */
  keyStrategy: z.enum(["url", "hash", "custom"]).default("url"),
  /** Whether to use stale-while-revalidate */
  staleWhileRevalidate: z.boolean().default(true),
});

export type CacheConfig = z.infer<typeof cacheConfigSchema>;

// ============================================================================
// URL Template Configuration
// ============================================================================

/**
 * URL template for dynamic source URLs.
 * Supports placeholders like {owner}, {repo}, {branch}.
 */
export const urlTemplateSchema = z.object({
  /** URL template with placeholders */
  template: z.string().min(1),
  /** Required parameters */
  required: z.array(z.string()).optional(),
  /** Optional parameters with defaults */
  defaults: z.record(z.string(), z.string()).optional(),
});

export type UrlTemplate = z.infer<typeof urlTemplateSchema>;

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Data transformation configuration.
 * Defines how to extract and transform data from the source response.
 */
export const dataTransformSchema = z.object({
  /** JSON path to collection data (e.g., "data.items", "results[0].cards") */
  dataPath: z.string().optional(),
  /** Field mappings (source field -> itemdeck field) */
  fieldMappings: z.record(z.string(), z.string()).optional(),
  /** Fields to exclude */
  excludeFields: z.array(z.string()).optional(),
  /** Fields to include (if set, only these fields are included) */
  includeFields: z.array(z.string()).optional(),
  /** Transform function name (for plugins providing custom transforms) */
  transformFunction: z.string().optional(),
});

export type DataTransform = z.infer<typeof dataTransformSchema>;

// ============================================================================
// Source Settings
// ============================================================================

/**
 * Source-specific setting (for user configuration).
 */
export const sourceSettingSchema = z.object({
  /** Setting key */
  key: z.string().min(1).max(50),
  /** Display label */
  label: z.string().min(1).max(100),
  /** Setting type */
  type: z.enum(["string", "boolean", "select"]),
  /** Default value */
  default: z.union([z.boolean(), z.string()]),
  /** Description */
  description: z.string().max(200).optional(),
  /** Whether this is required */
  required: z.boolean().default(false),
  /** Options for select type */
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  /** Placeholder for string type */
  placeholder: z.string().optional(),
});

export type SourceSetting = z.infer<typeof sourceSettingSchema>;

// ============================================================================
// Source Contribution
// ============================================================================

/**
 * Complete source contribution from a plugin.
 */
export const sourceContributionSchema = z.object({
  /** Unique source identifier (within plugin namespace) */
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with dashes"),
  /** Display name */
  name: z.string().min(1).max(100),
  /** Description */
  description: z.string().max(500).optional(),

  /** Source type */
  type: sourceTypeSchema,

  /** Source icon (URL or emoji) */
  icon: z.string().optional(),

  /** Entry point file for custom source logic */
  entrypoint: z.string().optional(),

  /** URL template (for url/api types) */
  urlTemplate: urlTemplateSchema.optional(),

  /** Base URL for API sources */
  baseUrl: z.string().url().optional(),

  /** Authentication configuration */
  auth: authConfigSchema.optional(),

  /** Rate limiting configuration */
  rateLimit: rateLimitConfigSchema.optional(),

  /** Caching configuration */
  cache: cacheConfigSchema.optional(),

  /** Data transformation configuration */
  transform: dataTransformSchema.optional(),

  /** Source-specific settings */
  settings: z.array(sourceSettingSchema).optional(),

  /** Whether this source supports auto-discovery */
  supportsDiscovery: z.boolean().default(false),

  /** Discovery configuration */
  discovery: z.object({
    /** File pattern to search for */
    pattern: z.string().optional(),
    /** Config file name to look for */
    configFile: z.string().optional(),
  }).optional(),

  /** Documentation URL */
  docs: z.string().url().optional(),

  /** Whether the source is experimental/beta */
  experimental: z.boolean().default(false),
});

export type SourceContribution = z.infer<typeof sourceContributionSchema>;

// ============================================================================
// Source Instance
// ============================================================================

/**
 * Configured source instance (user-created).
 */
export interface SourceInstance {
  /** Instance ID (auto-generated) */
  id: string;
  /** Plugin ID this source comes from */
  pluginId: string;
  /** Source contribution ID */
  sourceId: string;
  /** User-provided name */
  name: string;
  /** Configuration values */
  config: Record<string, unknown>;
  /** Whether this source is enabled */
  enabled: boolean;
  /** Last fetch timestamp */
  lastFetchedAt?: string;
  /** Last fetch status */
  lastFetchStatus?: "success" | "error" | "pending";
  /** Error message if last fetch failed */
  lastFetchError?: string;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a source contribution.
 *
 * @param data - Raw data to validate
 * @returns Validated source contribution or throws ZodError
 */
export function validateSourceContribution(data: unknown): SourceContribution {
  return sourceContributionSchema.parse(data);
}

/**
 * Safely validate a source contribution.
 *
 * @param data - Raw data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateSourceContribution(data: unknown) {
  return sourceContributionSchema.safeParse(data);
}

/**
 * Build URL from template and parameters.
 *
 * @param template - URL template configuration
 * @param params - Parameter values
 * @returns Resolved URL or throws if required params missing
 */
export function buildSourceUrl(
  template: UrlTemplate,
  params: Record<string, string>
): string {
  // Merge defaults with provided params
  const merged = { ...template.defaults, ...params };

  // Check required params
  if (template.required) {
    const missing = template.required.filter((key) => !merged[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(", ")}`);
    }
  }

  // Replace placeholders
  let url = template.template;
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined) {
      url = url.replace(new RegExp(`\\{${key}\\}`, "g"), encodeURIComponent(value));
    }
  }

  return url;
}

/**
 * Extract data from response using transform configuration.
 *
 * @param data - Raw response data
 * @param transform - Transformation configuration
 * @returns Transformed data
 */
export function applyDataTransform(
  data: unknown,
  transform?: DataTransform
): unknown {
  if (!transform) return data;

  let result = data;

  // Extract from path
  if (transform.dataPath) {
    const pathParts = transform.dataPath.split(".");
    for (const part of pathParts) {
      // Handle array access like "items[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, arrayIndex] = arrayMatch;
        if (arrayKey) {
          result = (result as Record<string, unknown>)?.[arrayKey];
        }
        if (arrayIndex !== undefined) {
          result = (result as unknown[])?.[parseInt(arrayIndex, 10)];
        }
      } else {
        result = (result as Record<string, unknown>)?.[part];
      }
      if (result === undefined) break;
    }
  }

  // Apply field mappings if result is an array
  if (Array.isArray(result) && transform.fieldMappings) {
    result = result.map((item) => {
      const mapped: Record<string, unknown> = {};
      for (const [sourceField, targetField] of Object.entries(transform.fieldMappings!)) {
        const value = (item as Record<string, unknown>)?.[sourceField];
        if (value !== undefined) {
          mapped[targetField] = value;
        }
      }
      // Include unmapped fields
      for (const [fieldKey, fieldValue] of Object.entries(item as Record<string, unknown>)) {
        const mappings = transform.fieldMappings!;
        if (!(fieldKey in mappings) && !transform.excludeFields?.includes(fieldKey)) {
          if (!transform.includeFields || transform.includeFields.includes(fieldKey)) {
            mapped[fieldKey] = fieldValue;
          }
        }
      }
      return mapped;
    });
  }

  return result;
}
