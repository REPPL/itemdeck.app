/**
 * Collection schema for runtime validation.
 *
 * A collection combines items (cards) with categories,
 * representing a complete dataset for display.
 */

import { z } from "zod";
import { cardDataSchema, type CardData } from "./cardData.schema";
import { categorySchema, type Category } from "./category.schema";

/**
 * Collection metadata schema.
 *
 * Describes the collection itself, including schema type and display options.
 */
export const collectionMetaSchema = z.object({
  /** Collection name */
  name: z.string().min(1, "Collection name is required"),

  /** Collection description */
  description: z.string().optional(),

  /** Version of the collection data */
  version: z.string().optional(),

  /** Schema type identifier */
  schema: z.string().optional(),

  /** Version of the schema */
  schemaVersion: z.string().optional(),

  /** Display configuration */
  display: z
    .object({
      cardBack: z
        .object({
          showLogo: z.boolean().optional(),
          showCategory: z.boolean().optional(),
          showYear: z.boolean().optional(),
        })
        .optional(),
      cardFront: z
        .object({
          showImage: z.boolean().optional(),
          showTitle: z.boolean().optional(),
          showDescription: z.boolean().optional(),
          showLink: z.boolean().optional(),
        })
        .optional(),
      theme: z.string().optional(),
      themeVersion: z.string().optional(),
    })
    .optional(),

  /** Additional metadata */
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Complete collection schema.
 *
 * Combines items, categories, and optional metadata.
 */
export const collectionSchema = z.object({
  /** Array of card items */
  items: z.array(cardDataSchema),

  /** Array of categories (may be empty for simple-list schema) */
  categories: z.array(categorySchema),

  /** Optional collection metadata */
  meta: collectionMetaSchema.optional(),
});

/**
 * Inferred TypeScript types from schemas.
 */
export type CollectionMeta = z.infer<typeof collectionMetaSchema>;
export type Collection = z.infer<typeof collectionSchema>;

/**
 * Validate collection data, throwing on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated Collection
 * @throws ZodError if validation fails
 */
export function validateCollection(data: unknown): Collection {
  return collectionSchema.parse(data);
}

/**
 * Safely validate collection data without throwing.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with success flag and data or error
 */
export function safeValidateCollection(data: unknown) {
  return collectionSchema.safeParse(data);
}

/**
 * Card with its associated category attached.
 */
export interface CardWithCategory extends CardData {
  category?: Category;
}

/**
 * Join cards with their categories based on metadata.category field.
 *
 * @param cards - Array of card data
 * @param categories - Array of category data
 * @returns Cards with category information attached
 */
export function joinCardsWithCategories(
  cards: CardData[],
  categories: Category[]
): CardWithCategory[] {
  const categoryMap = new Map(
    categories.map((c) => [c.id.toLowerCase(), c])
  );

  return cards.map((card) => {
    const categoryId = card.metadata?.category?.toLowerCase();
    const category = categoryId ? categoryMap.get(categoryId) : undefined;

    return {
      ...card,
      category,
    };
  });
}
