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
 * Context for resolving relationships.
 */
export interface ResolverContext {
  /** Collection definition */
  definition: CollectionDefinition;

  /** All loaded entities by type */
  entities: Record<string, Entity[]>;

  /** Entity lookup maps for fast access */
  entityMaps: Record<string, Map<string, Entity>>;
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

  return {
    definition,
    entities,
    entityMaps,
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
  const relationships = context.definition.relationships ?? {};

  // Find relationships that apply to this entity type
  for (const [relKey, relDef] of Object.entries(relationships)) {
    // Relationship keys are in format "entityType.fieldName"
    const [relType, fieldName] = relKey.split(".");

    if (relType !== entityType || !fieldName) {
      continue;
    }

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
      const resolvedEntity = resolveReference(
        fieldValue,
        targetType,
        context
      );
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

    // Check if this field references another entity type
    const targetType = fieldName;
    if (!context.entityMaps[targetType]) {
      continue;
    }

    if (typeof fieldValue === "string" && !resolved[fieldName]) {
      const resolvedEntity = resolveReference(
        fieldValue,
        targetType,
        context
      );
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
  const relationships = context.definition.relationships ?? {};

  // Look for ordinal relationship
  for (const [relKey, relDef] of Object.entries(relationships)) {
    if (relDef.type !== "ordinal") {
      continue;
    }

    const [relType, fieldName] = relKey.split(".");

    if (relType !== entityType || !fieldName) {
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
