/**
 * Schema type definitions for the v1 collection format.
 *
 * Defines the Entity-Relationship data model for flexible collections.
 */

import type { Image } from "./image";
import type { DisplayConfig } from "./display";

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
  | "images";

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
 * The root schema for a v1 collection.
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
