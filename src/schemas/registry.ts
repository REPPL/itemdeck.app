/**
 * Schema registry for supported collection types.
 *
 * itemdeck ships with built-in schemas. External repositories declare
 * which schema they use via collection.json, and itemdeck validates
 * and renders accordingly.
 */

import { cardDataSchema } from "./cardData.schema";
import { categorySchema } from "./category.schema";

/**
 * Display field mapping configuration.
 *
 * Maps schema fields to card display elements.
 */
interface DisplayMapping {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  link?: string;
  badge?: string;
  year?: string;
}

/**
 * Schema definition structure.
 */
interface SchemaDefinition {
  version: string;
  description: string;
  items: typeof cardDataSchema;
  categories: typeof categorySchema | null;
  display: DisplayMapping;
}

/**
 * Registry of supported schemas.
 *
 * Each schema defines how to validate and display collection data.
 */
export const schemaRegistry = {
  /**
   * Ranked collection with categories.
   * Personal ranked lists organised by platform, era, or topic.
   */
  "ranked-collection": {
    version: "1.0.0",
    description: "Personal ranked lists with categories",
    items: cardDataSchema,
    categories: categorySchema,
    display: {
      title: "title",
      subtitle: "metadata.category",
      description: "summary",
      image: "imageUrl",
      link: "detailUrl",
      badge: "metadata.rank",
      year: "year",
    },
  },

  /**
   * Simple list without ranking or categories.
   * Basic item collections.
   */
  "simple-list": {
    version: "1.0.0",
    description: "Basic item list without ranking or categories",
    items: cardDataSchema,
    categories: null,
    display: {
      title: "title",
      description: "summary",
      image: "imageUrl",
      link: "detailUrl",
    },
  },

  /**
   * Timeline of chronological events.
   * Events with dates and optional locations.
   */
  timeline: {
    version: "1.0.0",
    description: "Chronological events with dates",
    items: cardDataSchema,
    categories: null,
    display: {
      title: "title",
      subtitle: "year",
      description: "summary",
      image: "imageUrl",
      badge: "metadata.location",
    },
  },
} as const satisfies Record<string, SchemaDefinition>;

/**
 * Type representing valid schema identifiers.
 */
export type SchemaId = keyof typeof schemaRegistry;

/**
 * Check if a schema identifier is supported.
 *
 * @param id - Schema identifier to check
 * @returns True if the schema is supported
 */
export function isValidSchema(id: string): id is SchemaId {
  return id in schemaRegistry;
}

/**
 * Get list of all supported schema identifiers.
 *
 * @returns Array of supported schema names
 */
export function getSupportedSchemas(): SchemaId[] {
  return Object.keys(schemaRegistry) as SchemaId[];
}

/**
 * Get schema definition by identifier.
 *
 * @param id - Schema identifier
 * @returns Schema definition or undefined if not found
 */
export function getSchema(id: string): SchemaDefinition | undefined {
  if (isValidSchema(id)) {
    return schemaRegistry[id];
  }
  return undefined;
}
