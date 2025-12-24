/**
 * Zod validation schemas for the v2 collection format.
 *
 * Provides runtime validation with helpful error messages.
 */

import { z } from "zod";

// ============================================================================
// Attribution Schema
// ============================================================================

export const attributionSchema = z.object({
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  author: z.string().optional(),
  licence: z.string().optional(),
  licenceUrl: z.string().url().optional(),
  url: z.string().url().optional(), // Deprecated, for backward compatibility
});

export type AttributionSchema = z.infer<typeof attributionSchema>;

// ============================================================================
// Image Schema
// ============================================================================

export const imageTypeSchema = z.enum([
  "cover",
  "screenshot",
  "title-screen",
  "logo",
  "promotional",
  "fan-art",
  "photo",
  "artwork",
]);

export const imageSchema = z.object({
  url: z.string().url(),
  type: imageTypeSchema.optional(),
  isPrimary: z.boolean().optional(),
  alt: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  attribution: attributionSchema.optional(),
});

export type ImageSchema = z.infer<typeof imageSchema>;

export const imagesArraySchema = z.array(imageSchema);

// ============================================================================
// Rating Schema
// ============================================================================

export const ratingValueSchema = z.object({
  score: z.number(),
  max: z.number().positive().optional(),
  sourceCount: z.number().nonnegative().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

export const ratingSchema = z.union([z.number(), ratingValueSchema]);

export type RatingSchema = z.infer<typeof ratingSchema>;

// ============================================================================
// Detail Links Schema
// ============================================================================

export const detailLinkSchema = z.object({
  url: z.string().url(),
  source: z.string().optional(),
  label: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const detailUrlsSchema = z.union([
  z.string().url(),
  detailLinkSchema,
  z.array(detailLinkSchema),
]);

export type DetailLinkSchema = z.infer<typeof detailLinkSchema>;
export type DetailUrlsSchema = z.infer<typeof detailUrlsSchema>;

// ============================================================================
// Field Definition Schema
// ============================================================================

export const fieldTypeSchema = z.enum([
  "string",
  "text",
  "number",
  "boolean",
  "date",
  "url",
  "enum",
  "array",
  "object",
  "images",
  "rating",
  "detailUrls",
]);

export const fieldDefinitionSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    type: fieldTypeSchema,
    required: z.boolean().optional(),
    description: z.string().optional(),
    default: z.unknown().optional(),
    enum: z.array(z.string()).optional(),
    items: fieldDefinitionSchema.optional(),
    ref: z.string().optional(),
    label: z.string().optional(),
    format: z.string().optional(),
  })
);

export type FieldDefinitionSchema = z.infer<typeof fieldDefinitionSchema>;

// ============================================================================
// Entity Type Schema
// ============================================================================

export const entityTypeDefinitionSchema = z.object({
  primary: z.boolean().optional(),
  label: z.string().optional(),
  labelPlural: z.string().optional(),
  description: z.string().optional(),
  fields: z.record(z.string(), fieldDefinitionSchema),
  computed: z.record(z.string(), z.string()).optional(),
});

export type EntityTypeDefinitionSchema = z.infer<
  typeof entityTypeDefinitionSchema
>;

// ============================================================================
// Relationship Schema
// ============================================================================

export const cardinalitySchema = z.enum([
  "one-to-one",
  "one-to-many",
  "many-to-one",
  "many-to-many",
]);

export const relationshipDefinitionSchema = z.object({
  target: z.string().optional(),
  cardinality: cardinalitySchema.optional(),
  required: z.boolean().optional(),
  type: z.enum(["ordinal", "reference"]).optional(),
  scope: z.string().optional(),
});

export type RelationshipDefinitionSchema = z.infer<
  typeof relationshipDefinitionSchema
>;

// ============================================================================
// Display Config Schema
// ============================================================================

export const sortSpecSchema = z.union([
  z.string(),
  z.tuple([z.string(), z.enum(["asc", "desc"])]),
]);

export const cardFrontConfigSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badge: z.string().optional(),
  footer: z.union([z.string(), z.array(z.string())]).optional(),
  image: z
    .object({
      source: z.string().optional(),
      showAttribution: z.boolean().optional(),
    })
    .optional(),
});

export const cardBackConfigSchema = z.object({
  logo: z.string().optional(),
  text: z.string().optional(),
});

export const cardDisplayConfigSchema = z.object({
  front: cardFrontConfigSchema.optional(),
  back: cardBackConfigSchema.optional(),
});

export const displayConfigSchema = z.object({
  primaryEntity: z.string().optional(),
  groupBy: z.string().optional(),
  sortBy: sortSpecSchema.optional(),
  sortWithinGroup: sortSpecSchema.optional(),
  card: cardDisplayConfigSchema.optional(),
  theme: z.string().optional(),
});

export type DisplayConfigSchema = z.infer<typeof displayConfigSchema>;

// ============================================================================
// Collection Metadata Schema
// ============================================================================

export const collectionMetadataSchema = z.object({
  author: z.string().optional(),
  licence: z.string().optional(),
  homepage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export type CollectionMetadataSchema = z.infer<typeof collectionMetadataSchema>;

// ============================================================================
// Collection Definition Schema
// ============================================================================

export const schemaVersionSchema = z.enum(["v1", "v2"]);

export const collectionDefinitionSchema = z.object({
  $schema: z.string().optional(),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  schemaVersion: schemaVersionSchema.optional(),
  version: z.string().optional(),
  metadata: collectionMetadataSchema.optional(),
  entityTypes: z.record(z.string(), entityTypeDefinitionSchema),
  relationships: z.record(z.string(), relationshipDefinitionSchema).optional(),
  display: displayConfigSchema.optional(),
});

export type CollectionDefinitionSchema = z.infer<
  typeof collectionDefinitionSchema
>;

// ============================================================================
// Entity Schema
// ============================================================================

export const baseEntitySchema = z.object({
  id: z.string().min(1),
  images: imagesArraySchema.optional(),
});

export const entitySchema = baseEntitySchema.passthrough();

export type EntitySchema = z.infer<typeof entitySchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a collection definition.
 *
 * @param data - Raw collection data to validate
 * @returns Validated collection definition or throws ZodError
 */
export function validateCollectionDefinition(
  data: unknown
): CollectionDefinitionSchema {
  return collectionDefinitionSchema.parse(data);
}

/**
 * Safely validate a collection definition.
 *
 * @param data - Raw collection data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateCollectionDefinition(data: unknown) {
  return collectionDefinitionSchema.safeParse(data);
}

/**
 * Validate an entity.
 *
 * @param data - Raw entity data to validate
 * @returns Validated entity or throws ZodError
 */
export function validateEntity(data: unknown): EntitySchema {
  return entitySchema.parse(data);
}

/**
 * Safely validate an entity.
 *
 * @param data - Raw entity data to validate
 * @returns Result with success flag and data/error
 */
export function safeValidateEntity(data: unknown) {
  return entitySchema.safeParse(data);
}

/**
 * Format Zod errors into a human-readable string.
 *
 * @param error - Zod error object
 * @returns Formatted error message
 */
export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path ? path + ": " : ""}${issue.message}`;
    })
    .join("\n");
}
