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
): { field: string; promptTemplate: string; uniqueValues: string[]; cards: GeneratorCardData[] } | null {
  for (const config of FILL_BLANK_FIELDS) {
    const cardsWithField = filterCardsWithField(cards, config.field);
    const uniqueValues = getUniqueFieldValues(cardsWithField, config.field);

    // Need at least 4 unique values for multiple choice
    if (cardsWithField.length >= MIN_CARDS_FOR_QUIZ && uniqueValues.length >= MIN_CARDS_FOR_QUIZ) {
      return {
        field: config.field,
        promptTemplate: config.promptTemplate,
        uniqueValues,
        cards: cardsWithField,
      };
    }
  }
  return null;
}

/**
 * Build a map of titles to all their field values across cards.
 * Handles cases where the same item appears multiple times with different values.
 */
function buildTitleToValuesMap(
  cards: GeneratorCardData[],
  field: string
): Map<string, Set<string>> {
  const titleToValues = new Map<string, Set<string>>();

  for (const card of cards) {
    const value = card[field];
    if (value === undefined || value === null || value === "" || typeof value === "object") {
      continue;
    }

    const valueStr = typeof value === "string" ? value : String(value as number | boolean);
    const existingValues = titleToValues.get(card.title) ?? new Set();
    existingValues.add(valueStr);
    titleToValues.set(card.title, existingValues);
  }

  return titleToValues;
}

/**
 * Generate a fill-the-blank question from a card.
 */
function generateQuestion(
  card: GeneratorCardData,
  field: string,
  promptTemplate: string,
  allUniqueValues: string[],
  titleToValuesMap: Map<string, Set<string>>
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

  // Get all correct values for this title (handles duplicate titles)
  const allCorrectForTitle = titleToValuesMap.get(card.title);
  const allCorrectLabels = allCorrectForTitle
    ? Array.from(allCorrectForTitle)
    : [correctLabel];

  // Create correct answer
  const correctAnswer: Answer = {
    id: generateAnswerId(),
    label: correctLabel,
  };

  // Create alternative correct answers (other valid values for same title)
  const alternativeLabels = allCorrectLabels.filter((label) => label !== correctLabel);
  const alternativeAnswers: Answer[] = alternativeLabels.map((label) => ({
    id: generateAnswerId(),
    label,
  }));

  // Select wrong answers from unique values (excluding ALL correct values)
  const otherValues = allUniqueValues.filter((v) => !allCorrectLabels.includes(v));

  // Need enough wrong answers after accounting for alternative correct answers
  const wrongAnswersNeeded = Math.max(0, WRONG_ANSWER_COUNT - alternativeAnswers.length);
  if (otherValues.length < wrongAnswersNeeded) {
    return null;
  }

  const shuffledOthers = shuffle(otherValues);
  const wrongAnswers: Answer[] = shuffledOthers.slice(0, wrongAnswersNeeded).map((value) => ({
    id: generateAnswerId(),
    label: value,
  }));

  // Add alternative correct answers to wrong answers array
  const allWrongAnswers = [...wrongAnswers, ...alternativeAnswers];

  // Generate prompt from template
  const prompt = promptTemplate.replace("{title}", card.title);

  return {
    id: generateQuestionId(),
    type: "fillTheBlank",
    prompt,
    correctAnswer,
    wrongAnswers: allWrongAnswers,
    relatedCardId: card.id,
    alternativeCorrectIds: alternativeAnswers.length > 0
      ? alternativeAnswers.map((a) => a.id)
      : undefined,
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

    // Build title-to-values map for handling duplicate titles
    const titleToValuesMap = buildTitleToValuesMap(fieldConfig.cards, fieldConfig.field);

    const questions: Question[] = [];
    const usedCardIds = new Set<string>(options.excludeCardIds);
    const usedTitles = new Set<string>(); // Track titles to avoid duplicate questions

    // Filter out already used cards (and titles)
    let candidateCards = fieldConfig.cards.filter(
      (c) => !usedCardIds.has(c.id) && !usedTitles.has(c.title)
    );

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
        fieldConfig.uniqueValues,
        titleToValuesMap
      );

      if (question) {
        questions.push(question);
        usedCardIds.add(card.id);
        usedTitles.add(card.title); // Mark title as used
      }

      // Remove this card AND other cards with same title from candidates
      candidateCards = candidateCards.filter((c) => c.title !== card.title);
    }

    return questions;
  },
};
