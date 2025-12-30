/**
 * Relationship to Name question generator.
 *
 * Shows a card and asks about a related entity.
 * E.g., "On which platform can you play Mario?"
 */

import { shuffle } from "@/utils/shuffle";
import type { Question, Answer } from "../types";
import type { QuestionGenerator, GeneratorCardData, GeneratorOptions, GeneratorCheckResult } from "./types";
import {
  generateQuestionId,
  generateAnswerId,
  MIN_CARDS_FOR_QUIZ,
  WRONG_ANSWER_COUNT,
} from "./utils";

/**
 * Detected relationship info.
 */
interface RelationshipInfo {
  /** Field name (e.g., "platform") */
  field: string;
  /** Display label for the relationship (e.g., "platform", "developer") */
  label: string;
  /** Unique values for wrong answer selection */
  uniqueValues: string[];
  /** Cards that have this relationship */
  cards: GeneratorCardData[];
}

/**
 * Get the name from a resolved entity.
 */
function getEntityName(entity: unknown): string | null {
  if (!entity || typeof entity !== "object") {
    return null;
  }

  const obj = entity as Record<string, unknown>;

  // Try common name fields
  if (typeof obj.name === "string" && obj.name) {
    return obj.name;
  }
  if (typeof obj.title === "string" && obj.title) {
    return obj.title;
  }
  if (typeof obj.label === "string" && obj.label) {
    return obj.label;
  }

  return null;
}

/**
 * Get resolved entity name(s) from a card.
 * Returns array for many-to-many relationships.
 */
function getResolvedNames(card: GeneratorCardData, field: string): string[] {
  const resolved = card._resolved as Record<string, unknown> | undefined;
  if (!resolved) {
    return [];
  }

  const value = resolved[field];
  if (!value) {
    return [];
  }

  // Single entity
  if (!Array.isArray(value)) {
    const name = getEntityName(value);
    return name ? [name] : [];
  }

  // Array of entities
  return value
    .map((entity) => getEntityName(entity))
    .filter((name): name is string => name !== null);
}

/**
 * Find relationships that can be used for questions.
 */
function findUsableRelationships(cards: GeneratorCardData[]): RelationshipInfo[] {
  const relationships: RelationshipInfo[] = [];
  const fieldCounts = new Map<string, Set<string>>();
  const fieldCards = new Map<string, GeneratorCardData[]>();

  // Scan all cards for resolved relationships
  for (const card of cards) {
    const resolved = card._resolved as Record<string, unknown> | undefined;
    if (!resolved) {
      continue;
    }

    for (const [field, value] of Object.entries(resolved)) {
      if (!value) continue;

      // Get names from the relationship
      const names = getResolvedNames(card, field);
      if (names.length === 0) continue;

      // Track unique values for this field
      if (!fieldCounts.has(field)) {
        fieldCounts.set(field, new Set());
        fieldCards.set(field, []);
      }

      for (const name of names) {
        fieldCounts.get(field)?.add(name);
      }
      fieldCards.get(field)?.push(card);
    }
  }

  // Filter to fields with enough variety for multiple choice
  for (const [field, uniqueNames] of fieldCounts) {
    const cardsWithField = fieldCards.get(field) ?? [];

    // Need at least 4 unique values for wrong answers
    if (uniqueNames.size >= MIN_CARDS_FOR_QUIZ && cardsWithField.length >= MIN_CARDS_FOR_QUIZ) {
      // Generate human-readable label
      // Convert camelCase or snake_case to Title Case
      const label = field
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim()
        .toLowerCase();

      relationships.push({
        field,
        label,
        uniqueValues: Array.from(uniqueNames),
        cards: cardsWithField,
      });
    }
  }

  return relationships;
}

/**
 * Generate prompt based on relationship type.
 */
function generatePrompt(cardTitle: string, relationshipLabel: string): string {
  // Common relationship types with natural phrasing
  const lowerLabel = relationshipLabel.toLowerCase();

  if (lowerLabel.includes("platform")) {
    return `On which ${lowerLabel} can you play "${cardTitle}"?`;
  }
  if (lowerLabel.includes("developer") || lowerLabel.includes("studio")) {
    return `Who developed "${cardTitle}"?`;
  }
  if (lowerLabel.includes("publisher")) {
    return `Who published "${cardTitle}"?`;
  }
  if (lowerLabel.includes("director")) {
    return `Who directed "${cardTitle}"?`;
  }
  if (lowerLabel.includes("artist") || lowerLabel.includes("creator")) {
    return `Who created "${cardTitle}"?`;
  }
  if (lowerLabel.includes("genre")) {
    return `What genre is "${cardTitle}"?`;
  }
  if (lowerLabel.includes("series") || lowerLabel.includes("franchise")) {
    return `What series is "${cardTitle}" part of?`;
  }
  if (lowerLabel.includes("location") || lowerLabel.includes("region") || lowerLabel.includes("country")) {
    return `Where is "${cardTitle}" from?`;
  }

  // Default generic phrasing
  return `Which ${lowerLabel} is associated with "${cardTitle}"?`;
}

/**
 * Build a map of titles to all their relationship values across cards.
 * This handles cases where the same item (e.g., "Puzznic") appears multiple
 * times in a collection with different values (e.g., Arcade and NES).
 */
function buildTitleToValuesMap(
  cards: GeneratorCardData[],
  field: string
): Map<string, Set<string>> {
  const titleToValues = new Map<string, Set<string>>();

  for (const card of cards) {
    const names = getResolvedNames(card, field);
    if (names.length === 0) continue;

    const existingValues = titleToValues.get(card.title) ?? new Set();
    for (const name of names) {
      existingValues.add(name);
    }
    titleToValues.set(card.title, existingValues);
  }

  return titleToValues;
}

/**
 * Generate a relationship question.
 */
function generateQuestion(
  card: GeneratorCardData,
  relationship: RelationshipInfo,
  titleToValuesMap: Map<string, Set<string>>
): Question | null {
  const correctNames = getResolvedNames(card, relationship.field);
  if (correctNames.length === 0) {
    return null;
  }

  // Get all correct values for this title (handles duplicate titles like "Puzznic")
  const allCorrectForTitle = titleToValuesMap.get(card.title);
  const allCorrectNames = allCorrectForTitle
    ? Array.from(allCorrectForTitle)
    : correctNames;

  // Use first correct answer as primary
  const correctName = correctNames[0];
  if (!correctName) {
    return null;
  }

  // Create correct answer
  const correctAnswer: Answer = {
    id: generateAnswerId(),
    label: correctName,
  };

  // Create alternative correct answers (other valid values for same title)
  // These will be included as selectable options and tracked for correct-answer checking
  const alternativeNames = allCorrectNames.filter((name) => name !== correctName);
  const alternativeAnswers: Answer[] = alternativeNames.map((name) => ({
    id: generateAnswerId(),
    label: name,
  }));

  // Select wrong answers from other unique values (excluding ALL correct values)
  const otherValues = relationship.uniqueValues.filter((v) => !allCorrectNames.includes(v));

  // Need enough wrong answers after accounting for alternative correct answers
  // (alternatives take up slots that would otherwise be wrong answers)
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
  // (they display as options but are tracked as correct via alternativeCorrectIds)
  const allWrongAnswers = [...wrongAnswers, ...alternativeAnswers];

  // Generate prompt
  const prompt = generatePrompt(card.title, relationship.label);

  return {
    id: generateQuestionId(),
    type: "relationshipToName",
    prompt,
    correctAnswer,
    wrongAnswers: allWrongAnswers,
    relatedCardId: card.id,
    // Include alternative correct IDs if there are any
    alternativeCorrectIds: alternativeAnswers.length > 0
      ? alternativeAnswers.map((a) => a.id)
      : undefined,
    metadata: {
      field: relationship.field,
    },
  };
}

/**
 * Relationship to Name question generator.
 */
export const relationshipToNameGenerator: QuestionGenerator = {
  type: "relationshipToName",

  canGenerate(cards: GeneratorCardData[]): GeneratorCheckResult {
    const relationships = findUsableRelationships(cards);

    if (relationships.length === 0) {
      return {
        canGenerate: false,
        reason: "No relationships found with enough variety for questions.",
      };
    }

    // Combine all cards with any usable relationship
    const allCards = new Set<GeneratorCardData>();
    for (const rel of relationships) {
      for (const card of rel.cards) {
        allCards.add(card);
      }
    }

    return {
      canGenerate: true,
      availableCards: Array.from(allCards),
    };
  },

  generate(cards: GeneratorCardData[], options: GeneratorOptions): Question[] {
    const relationships = findUsableRelationships(cards);
    if (relationships.length === 0) {
      return [];
    }

    const questions: Question[] = [];
    const usedCardIds = new Set<string>(options.excludeCardIds);
    const usedTitles = new Set<string>(); // Track titles to avoid duplicate questions

    // Distribute questions across available relationships
    const questionsPerRelationship = Math.ceil(options.count / relationships.length);

    for (const relationship of relationships) {
      if (questions.length >= options.count) {
        break;
      }

      // Build title-to-values map for this relationship
      const titleToValuesMap = buildTitleToValuesMap(relationship.cards, relationship.field);

      // Filter to unused cards (and unused titles to avoid duplicate questions)
      let candidateCards = relationship.cards.filter(
        (c) => !usedCardIds.has(c.id) && !usedTitles.has(c.title)
      );
      const questionsToGenerate = Math.min(
        questionsPerRelationship,
        options.count - questions.length,
        candidateCards.length
      );

      // Shuffle candidates
      candidateCards = shuffle(candidateCards);

      for (let i = 0; i < questionsToGenerate && candidateCards.length > 0; i++) {
        const card = candidateCards[i];
        if (!card) continue;

        const question = generateQuestion(card, relationship, titleToValuesMap);
        if (question) {
          questions.push(question);
          usedCardIds.add(card.id);
          usedTitles.add(card.title); // Mark title as used
        }
      }
    }

    return questions;
  },
};
