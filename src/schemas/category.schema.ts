/**
 * Category schema for runtime validation.
 *
 * Categories group cards together (e.g., by platform, era, or topic).
 * Used by the ranked-collection schema type.
 */

import { z } from "zod";

/**
 * Schema for category data.
 *
 * Categories have a simpler structure than cards,
 * primarily serving as grouping metadata.
 */
export const categorySchema = z.object({
  /** Unique identifier for the category */
  id: z.string().min(1, "Category ID is required"),

  /** Display title for the category */
  title: z.string().min(1, "Category title is required"),

  /** Year associated with the category */
  year: z.string().optional(),

  /** Category description */
  summary: z.string().optional(),

  /** External reference URL for more details */
  detailUrl: z.string().url().optional(),
});

/**
 * Inferred TypeScript type from the schema.
 */
export type Category = z.infer<typeof categorySchema>;

/**
 * Validate category data, throwing on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated Category
 * @throws ZodError if validation fails
 */
export function validateCategory(data: unknown): Category {
  return categorySchema.parse(data);
}

/**
 * Safely validate category data without throwing.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with success flag and data or error
 */
export function safeValidateCategory(data: unknown) {
  return categorySchema.safeParse(data);
}

/**
 * Filter an array to only valid categories.
 *
 * @param data - Array of unknown data
 * @returns Object with valid categories and invalid entries
 */
export function filterValidCategories(data: unknown[]): {
  valid: Category[];
  invalid: unknown[];
} {
  const valid: Category[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    const result = categorySchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push(item);
    }
  }

  return { valid, invalid };
}
