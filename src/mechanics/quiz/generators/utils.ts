/**
 * Utility functions for question generators.
 */

import { shuffle } from "@/utils/shuffle";
import type { Answer } from "../types";
import type { GeneratorCardData } from "./types";

/**
 * Minimum cards required for multiple choice questions.
 */
export const MIN_CARDS_FOR_QUIZ = 4;

/**
 * Number of wrong answers per question.
 */
export const WRONG_ANSWER_COUNT = 3;

/**
 * Generate a unique question ID.
 */
export function generateQuestionId(): string {
  return `q-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a unique answer ID.
 */
export function generateAnswerId(): string {
  return `a-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Calculate similarity score between two cards.
 * Higher score = more similar.
 *
 * @param card1 - First card
 * @param card2 - Second card
 * @returns Similarity score (0-100)
 */
export function calculateSimilarity(
  card1: GeneratorCardData,
  card2: GeneratorCardData
): number {
  let score = 0;

  // Same category is a strong similarity indicator
  if (card1.categoryShort && card2.categoryShort && card1.categoryShort === card2.categoryShort) {
    score += 40;
  } else if (card1.categoryTitle && card2.categoryTitle && card1.categoryTitle === card2.categoryTitle) {
    score += 35;
  }

  // Similar year (within 5 years)
  if (card1.year && card2.year) {
    const year1Val = card1.year;
    const year2Val = card2.year;
    const year1 = parseInt(typeof year1Val === "string" ? year1Val : String(year1Val), 10);
    const year2 = parseInt(typeof year2Val === "string" ? year2Val : String(year2Val), 10);
    if (!isNaN(year1) && !isNaN(year2)) {
      const yearDiff = Math.abs(year1 - year2);
      if (yearDiff === 0) {
        score += 30;
      } else if (yearDiff <= 2) {
        score += 25;
      } else if (yearDiff <= 5) {
        score += 15;
      } else if (yearDiff <= 10) {
        score += 5;
      }
    }
  }

  // Check other shared string fields (excluding standard fields)
  const excludeFields = new Set(["id", "title", "imageUrl", "year", "categoryShort", "categoryTitle"]);
  for (const key of Object.keys(card1)) {
    if (excludeFields.has(key)) continue;
    const val1 = card1[key];
    const val2 = card2[key];
    if (val1 && val2 && typeof val1 === "string" && typeof val2 === "string") {
      if (val1 === val2) {
        score += 10;
      }
    }
  }

  return Math.min(score, 100);
}

/**
 * Select wrong answers from available cards.
 * If useSimilar is true, prefers cards that are similar to the correct answer.
 *
 * @param cards - Available cards to select from
 * @param correctCard - Card to exclude (correct answer)
 * @param count - Number of wrong answers to select
 * @param useSimilar - Whether to prefer similar cards (for harder difficulty)
 * @returns Selected wrong answer cards
 */
export function selectWrongAnswerCards(
  cards: GeneratorCardData[],
  correctCard: GeneratorCardData,
  count = WRONG_ANSWER_COUNT,
  useSimilar = false
): GeneratorCardData[] {
  const available = cards.filter((c) => c.id !== correctCard.id);

  if (!useSimilar || available.length <= count) {
    // Random selection
    const shuffled = shuffle(available);
    return shuffled.slice(0, count);
  }

  // Calculate similarity for each available card
  const withSimilarity = available.map((card) => ({
    card,
    similarity: calculateSimilarity(correctCard, card),
  }));

  // Sort by similarity (highest first)
  withSimilarity.sort((a, b) => b.similarity - a.similarity);

  // Take the most similar cards, but add some randomness
  // Take top 2*count similar cards, then shuffle and pick count
  const candidatePool = withSimilarity.slice(0, Math.min(count * 2, available.length));
  const shuffledCandidates = shuffle(candidatePool);
  return shuffledCandidates.slice(0, count).map((c) => c.card);
}

/**
 * Create shuffled answer options from correct and wrong answers.
 *
 * @param correctAnswer - The correct answer
 * @param wrongAnswers - Array of wrong answers
 * @returns Shuffled array of all answers
 */
export function shuffleAnswers(
  correctAnswer: Answer,
  wrongAnswers: Answer[]
): Answer[] {
  return shuffle([correctAnswer, ...wrongAnswers]);
}

/**
 * Get answer label (A, B, C, D) for keyboard shortcuts.
 */
export function getAnswerLabel(index: number): string {
  return String.fromCharCode(65 + index); // A=65, B=66, etc.
}

/**
 * Filter cards that have valid image URLs.
 * Excludes placeholder URLs.
 */
export function filterCardsWithImages(cards: GeneratorCardData[]): GeneratorCardData[] {
  return cards.filter((card) => {
    const url = card.imageUrl;
    if (!url) return false;
    // Exclude picsum placeholder URLs
    if (url.includes("picsum.photos")) return false;
    return true;
  });
}

/**
 * Filter cards that have a specific field with value.
 */
export function filterCardsWithField(
  cards: GeneratorCardData[],
  field: string
): GeneratorCardData[] {
  return cards.filter((card) => {
    const value = card[field];
    return value !== undefined && value !== null && value !== "";
  });
}

/**
 * Get unique values for a field across cards.
 */
export function getUniqueFieldValues(
  cards: GeneratorCardData[],
  field: string
): string[] {
  const values = new Set<string>();
  for (const card of cards) {
    const value = card[field];
    if (value !== undefined && value !== null && value !== "") {
      // Ensure we only stringify primitive values
      if (typeof value === "object") continue;
      const stringValue = typeof value === "string" ? value : String(value as number | boolean);
      values.add(stringValue);
    }
  }
  return Array.from(values);
}

/**
 * Select random cards for question generation.
 *
 * @param cards - Available cards
 * @param count - Number of cards to select
 * @param excludeIds - Card IDs to exclude
 * @returns Selected cards
 */
export function selectRandomCards(
  cards: GeneratorCardData[],
  count: number,
  excludeIds?: Set<string>
): GeneratorCardData[] {
  let available = cards;
  if (excludeIds && excludeIds.size > 0) {
    available = cards.filter((c) => !excludeIds.has(c.id));
  }
  const shuffled = shuffle(available);
  return shuffled.slice(0, count);
}

/**
 * Check if there are enough cards for quiz.
 */
export function hasEnoughCards(cards: GeneratorCardData[]): boolean {
  return cards.length >= MIN_CARDS_FOR_QUIZ;
}
