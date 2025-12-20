/**
 * Represents the data structure for a single card in the grid.
 */
export interface CardData {
  /** Unique identifier for the card */
  id: string;

  /** Display title for the card */
  title: string;

  /** Optional year or date string (displayed on card back) */
  year?: string;

  /** URL to the card's front image */
  imageUrl: string;

  /** Optional URL to custom logo for card back */
  logoUrl?: string;

  /** Optional short description */
  summary?: string;

  /** Optional URL for more details */
  detailUrl?: string;

  /** Optional additional metadata as key-value pairs */
  metadata?: Record<string, string>;
}
