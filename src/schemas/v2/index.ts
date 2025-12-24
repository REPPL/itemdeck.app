/**
 * V2 Schema exports.
 *
 * Re-exports all Zod schemas and validation helpers for the v2 format.
 */

export {
  // Attribution
  attributionSchema,
  type AttributionSchema,

  // Images
  imageTypeSchema,
  imageSchema,
  imagesArraySchema,
  type ImageSchema,

  // Ratings
  ratingValueSchema,
  ratingSchema,
  type RatingSchema,

  // Detail Links
  detailLinkSchema,
  detailUrlsSchema,
  type DetailLinkSchema,
  type DetailUrlsSchema,

  // Field Definitions
  fieldTypeSchema,
  fieldDefinitionSchema,
  type FieldDefinitionSchema,

  // Entity Types
  entityTypeDefinitionSchema,
  type EntityTypeDefinitionSchema,

  // Relationships
  cardinalitySchema,
  relationshipDefinitionSchema,
  type RelationshipDefinitionSchema,

  // Display Config
  sortSpecSchema,
  cardFrontConfigSchema,
  cardBackConfigSchema,
  cardDisplayConfigSchema,
  displayConfigSchema,
  type DisplayConfigSchema,

  // Collection Metadata
  collectionMetadataSchema,
  type CollectionMetadataSchema,

  // Collection Definition
  schemaVersionSchema,
  collectionDefinitionSchema,
  type CollectionDefinitionSchema,

  // Entity
  baseEntitySchema,
  entitySchema,
  type EntitySchema,

  // Validation Helpers
  validateCollectionDefinition,
  safeValidateCollectionDefinition,
  validateEntity,
  safeValidateEntity,
  formatValidationError,
} from "./collection.schema";
