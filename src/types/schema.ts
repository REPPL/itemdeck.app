/**
 * Schema type definitions for the v2 collection format.
 *
 * Defines the Entity-Relationship data model for flexible collections.
 * Supports structured ratings, multiple detail URLs, and dynamic field discovery.
 */

import type { Image } from "./image";
import type { DisplayConfig } from "./display";
import type { UILabels } from "@/context/CollectionUIContext";

// Re-export v2 types for convenience
export type { Rating, RatingValue } from "./rating";
export type { DetailUrls, DetailLink } from "./links";

/**
 * Schema version identifiers.
 */
export type SchemaVersion = "v1" | "v2";

/**
 * Field types supported by the schema.
 */
export type FieldType =
  | "string"
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "url"
  | "enum"
  | "array"
  | "object"
  | "images"
  | "videos"      // Array of video URLs (e.g., YouTube)
  | "rating"      // v2: Structured rating with source metadata
  | "detailUrls"; // v2: Multiple detail links with sources

/**
 * Relationship cardinality types.
 */
export type Cardinality = "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";

/**
 * Field definition for an entity type.
 */
export interface FieldDefinition {
  /** Field type */
  type: FieldType;

  /** Whether the field is required */
  required?: boolean;

  /** Field description */
  description?: string;

  /** Default value */
  default?: unknown;

  /** Allowed values for enum type */
  enum?: string[];

  /** Array item type for array fields */
  items?: FieldDefinition;

  /** Reference to another entity type */
  ref?: string;
}

/**
 * Entity type definition.
 *
 * Describes a category of entities in the collection.
 */
export interface EntityTypeDefinition {
  /** Whether this is the primary entity type (displayed as cards) */
  primary?: boolean;

  /** Singular label for the entity type */
  label?: string;

  /** Plural label for the entity type */
  labelPlural?: string;

  /** Description of the entity type */
  description?: string;

  /** Field definitions for this entity type */
  fields: Record<string, FieldDefinition>;

  /** Computed field expressions */
  computed?: Record<string, string>;
}

/**
 * Relationship definition.
 *
 * Describes how entity types relate to each other.
 */
export interface RelationshipDefinition {
  /** Target entity type */
  target?: string;

  /** Relationship cardinality */
  cardinality?: Cardinality;

  /** Whether the relationship is required */
  required?: boolean;

  /** Relationship type (for special relationships) */
  type?: "ordinal" | "reference";

  /** Scope for ordinal relationships */
  scope?: string;
}

/**
 * Collection metadata.
 */
export interface CollectionMetadata {
  /** Collection author */
  author?: string;

  /** Licence for the collection */
  licence?: string;

  /** Homepage URL */
  homepage?: string;

  /** Tags for categorisation */
  tags?: string[];
}

/**
 * Complete collection definition.
 *
 * The root schema for a v1 or v2 collection.
 */
export interface CollectionDefinition {
  /** Schema URL for validation */
  $schema?: string;

  /** Unique collection identifier (kebab-case) */
  id: string;

  /** Human-readable collection name */
  name: string;

  /** Collection description */
  description?: string;

  /** Schema version (v1 or v2) - explicit in v2 collections */
  schemaVersion?: SchemaVersion;

  /** Semantic version */
  version?: string;

  /** Collection metadata */
  metadata?: CollectionMetadata;

  /** Entity type definitions */
  entityTypes: Record<string, EntityTypeDefinition>;

  /** Relationship definitions */
  relationships?: Record<string, RelationshipDefinition>;

  /** Display configuration */
  display?: DisplayConfig;

  /** Custom UI labels for this collection */
  uiLabels?: Partial<UILabels>;

  /** Collection configuration defaults */
  config?: CollectionConfig;
}

/**
 * Collection configuration for default settings.
 */
export interface CollectionConfig {
  /** Default visual settings */
  defaults?: {
    theme?: "retro" | "modern" | "minimal";
    cardSize?: "small" | "medium" | "large";
    cardAspectRatio?: "3:4" | "5:7" | "1:1";
  };
  /** Card display settings */
  cards?: {
    maxVisibleCards?: number;
    shuffleOnLoad?: boolean;
    cardBackDisplay?: "year" | "logo" | "both" | "none";
  };
  /** Field mapping configuration */
  fieldMapping?: {
    titleField?: string;
    subtitleField?: string;
    footerBadgeField?: string;
    logoField?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  };
}

/**
 * Detect the schema version from a collection definition.
 *
 * @param definition - Collection definition to check
 * @returns Detected schema version
 */
export function detectSchemaVersion(
  definition: CollectionDefinition
): SchemaVersion {
  // Explicit version takes precedence
  if (definition.schemaVersion) {
    return definition.schemaVersion;
  }

  // Check for v2 features
  for (const entityType of Object.values(definition.entityTypes)) {
    for (const field of Object.values(entityType.fields)) {
      if (field.type === "rating" || field.type === "detailUrls") {
        return "v2";
      }
    }
  }

  return "v1";
}

/**
 * Base entity structure.
 *
 * All entities must have an id, and may have images.
 */
export interface BaseEntity {
  /** Unique entity identifier */
  id: string;

  /** Array of images for the entity */
  images?: Image[];
}

/**
 * Generic entity with dynamic fields.
 */
export type Entity = BaseEntity & Record<string, unknown>;

/**
 * Resolved entity with related entities attached.
 */
export interface ResolvedEntity extends Entity {
  /** Resolved relationships (entity objects instead of IDs) */
  _resolved?: Record<string, Entity | Entity[]>;
}

/**
 * Entity file structure (array of entities).
 */
export type EntityFile = Entity[];

/**
 * Loaded collection with resolved entities.
 */
export interface LoadedCollection {
  /** Collection definition */
  definition: CollectionDefinition;

  /** Loaded entities by type */
  entities: Record<string, Entity[]>;

  /** Primary entity type */
  primaryType: string;
}

/**
 * Get the primary entity type from a collection definition.
 */
export function getPrimaryEntityType(
  definition: CollectionDefinition
): string | undefined {
  for (const [typeName, typeDef] of Object.entries(definition.entityTypes)) {
    if (typeDef.primary) {
      return typeName;
    }
  }
  // Return first type if none marked as primary
  const types = Object.keys(definition.entityTypes);
  return types.length > 0 ? types[0] : undefined;
}

/**
 * Check if a field definition references another entity.
 */
export function isReferenceField(field: FieldDefinition): boolean {
  return field.type === "string" && field.ref !== undefined;
}
