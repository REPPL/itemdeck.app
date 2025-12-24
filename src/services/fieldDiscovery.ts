/**
 * Field discovery service.
 *
 * Provides dynamic field discovery from collection schemas,
 * replacing hardcoded field options with schema-driven options.
 */

import type {
  CollectionDefinition,
  EntityTypeDefinition,
  FieldDefinition,
  FieldType,
} from "@/types/schema";
import type { FieldOption } from "@/utils/fieldPathResolver";

/**
 * Context types for field discovery.
 *
 * Different UI contexts need different field types:
 * - title: string fields (for card titles)
 * - subtitle: string, number, or date fields
 * - badge: short strings or numbers (for corner badges)
 * - footer: strings (for footer text)
 * - logo: image fields or URLs
 * - sort: any comparable field (string, number, date)
 */
export type FieldContext =
  | "title"
  | "subtitle"
  | "badge"
  | "footer"
  | "logo"
  | "sort"
  | "image";

/**
 * Field types suitable for each context.
 */
const CONTEXT_FIELD_TYPES: Record<FieldContext, FieldType[]> = {
  title: ["string"],
  subtitle: ["string", "number", "date", "text"],
  badge: ["string", "number"],
  footer: ["string", "number", "date"],
  logo: ["images", "url"],
  sort: ["string", "number", "date", "enum"],
  image: ["images"],
};

/**
 * Convert field name to title case label.
 *
 * @param name - Field name in camelCase or snake_case
 * @returns Title case label
 */
function toTitleCase(name: string): string {
  return name
    // Split on camelCase boundaries
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Split on underscores
    .replace(/_/g, " ")
    // Capitalise first letter of each word
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Check if a field type is suitable for a given context.
 *
 * @param fieldType - Field type to check
 * @param context - UI context
 * @returns True if the field type is suitable
 */
function isFieldSuitableFor(fieldType: FieldType, context: FieldContext): boolean {
  return CONTEXT_FIELD_TYPES[context].includes(fieldType);
}

/**
 * Discover fields for a specific context from an entity type.
 *
 * @param entityType - Entity type definition
 * @param context - UI context for field filtering
 * @param prefix - Field path prefix (for nested fields)
 * @returns Array of field options
 */
function discoverEntityFields(
  entityType: EntityTypeDefinition,
  context: FieldContext,
  prefix = ""
): FieldOption[] {
  const options: FieldOption[] = [];

  for (const [name, field] of Object.entries(entityType.fields)) {
    const fieldDef = field as FieldDefinition;
    const fieldPath = prefix ? `${prefix}.${name}` : name;

    if (isFieldSuitableFor(fieldDef.type, context)) {
      options.push({
        value: fieldPath,
        label: prefix ? `${toTitleCase(prefix)} ${toTitleCase(name)}` : toTitleCase(name),
        type: fieldDef.type === "number" ? "number" : fieldDef.type === "date" ? "date" : "string",
      });
    }
  }

  return options;
}

/**
 * Discover fields from related entity types.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @param context - UI context for field filtering
 * @returns Array of field options from related entities
 */
function discoverRelatedFields(
  definition: CollectionDefinition,
  primaryType: string,
  context: FieldContext
): FieldOption[] {
  const options: FieldOption[] = [];
  const primaryEntity = definition.entityTypes[primaryType];

  if (!primaryEntity) {
    return options;
  }

  // Find fields that reference other entity types
  for (const [fieldName, field] of Object.entries(primaryEntity.fields)) {
    const fieldDef = field as FieldDefinition;

    if (fieldDef.ref) {
      const relatedEntity = definition.entityTypes[fieldDef.ref];
      if (relatedEntity) {
        const relatedOptions = discoverEntityFields(
          relatedEntity,
          context,
          fieldName
        );
        options.push(...relatedOptions);
      }
    }
  }

  // Also check relationships
  if (definition.relationships) {
    for (const [relName, relDef] of Object.entries(definition.relationships)) {
      // Parse relationship name (e.g., "game.platform" -> fieldName "platform")
      const parts = relName.split(".");
      const fieldName = parts.length > 1 ? parts[1] : relName;

      if (relDef.target) {
        const relatedEntity = definition.entityTypes[relDef.target];
        if (relatedEntity) {
          // Check if we already have this from ref fields
          const alreadyAdded = options.some((opt) => opt.value.startsWith(`${fieldName}.`));
          if (!alreadyAdded) {
            const relatedOptions = discoverEntityFields(
              relatedEntity,
              context,
              fieldName
            );
            options.push(...relatedOptions);
          }
        }
      }
    }
  }

  return options;
}

/**
 * Discover all fields suitable for a context from a collection.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @param context - UI context for field filtering
 * @returns Array of field options sorted by relevance
 */
export function discoverFieldsForContext(
  definition: CollectionDefinition,
  primaryType: string,
  context: FieldContext
): FieldOption[] {
  const primaryEntity = definition.entityTypes[primaryType];

  if (!primaryEntity) {
    return [];
  }

  // Get direct fields
  const directFields = discoverEntityFields(primaryEntity, context);

  // Get related fields
  const relatedFields = discoverRelatedFields(definition, primaryType, context);

  // Combine and add "none" option for appropriate contexts
  const options = [...directFields, ...relatedFields];

  if (context !== "title" && context !== "sort") {
    options.push({ value: "none", label: "None" });
  }

  return options;
}

/**
 * Get field options for title configuration.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @returns Array of field options
 */
export function getTitleFieldOptions(
  definition: CollectionDefinition,
  primaryType: string
): FieldOption[] {
  return discoverFieldsForContext(definition, primaryType, "title");
}

/**
 * Get field options for subtitle configuration.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @returns Array of field options
 */
export function getSubtitleFieldOptions(
  definition: CollectionDefinition,
  primaryType: string
): FieldOption[] {
  return discoverFieldsForContext(definition, primaryType, "subtitle");
}

/**
 * Get field options for badge configuration.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @returns Array of field options
 */
export function getBadgeFieldOptions(
  definition: CollectionDefinition,
  primaryType: string
): FieldOption[] {
  return discoverFieldsForContext(definition, primaryType, "badge");
}

/**
 * Get field options for footer configuration.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @returns Array of field options
 */
export function getFooterFieldOptions(
  definition: CollectionDefinition,
  primaryType: string
): FieldOption[] {
  return discoverFieldsForContext(definition, primaryType, "footer");
}

/**
 * Get field options for logo configuration.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @returns Array of field options
 */
export function getLogoFieldOptions(
  definition: CollectionDefinition,
  primaryType: string
): FieldOption[] {
  const options = discoverFieldsForContext(definition, primaryType, "logo");

  // Ensure "none" means use app logo
  const noneIndex = options.findIndex((opt) => opt.value === "none");
  if (noneIndex >= 0 && options[noneIndex]) {
    options[noneIndex].label = "None (App Logo)";
  }

  return options;
}

/**
 * Get field options for sort configuration.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @returns Array of field options
 */
export function getSortFieldOptions(
  definition: CollectionDefinition,
  primaryType: string
): FieldOption[] {
  return discoverFieldsForContext(definition, primaryType, "sort");
}

/**
 * Get all discoverable fields from a collection.
 *
 * @param definition - Collection definition
 * @param primaryType - Primary entity type name
 * @returns Record of context to field options
 */
export function discoverAllFields(
  definition: CollectionDefinition,
  primaryType: string
): Record<FieldContext, FieldOption[]> {
  return {
    title: getTitleFieldOptions(definition, primaryType),
    subtitle: getSubtitleFieldOptions(definition, primaryType),
    badge: getBadgeFieldOptions(definition, primaryType),
    footer: getFooterFieldOptions(definition, primaryType),
    logo: getLogoFieldOptions(definition, primaryType),
    sort: getSortFieldOptions(definition, primaryType),
    image: discoverFieldsForContext(definition, primaryType, "image"),
  };
}
