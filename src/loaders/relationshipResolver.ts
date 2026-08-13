/**
 * Relationship resolver for v1 schema format.
 *
 * Resolves foreign key references between entities.
 */

import type {
  CollectionDefinition,
  Entity,
  ResolvedEntity,
  RelationshipDefinition,
} from "@/types/schema";

/**
 * Upper bound on the number of relationship definitions honoured from an
 * untrusted collection.json.
 *
 * The relationship record is `type.field` keyed and unbounded in the schema.
 * Grouping keeps the per-entity work proportional to the entries for one type,
 * but a record where every key shares the primary type's prefix collapses into
 * a single bucket, so both the resolve pass and the per-card rank pass become
 * O(relationships x entities) — a synchronous multi-minute main-thread freeze
 * on a crafted payload. Cap the record the way entity types and ids are
 * already capped (MAX_ENTITY_TYPES, MAX_ENTITY_IDS). Real collections declare
 * a handful of relationships, so the ceiling is far above any honest use.
 */
export const MAX_RELATIONSHIPS = 200;

/**
 * Context for resolving relationships.
 */
export interface ResolverContext {
  /** Collection definition */
  definition: CollectionDefinition;

  /** All loaded entities by type */
  entities: Record<string, Entity[]>;

  /** Entity lookup maps for fast access */
  entityMaps: Record<string, Map<string, Entity>>;

  /**
   * Relationship definitions grouped by the entity type they apply to.
   *
   * Both the relationship record and the entity list come from untrusted
   * collection JSON and neither is capped, so rebuilding the entries for
   * every entity multiplies the two dimensions and makes the load cost grow
   * with the square of the payload. Grouping once keeps it linear.
   */
  relationshipsByType: Map<string, [string, RelationshipDefinition][]>;
}

/**
 * Create a resolver context from loaded data.
 *
 * @param definition - Collection definition
 * @param entities - Loaded entities by type
 * @returns Resolver context with entity maps
 */
export function createResolverContext(
  definition: CollectionDefinition,
  entities: Record<string, Entity[]>
): ResolverContext {
  // Build lookup maps for each entity type
  const entityMaps: Record<string, Map<string, Entity>> = {};

  for (const [type, typeEntities] of Object.entries(entities)) {
    const map = new Map<string, Entity>();
    for (const entity of typeEntities) {
      map.set(entity.id, entity);
    }
    entityMaps[type] = map;
  }

  // Group relationships by the entity type in their "type.field" key once,
  // so neither the resolve nor the rank loop rescans the whole record per
  // entity.
  const relationshipsByType = new Map<
    string,
    [string, RelationshipDefinition][]
  >();

  const relationshipEntries = Object.entries(definition.relationships ?? {});
  if (relationshipEntries.length > MAX_RELATIONSHIPS) {
    console.warn(
      `Collection declares ${String(relationshipEntries.length)} relationships; ` +
        `only the first ${String(MAX_RELATIONSHIPS)} are resolved.`
    );
  }

  for (const [relKey, relDef] of relationshipEntries.slice(0, MAX_RELATIONSHIPS)) {
    const [relType, fieldName] = relKey.split(".");
    if (!relType || !fieldName) {
      continue;
    }
    const forType = relationshipsByType.get(relType);
    if (forType) {
      forType.push([fieldName, relDef]);
    } else {
      relationshipsByType.set(relType, [[fieldName, relDef]]);
    }
  }

  return {
    definition,
    entities,
    entityMaps,
    relationshipsByType,
  };
}

/**
 * Resolve a single entity reference.
 *
 * @param entityId - ID of the referenced entity
 * @param targetType - Type of the target entity
 * @param context - Resolver context
 * @returns Resolved entity or undefined if not found
 */
export function resolveReference(
  entityId: string,
  targetType: string,
  context: ResolverContext
): Entity | undefined {
  // `targetType` comes from untrusted relationship data (`relDef.target`) or an
  // entity field name, so a value like "toString" would otherwise resolve to an
  // inherited Object.prototype member and throw `map.get is not a function`,
  // failing the whole collection load. Only follow own map entries.
  if (!Object.hasOwn(context.entityMaps, targetType)) {
    return undefined;
  }
  // An own entry is always a real Map (see createResolverContext); the optional
  // chain only satisfies noUncheckedIndexedAccess and never fires at runtime.
  const map = context.entityMaps[targetType];
  return map?.get(entityId);
}

/**
 * Resolve all relationships for a single entity.
 *
 * @param entity - Entity to resolve relationships for
 * @param entityType - Type of the entity
 * @param context - Resolver context
 * @returns Entity with resolved relationships attached
 */
export function resolveEntityRelationships(
  entity: Entity,
  entityType: string,
  context: ResolverContext
): ResolvedEntity {
  const resolved: Record<string, Entity | Entity[]> = {};

  // Relationships are pre-grouped by entity type, so only the entries that
  // apply to this type are visited.
  for (const [fieldName, relDef] of context.relationshipsByType.get(
    entityType
  ) ?? []) {
    const fieldValue = entity[fieldName];

    if (fieldValue === undefined) {
      continue;
    }

    // Handle different relationship types
    if (relDef.type === "ordinal") {
      // Ordinal relationships are just numbers, no resolution needed
      continue;
    }

    const targetType = relDef.target ?? fieldName;

    if (typeof fieldValue === "string") {
      // Single reference
      const resolvedEntity = resolveReference(fieldValue, targetType, context);
      if (resolvedEntity) {
        resolved[fieldName] = resolvedEntity;
      }
    } else if (Array.isArray(fieldValue)) {
      // Array of references
      const resolvedEntities = fieldValue
        .filter((id): id is string => typeof id === "string")
        .map((id) => resolveReference(id, targetType, context))
        .filter((e): e is Entity => e !== undefined);
      resolved[fieldName] = resolvedEntities;
    }
  }

  // Also check for implicit relationships (field name matches entity type)
  for (const [fieldName, fieldValue] of Object.entries(entity)) {
    if (fieldName === "id" || fieldName === "images") {
      continue;
    }

    // Check if this field references another entity type. Use an own-property
    // check so an entity field literally named after an Object.prototype member
    // (e.g. "toString") is not mistaken for a real entity map.
    const targetType = fieldName;
    if (!Object.hasOwn(context.entityMaps, targetType)) {
      continue;
    }

    if (typeof fieldValue === "string" && !resolved[fieldName]) {
      const resolvedEntity = resolveReference(fieldValue, targetType, context);
      if (resolvedEntity) {
        resolved[fieldName] = resolvedEntity;
      }
    }
  }

  if (Object.keys(resolved).length === 0) {
    return entity;
  }

  return {
    ...entity,
    _resolved: resolved,
  };
}

/**
 * Resolve relationships for all entities of a type.
 *
 * @param entityType - Type of entities to resolve
 * @param context - Resolver context
 * @returns Array of entities with resolved relationships
 */
export function resolveAllRelationships(
  entityType: string,
  context: ResolverContext
): ResolvedEntity[] {
  const entities = context.entities[entityType] ?? [];

  return entities.map((entity) =>
    resolveEntityRelationships(entity, entityType, context)
  );
}

/**
 * Get the ordinal rank of an entity within its group.
 *
 * @param entity - Entity to get rank for
 * @param entityType - Type of the entity
 * @param context - Resolver context
 * @returns Rank number or null if not ranked
 */
export function getEntityRank(
  entity: Entity,
  entityType: string,
  context: ResolverContext
): number | null {
  // Look for ordinal relationship among this type's relationships only
  for (const [fieldName, relDef] of context.relationshipsByType.get(
    entityType
  ) ?? []) {
    if (relDef.type !== "ordinal") {
      continue;
    }

    const rankValue = entity[fieldName];

    if (typeof rankValue === "number") {
      return rankValue;
    }

    if (typeof rankValue === "string") {
      const parsed = parseInt(rankValue, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  // Check for implicit rank field (support both rank and myRank)
  const rankValue = entity.rank ?? entity.myRank;

  if (typeof rankValue === "number") {
    return rankValue;
  }

  if (typeof rankValue === "string") {
    const parsed = parseInt(rankValue, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Get relationship definition for an entity type and field.
 *
 * @param entityType - Entity type
 * @param fieldName - Field name
 * @param context - Resolver context
 * @returns Relationship definition or undefined
 */
export function getRelationshipDefinition(
  entityType: string,
  fieldName: string,
  context: ResolverContext
): RelationshipDefinition | undefined {
  const relationships = context.definition.relationships ?? {};
  return relationships[`${entityType}.${fieldName}`];
}
