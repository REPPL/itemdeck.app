/**
 * Type definitions for question generators.
 */

import type { Question, QuestionType } from "../types";

/**
 * Card data required for question generation.
 * Matches DisplayCard structure from collection context.
 */
export interface GeneratorCardData {
  /** Card ID */
  id: string;
  /** Card title */
  title: string;
  /** Primary image URL */
  imageUrl: string;
  /** Optional year */
  year?: string;
  /** Category short name */
  categoryShort?: string;
  /** Category title */
  categoryTitle?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Options for question generation.
 */
export interface GeneratorOptions {
  /** Maximum number of questions to generate */
  count: number;
  /** Cards to exclude (already used) */
  excludeCardIds?: Set<string>;
  /** Use similar cards as distractors (for harder difficulty) */
  useSimilarDistractors?: boolean;
}

/**
 * Result of a generator check.
 */
export interface GeneratorCheckResult {
  /** Whether the generator can produce questions */
  canGenerate: boolean;
  /** Reason if cannot generate */
  reason?: string;
  /** Available cards for this generator */
  availableCards?: GeneratorCardData[];
}

/**
 * Question generator interface.
 */
export interface QuestionGenerator {
  /** Generator type */
  type: QuestionType;

  /**
   * Check if this generator can produce questions from the cards.
   */
  canGenerate(cards: GeneratorCardData[]): GeneratorCheckResult;

  /**
   * Generate questions from the cards.
   */
  generate(cards: GeneratorCardData[], options: GeneratorOptions): Question[];
}
