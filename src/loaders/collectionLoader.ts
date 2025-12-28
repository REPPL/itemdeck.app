/**
 * Collection loader for v1/v2 schema format.
 *
 * Loads and parses collection definitions from JSON files.
 * Supports Zod validation for v2 schemas with helpful error messages.
 */

import type {
  CollectionDefinition,
  Entity,
  LoadedCollection,
  SchemaVersion,
} from "@/types/schema";
import { getPrimaryEntityType, detectSchemaVersion } from "@/types/schema";
import {
  safeValidateCollectionDefinition,
  formatValidationError,
} from "@/schemas/v2";

/**
 * Load a collection definition from a path.
 *
 * @param basePath - Base path to the collection directory
 * @returns Loaded collection definition
 */
export async function loadCollectionDefinition(
  basePath: string
): Promise<CollectionDefinition> {
  const response = await fetch(`${basePath}/collection.json`);

  if (!response.ok) {
    throw new Error(
      `Failed to load collection definition: ${String(response.status)}`
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(
      `Invalid content type for collection definition: ${contentType ?? "unknown"}`
    );
  }

  const data = (await response.json()) as unknown;
  return validateCollectionDefinition(data);
}

/**
 * Extract entity IDs from index file data.
 *
 * Supports two formats:
 * - Array format: `["id1", "id2", ...]`
 * - Object format: `{ "entityTypePlural": ["id1", "id2", ...] }`
 *
 * @param data - Parsed JSON data from index file
 * @param pluralType - Plural form of entity type (used as key in object format)
 * @returns Array of entity ID strings
 */
function extractEntityIds(data: unknown, pluralType: string): string[] {
  // Format 1: Direct array
  if (Array.isArray(data)) {
    return data.filter((id): id is string => typeof id === "string");
  }

  // Format 2: Object with entity type key
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;

    // Try plural form key (e.g., "adverts")
    if (pluralType in record && Array.isArray(record[pluralType])) {
      return (record[pluralType] as unknown[]).filter(
        (id): id is string => typeof id === "string"
      );
    }

    // Try singular form key (e.g., "advert") - just in case
    const singularType = pluralType.replace(/s$/, "");
    if (singularType in record && Array.isArray(record[singularType])) {
      return (record[singularType] as unknown[]).filter(
        (id): id is string => typeof id === "string"
      );
    }

    // Try common keys like "items", "entities", "ids"
    for (const key of ["items", "entities", "ids"]) {
      if (key in record && Array.isArray(record[key])) {
        return (record[key] as unknown[]).filter(
          (id): id is string => typeof id === "string"
        );
      }
    }
  }

  return [];
}

/**
 * Load entities of a specific type from a collection.
 *
 * Supports multiple patterns in order:
 * 1. `{type}s/index.json` - Index file listing entity IDs to load (plural folder)
 * 2. `{type}s/_index.json` - Alternative index file location
 * 3. `{type}s.json` - Plural form single file with array
 * 4. `{type}.json` - Single file with array of entities
 *
 * For index-based loading, the index file can contain:
 * - An array of entity IDs: `["id1", "id2", ...]`
 * - An object with entity type key: `{ "entityTypes": ["id1", "id2", ...] }`
 *
 * Individual entities are then loaded from `{type}s/{id}.json`.
 *
 * @param basePath - Base path to the collection directory
 * @param entityType - Type of entities to load (singular form, e.g., "advert")
 * @returns Array of entities
 */
export async function loadEntities(
  basePath: string,
  entityType: string
): Promise<Entity[]> {
  // Pluralise entity type for folder name
  const pluralType = `${entityType}s`;

  // Pattern 1: Try index.json in entity type directory
  const indexUrl = `${basePath}/${pluralType}/index.json`;
  const altIndexUrl = `${basePath}/${pluralType}/_index.json`;

  // Try index-based loading first
  for (const url of [indexUrl, altIndexUrl]) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        // Verify content type is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const indexData = (await response.json()) as unknown;

          // Extract entity IDs from either array or object format
          const entityIds = extractEntityIds(indexData, pluralType);

          if (entityIds.length > 0) {
            // Load individual entity files
            const entities = await loadEntitiesFromDirectory(
              `${basePath}/${pluralType}`,
              entityIds
            );
            return entities;
          }
        }
      }
    } catch {
      // Index file doesn't exist, continue to next pattern
    }
  }

  // Pattern 2: Try plural form single file
  const pluralFileUrl = `${basePath}/${entityType}s.json`;

  try {
    const response = await fetch(pluralFileUrl);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as unknown;

        if (Array.isArray(data)) {
          return data as Entity[];
        }

        return [data as Entity];
      }
    }
  } catch {
    // Plural file doesn't exist
  }

  // Pattern 3: Try singular form single file
  const singleFileUrl = `${basePath}/${entityType}.json`;

  try {
    const response = await fetch(singleFileUrl);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as unknown;

        if (Array.isArray(data)) {
          return data as Entity[];
        }

        // Single entity in file
        return [data as Entity];
      }
    }
  } catch {
    // File doesn't exist
  }

  // Return empty array if no entities found
  return [];
}

/**
 * Load individual entity files from a directory.
 *
 * @param directoryPath - Path to the entity directory
 * @param entityIds - Array of entity IDs to load
 * @returns Array of loaded entities
 */
async function loadEntitiesFromDirectory(
  directoryPath: string,
  entityIds: string[]
): Promise<Entity[]> {
  const entityPromises = entityIds.map(async (id) => {
    const entityUrl = `${directoryPath}/${id}.json`;

    try {
      const response = await fetch(entityUrl);

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          return (await response.json()) as Entity;
        }
      }
    } catch {
      console.warn(`Failed to load entity: ${entityUrl}`);
    }

    return null;
  });

  const results = await Promise.all(entityPromises);
  return results.filter((entity): entity is Entity => entity !== null);
}

/**
 * Load a complete collection with all entities.
 *
 * @param basePath - Base path to the collection directory
 * @returns Loaded collection with definition and entities
 */
export async function loadCollection(
  basePath: string
): Promise<LoadedCollection> {
  // Load collection definition
  const definition = await loadCollectionDefinition(basePath);

  // Determine primary entity type
  const primaryType = getPrimaryEntityType(definition);

  if (!primaryType) {
    throw new Error("Collection has no entity types defined");
  }

  // Load all entity types in parallel
  const entityTypes = Object.keys(definition.entityTypes);
  const entityPromises = entityTypes.map(async (type) => {
    const entities = await loadEntities(basePath, type);
    return { type, entities };
  });

  const entityResults = await Promise.all(entityPromises);

  // Build entities map
  const entities: Record<string, Entity[]> = {};
  for (const { type, entities: typeEntities } of entityResults) {
    entities[type] = typeEntities;
  }

  return {
    definition,
    entities,
    primaryType,
  };
}

/**
 * Validate that data is a valid collection definition.
 *
 * Uses Zod validation for comprehensive type checking with helpful error messages.
 *
 * @param data - Unknown data to validate
 * @returns Validated collection definition
 * @throws Error if validation fails
 */
function validateCollectionDefinition(data: unknown): CollectionDefinition {
  // Use Zod for comprehensive validation
  const result = safeValidateCollectionDefinition(data);

  if (result.success) {
    return result.data as CollectionDefinition;
  }

  // Format validation errors for helpful messages
  const errorMessage = formatValidationError(result.error);
  throw new Error(`Invalid collection definition:\n${errorMessage}`);
}

/**
 * Get the schema version of a collection.
 *
 * @param definition - Collection definition
 * @returns Schema version (v1 or v2)
 */
export function getSchemaVersion(definition: CollectionDefinition): SchemaVersion {
  return detectSchemaVersion(definition);
}

/**
 * Check if a path points to a v1 schema collection.
 *
 * @param basePath - Base path to check
 * @returns True if the path contains a v1 collection
 */
export async function isV1Collection(basePath: string): Promise<boolean> {
  const version = await detectCollectionVersion(basePath);
  return version === "v1";
}

/**
 * Check if a path points to a v2 schema collection.
 *
 * @param basePath - Base path to check
 * @returns True if the path contains a v2 collection
 */
export async function isV2Collection(basePath: string): Promise<boolean> {
  const version = await detectCollectionVersion(basePath);
  return version === "v2";
}

/**
 * Detect the schema version of a collection at a path.
 *
 * @param basePath - Base path to check
 * @returns Schema version or undefined if not a valid collection
 */
export async function detectCollectionVersion(
  basePath: string
): Promise<SchemaVersion | undefined> {
  try {
    const response = await fetch(`${basePath}/collection.json`);

    if (!response.ok) {
      return undefined;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return undefined;
    }

    const data = (await response.json()) as Record<string, unknown>;

    // Check for entityTypes property (required for both v1 and v2)
    if (!("entityTypes" in data)) {
      return undefined;
    }

    // Use detectSchemaVersion for accurate version detection
    return detectSchemaVersion(data as unknown as CollectionDefinition);
  } catch {
    return undefined;
  }
}
