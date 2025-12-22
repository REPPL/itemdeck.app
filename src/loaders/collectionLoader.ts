/**
 * Collection loader for v1 schema format.
 *
 * Loads and parses collection definitions from JSON files.
 */

import type {
  CollectionDefinition,
  Entity,
  LoadedCollection,
} from "@/types/schema";
import { getPrimaryEntityType } from "@/types/schema";

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

  const data = (await response.json()) as unknown;
  return validateCollectionDefinition(data);
}

/**
 * Load entities of a specific type from a collection.
 *
 * Supports both single file and directory patterns:
 * - `entities/{type}.json` - Single file with array of entities
 * - `entities/{type}/*.json` - Directory with individual entity files
 *
 * @param basePath - Base path to the collection directory
 * @param entityType - Type of entities to load
 * @returns Array of entities
 */
export async function loadEntities(
  basePath: string,
  entityType: string
): Promise<Entity[]> {
  // Try single file first
  const singleFileUrl = `${basePath}/entities/${entityType}.json`;

  try {
    const response = await fetch(singleFileUrl);

    if (response.ok) {
      const data = (await response.json()) as unknown;

      if (Array.isArray(data)) {
        return data as Entity[];
      }

      // Single entity in file
      return [data as Entity];
    }
  } catch {
    // File doesn't exist, try plural form
  }

  // Try plural form
  const pluralFileUrl = `${basePath}/entities/${entityType}s.json`;

  try {
    const response = await fetch(pluralFileUrl);

    if (response.ok) {
      const data = (await response.json()) as unknown;

      if (Array.isArray(data)) {
        return data as Entity[];
      }

      return [data as Entity];
    }
  } catch {
    // Plural file doesn't exist either
  }

  // Return empty array if no entities found
  return [];
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
 * @param data - Unknown data to validate
 * @returns Validated collection definition
 * @throws Error if validation fails
 */
function validateCollectionDefinition(data: unknown): CollectionDefinition {
  if (typeof data !== "object" || data === null) {
    throw new Error("Collection definition must be an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== "string" || obj.id.length === 0) {
    throw new Error("Collection must have a non-empty id");
  }

  if (typeof obj.name !== "string" || obj.name.length === 0) {
    throw new Error("Collection must have a non-empty name");
  }

  if (typeof obj.entityTypes !== "object" || obj.entityTypes === null) {
    throw new Error("Collection must have entityTypes defined");
  }

  return data as CollectionDefinition;
}

/**
 * Check if a path points to a v1 schema collection.
 *
 * @param basePath - Base path to check
 * @returns True if the path contains a v1 collection
 */
export async function isV1Collection(basePath: string): Promise<boolean> {
  try {
    const response = await fetch(`${basePath}/collection.json`);

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as Record<string, unknown>;

    // Check for entityTypes property (v1 schema indicator)
    return "entityTypes" in data;
  } catch {
    return false;
  }
}
