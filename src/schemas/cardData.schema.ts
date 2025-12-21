/**
 * Card data schema for runtime validation.
 *
 * Defines the CardData format used by itemdeck for displaying cards.
 * Compatible with the MyPlausibleMe data format.
 */

import { z } from "zod";

/**
 * Schema for individual card data.
 *
 * All fields except id and title are optional to support
 * various data sources with different levels of completeness.
 */
export const cardDataSchema = z.object({
  /** Unique identifier for the card */
  id: z.string().min(1, "Card ID is required"),

  /** Display title for the card */
  title: z.string().min(1, "Card title is required"),

  /** Year associated with the item (displayed on card back) */
  year: z.string().optional(),

  /** URL to the card's front image (deprecated, use imageUrls) */
  imageUrl: z.url().optional(),

  /** Array of image URLs for gallery support */
  imageUrls: z.array(z.url()).optional(),

  /** URL to custom logo for card back */
  logoUrl: z.url().optional(),

  /** Short description or personal notes */
  summary: z.string().optional(),

  /** External reference URL for more details */
  detailUrl: z.url().optional(),

  /** Additional key-value metadata (e.g., category, rank, device) */
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Inferred TypeScript type from the schema.
 */
export type CardData = z.infer<typeof cardDataSchema>;

/**
 * Validate card data, throwing on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated CardData
 * @throws ZodError if validation fails
 */
export function validateCard(data: unknown): CardData {
  return cardDataSchema.parse(data);
}

/**
 * Safely validate card data without throwing.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with success flag and data or error
 */
export function safeValidateCard(data: unknown) {
  return cardDataSchema.safeParse(data);
}

/**
 * Filter an array to only valid cards.
 *
 * Useful when loading data that may contain some invalid entries.
 *
 * @param data - Array of unknown data
 * @returns Object with valid cards and invalid entries
 */
export function filterValidCards(data: unknown[]): {
  valid: CardData[];
  invalid: unknown[];
} {
  const valid: CardData[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    const result = cardDataSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push(item);
    }
  }

  return { valid, invalid };
}
