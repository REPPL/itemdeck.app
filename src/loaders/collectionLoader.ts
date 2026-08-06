/**
 * Collection loader for v1/v2 schema format.
 *
 * Loads and parses collection definitions from JSON files.
 * Supports Zod validation for v2 schemas with helpful error messages.
 *
 * @see F-091: Entity Auto-Discovery (GitHub API fallback)
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
  safeValidateEntity,
  formatValidationError,
} from "@/schemas/v2";
import {
  discoverEntitiesViaGitHub,
  isJsDelivrGitHubUrl,
} from "./githubDiscovery";
import { isAllowedCollectionSource } from "@/config/allowedSources";

/**
 * Fetch a collection resource, refusing non-allowlisted origins.
 *
 * Defence in depth: even if a caller bypasses URL-ingestion checks,
 * no collection data is ever fetched from an origin outside the
 * allowlist (same-origin relative paths are always allowed).
 */
async function fetchAllowed(url: string): Promise<Response> {
  if (!isAllowedCollectionSource(url)) {
    throw new Error(`Refusing to fetch from non-allowlisted source: ${url}`);
  }
  return fetch(url);
}

/**
 * Validate raw data as an entity, tolerantly.
 *
 * Returns the entity when valid; otherwise warns (naming the source and
 * the first validation issue) and returns null so the caller can skip it
 * without aborting the whole collection.
 */
function parseEntityTolerant(data: unknown, source: string): Entity | null {
  const result = safeValidateEntity(data);

  if (result.success) {
    return result.data as Entity;
  }

  const firstIssue = result.error.issues[0];
  const issueText = firstIssue
    ? `${firstIssue.path.join(".") || "(root)"}: ${firstIssue.message}`
    : "unknown validation issue";
  console.warn(`Skipping invalid entity from ${source}: ${issueText}`);
  return null;
}

/**
 * Load a collection definition from a path.
 *
 * @param basePath - Base path to the collection directory
 * @returns Loaded collection definition
 */
export async function loadCollectionDefinition(
  basePath: string
): Promise<CollectionDefinition> {
  const response = await fetchAllowed(`${basePath}/collection.json`);

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
 * 3. GitHub API auto-discovery - List directory via GitHub Contents API (F-091)
 * 4. `{type}s.json` - Plural form single file with array
 * 5. `{type}.json` - Single file with array of entities
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
      const response = await fetchAllowed(url);

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

  // Pattern 2: GitHub API auto-discovery (F-091)
  // Only works for jsDelivr GitHub CDN URLs
  const entityDirectoryUrl = `${basePath}/${pluralType}`;
  if (isJsDelivrGitHubUrl(entityDirectoryUrl)) {
    try {
      const discoveredIds = await discoverEntitiesViaGitHub(entityDirectoryUrl);

      if (discoveredIds && discoveredIds.length > 0) {
        // Load individual entity files using discovered IDs
        const entities = await loadEntitiesFromDirectory(
          entityDirectoryUrl,
          discoveredIds
        );
        return entities;
      }
    } catch {
      // GitHub API discovery failed, continue to next pattern
    }
  }

  // Pattern 3: Try plural form single file
  const pluralFileUrl = `${basePath}/${entityType}s.json`;

  try {
    const response = await fetchAllowed(pluralFileUrl);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as unknown;

        if (Array.isArray(data)) {
          return data
            .map((item, index) =>
              parseEntityTolerant(item, `${pluralFileUrl}[${String(index)}]`)
            )
            .filter((entity): entity is Entity => entity !== null);
        }

        const single = parseEntityTolerant(data, pluralFileUrl);
        return single ? [single] : [];
      }
    }
  } catch {
    // Plural file doesn't exist
  }

  // Pattern 3: Try singular form single file
  const singleFileUrl = `${basePath}/${entityType}.json`;

  try {
    const response = await fetchAllowed(singleFileUrl);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as unknown;

        if (Array.isArray(data)) {
          return data
            .map((item, index) =>
              parseEntityTolerant(item, `${singleFileUrl}[${String(index)}]`)
            )
            .filter((entity): entity is Entity => entity !== null);
        }

        // Single entity in file
        const single = parseEntityTolerant(data, singleFileUrl);
        return single ? [single] : [];
      }
    }
  } catch {
    // File doesn't exist
  }

  // Return empty array if no entities found
  return [];
}

/**
 * Maximum number of entity fetches in flight at once.
 *
 * An untrusted index.json can list an unbounded number of ids. Firing every
 * fetch synchronously (Promise.all over the whole list) stalls the main
 * thread and floods the CDN, so keep a fixed number in flight instead,
 * mirroring the batching in services/imageCache.ts.
 */
const ENTITY_FETCH_CONCURRENCY = 8;

/**
 * Upper bound on the number of entity ids loaded from a single directory.
 *
 * A generous safety valve: a hostile index.json listing millions of ids would
 * otherwise amplify one collection load into that many CDN requests. Real
 * collections stay far below this.
 */
const MAX_ENTITY_IDS = 10000;

/**
 * Upper bound on the number of entity types loaded from one collection.
 *
 * `collection.json` is untrusted and its `entityTypes` record is unbounded.
 * Each type triggers several fetches (index probes, GitHub discovery, single-
 * file fallbacks) before resolving, so an entity-type count scaled by an
 * attacker multiplies one collection load into a request flood against the
 * CDN and the visitor's GitHub API quota. Cap the count and load the types
 * through the same fixed-size pool used for entity ids. Real collections use
 * a handful of types.
 */
const MAX_ENTITY_TYPES = 50;

/**
 * Number of entity types loaded concurrently. Bounds the per-type fetch
 * fan-out (each type issues its own probes) to a fixed width.
 */
const ENTITY_TYPE_CONCURRENCY = 4;

/**
 * Load individual entity files from a directory.
 *
 * Fetches run through a fixed-size concurrency pool so an untrusted index
 * listing a huge number of ids cannot stall the tab or flood the CDN.
 *
 * @param directoryPath - Path to the entity directory
 * @param entityIds - Array of entity IDs to load
 * @returns Array of loaded entities
 */
async function loadEntitiesFromDirectory(
  directoryPath: string,
  entityIds: string[]
): Promise<Entity[]> {
  let ids = entityIds;
  if (ids.length > MAX_ENTITY_IDS) {
    console.warn(
      `Entity index lists ${String(ids.length)} ids; loading the first ${String(MAX_ENTITY_IDS)}.`
    );
    ids = ids.slice(0, MAX_ENTITY_IDS);
  }

  // Preserve input order regardless of the order fetches settle in.
  const results = new Array<Entity | null>(ids.length).fill(null);

  const loadOne = async (index: number, id: string): Promise<void> => {
    const entityUrl = `${directoryPath}/${id}.json`;

    try {
      const response = await fetchAllowed(entityUrl);

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = (await response.json()) as unknown;
          results[index] = parseEntityTolerant(data, entityUrl);
        }
      }
    } catch {
      console.warn(`Failed to load entity: ${entityUrl}`);
    }
  };

  // Fixed-size concurrency pool: keep ENTITY_FETCH_CONCURRENCY fetches in
  // flight rather than initiating every fetch at once.
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < ids.length) {
      const index = cursor;
      cursor += 1;
      const id = ids[index];
      if (id === undefined) continue;
      await loadOne(index, id);
    }
  };

  const workerCount = Math.min(ENTITY_FETCH_CONCURRENCY, ids.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

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

  // Load entity types through a fixed-size pool. Each type fans out into
  // several fetches, and the type list comes from untrusted collection.json,
  // so cap the count and bound concurrency rather than firing every type at
  // once (mirrors loadEntitiesFromDirectory's pool for entity ids).
  let entityTypes = Object.keys(definition.entityTypes);
  if (entityTypes.length > MAX_ENTITY_TYPES) {
    console.warn(
      `Collection defines ${String(entityTypes.length)} entity types; loading the first ${String(MAX_ENTITY_TYPES)}.`
    );
    // Always keep the primary type even if it sorts past the cap.
    const capped = entityTypes.slice(0, MAX_ENTITY_TYPES);
    if (!capped.includes(primaryType)) {
      capped[capped.length - 1] = primaryType;
    }
    entityTypes = capped;
  }

  const entities: Record<string, Entity[]> = {};

  let typeCursor = 0;
  const typeWorker = async (): Promise<void> => {
    while (typeCursor < entityTypes.length) {
      const index = typeCursor;
      typeCursor += 1;
      const type = entityTypes[index];
      if (type === undefined) continue;
      entities[type] = await loadEntities(basePath, type);
    }
  };

  const typeWorkerCount = Math.min(ENTITY_TYPE_CONCURRENCY, entityTypes.length);
  await Promise.all(
    Array.from({ length: typeWorkerCount }, () => typeWorker())
  );

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
export function getSchemaVersion(
  definition: CollectionDefinition
): SchemaVersion {
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
    const response = await fetchAllowed(`${basePath}/collection.json`);

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
