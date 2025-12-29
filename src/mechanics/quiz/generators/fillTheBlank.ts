/**
 * Fill the Blank question generator.
 *
 * Shows a sentence with a blank and asks the user to fill it in.
 * Uses fields with discrete values (year, category, etc.).
 */

import { shuffle } from "@/utils/shuffle";
import type { Question, Answer } from "../types";
import type { QuestionGenerator, GeneratorCardData, GeneratorOptions, GeneratorCheckResult } from "./types";
import {
  generateQuestionId,
  generateAnswerId,
  filterCardsWithField,
  getUniqueFieldValues,
  MIN_CARDS_FOR_QUIZ,
  WRONG_ANSWER_COUNT,
} from "./utils";

/**
 * Fields that can be used for fill-the-blank questions.
 * Order determines priority.
 */
const FILL_BLANK_FIELDS = [
  { field: "year", promptTemplate: '"{title}" was released in ____.' },
  { field: "categoryShort", promptTemplate: '"{title}" belongs to the ____ category.' },
  { field: "categoryTitle", promptTemplate: '"{title}" is from ____.' },
] as const;

/**
 * Find the best field to use for fill-the-blank questions.
 */
function findBestField(
  cards: GeneratorCardData[]
): { field: string; promptTemplate: string; uniqueValues: string[] } | null {
  for (const config of FILL_BLANK_FIELDS) {
    const cardsWithField = filterCardsWithField(cards, config.field);
    const uniqueValues = getUniqueFieldValues(cardsWithField, config.field);

    // Need at least 4 unique values for multiple choice
    if (cardsWithField.length >= MIN_CARDS_FOR_QUIZ && uniqueValues.length >= MIN_CARDS_FOR_QUIZ) {
      return {
        field: config.field,
        promptTemplate: config.promptTemplate,
        uniqueValues,
      };
    }
  }
  return null;
}

/**
 * Generate a fill-the-blank question from a card.
 */
function generateQuestion(
  card: GeneratorCardData,
  field: string,
  promptTemplate: string,
  allUniqueValues: string[]
): Question | null {
  const correctValue = card[field];
  if (correctValue === undefined || correctValue === null || correctValue === "") {
    return null;
  }

  // Skip object values (only stringify primitives)
  if (typeof correctValue === "object") {
    return null;
  }

  const correctLabel = typeof correctValue === "string" ? correctValue : String(correctValue as number | boolean);

  // Create correct answer
  const correctAnswer: Answer = {
    id: generateAnswerId(),
    label: correctLabel,
  };

  // Select wrong answers from unique values
  const otherValues = allUniqueValues.filter((v) => v !== correctLabel);
  if (otherValues.length < WRONG_ANSWER_COUNT) {
    return null;
  }

  const shuffledOthers = shuffle(otherValues);
  const wrongAnswers: Answer[] = shuffledOthers.slice(0, WRONG_ANSWER_COUNT).map((value) => ({
    id: generateAnswerId(),
    label: value,
  }));

  // Generate prompt from template
  const prompt = promptTemplate.replace("{title}", card.title);

  return {
    id: generateQuestionId(),
    type: "fillTheBlank",
    prompt,
    correctAnswer,
    wrongAnswers,
    relatedCardId: card.id,
    metadata: {
      field,
    },
  };
}

/**
 * Fill the Blank question generator.
 */
export const fillTheBlankGenerator: QuestionGenerator = {
  type: "fillTheBlank",

  canGenerate(cards: GeneratorCardData[]): GeneratorCheckResult {
    const fieldConfig = findBestField(cards);

    if (!fieldConfig) {
      return {
        canGenerate: false,
        reason: "No suitable field found with enough unique values for Fill the Blank questions.",
      };
    }

    const cardsWithField = filterCardsWithField(cards, fieldConfig.field);

    return {
      canGenerate: true,
      availableCards: cardsWithField,
    };
  },

  generate(cards: GeneratorCardData[], options: GeneratorOptions): Question[] {
    const fieldConfig = findBestField(cards);
    if (!fieldConfig) {
      return [];
    }

    const cardsWithField = filterCardsWithField(cards, fieldConfig.field);
    const questions: Question[] = [];
    const usedCardIds = new Set<string>(options.excludeCardIds);

    // Filter out already used cards
    let candidateCards = cardsWithField.filter((c) => !usedCardIds.has(c.id));

    // Generate questions up to the count
    const count = Math.min(options.count, candidateCards.length);

    for (let i = 0; i < count; i++) {
      // Pick a random card
      const randomIndex = Math.floor(Math.random() * candidateCards.length);
      const card = candidateCards[randomIndex];

      if (!card) continue;

      // Generate question
      const question = generateQuestion(
        card,
        fieldConfig.field,
        fieldConfig.promptTemplate,
        fieldConfig.uniqueValues
      );

      if (question) {
        questions.push(question);
        usedCardIds.add(card.id);
      }

      candidateCards = candidateCards.filter((c) => c.id !== card.id);
    }

    return questions;
  },
};
