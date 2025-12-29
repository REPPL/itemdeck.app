/**
 * Question generators barrel export.
 */

export { imageToNameGenerator } from "./imageToName";
export { nameToImageGenerator } from "./nameToImage";
export { fillTheBlankGenerator } from "./fillTheBlank";
export { relationshipToNameGenerator } from "./relationshipToName";
export type { QuestionGenerator, GeneratorCardData, GeneratorOptions, GeneratorCheckResult } from "./types";
export {
  MIN_CARDS_FOR_QUIZ,
  WRONG_ANSWER_COUNT,
  shuffleAnswers,
  getAnswerLabel,
  hasEnoughCards,
} from "./utils";

import { shuffle } from "@/utils/shuffle";
import { imageToNameGenerator } from "./imageToName";
import { nameToImageGenerator } from "./nameToImage";
import { fillTheBlankGenerator } from "./fillTheBlank";
import { relationshipToNameGenerator } from "./relationshipToName";
import type { QuestionGenerator, GeneratorCardData } from "./types";
import type { Question, QuestionType } from "../types";
import { MIN_CARDS_FOR_QUIZ } from "./utils";

/**
 * All available generators.
 */
const generators: Record<QuestionType, QuestionGenerator> = {
  imageToName: imageToNameGenerator,
  nameToImage: nameToImageGenerator,
  fillTheBlank: fillTheBlankGenerator,
  relationshipToName: relationshipToNameGenerator,
};

/**
 * Get a generator by type.
 */
export function getGenerator(type: QuestionType): QuestionGenerator {
  return generators[type];
}

/**
 * Options for question generation.
 */
export interface GenerateQuestionsOptions {
  /** Whether to use similar cards as distractors (harder) */
  useSimilarDistractors?: boolean;
}

/**
 * Generate questions for a quiz.
 *
 * Distributes questions across enabled types, then shuffles the result.
 *
 * @param cards - Available cards
 * @param questionCount - Total number of questions to generate
 * @param enabledTypes - Question types to use
 * @param options - Additional generation options
 * @returns Array of questions
 */
export function generateQuestions(
  cards: GeneratorCardData[],
  questionCount: number,
  enabledTypes: QuestionType[],
  options: GenerateQuestionsOptions = {}
): Question[] {
  if (cards.length < MIN_CARDS_FOR_QUIZ) {
    return [];
  }

  // Filter to types that can generate questions
  const validTypes = enabledTypes.filter((type) => {
    const generator = generators[type];
    return generator.canGenerate(cards).canGenerate;
  });

  if (validTypes.length === 0) {
    return [];
  }

  // Calculate questions per type (distribute evenly, with remainder going to first types)
  const questionsPerType = Math.floor(questionCount / validTypes.length);
  const remainder = questionCount % validTypes.length;

  const allQuestions: Question[] = [];
  const usedCardIds = new Set<string>();

  for (let i = 0; i < validTypes.length; i++) {
    const type = validTypes[i];
    if (!type) continue;

    const generator = generators[type];
    const count = questionsPerType + (i < remainder ? 1 : 0);

    const questions = generator.generate(cards, {
      count,
      excludeCardIds: usedCardIds,
      useSimilarDistractors: options.useSimilarDistractors,
    });

    // Add used card IDs (to avoid duplicate questions about same card)
    for (const q of questions) {
      usedCardIds.add(q.relatedCardId);
    }

    allQuestions.push(...questions);
  }

  // Shuffle all questions to mix types
  return shuffle(allQuestions);
}

/**
 * Check if quiz can be generated with the given cards and settings.
 */
export function canGenerateQuiz(
  cards: GeneratorCardData[],
  enabledTypes: QuestionType[]
): { canGenerate: boolean; reason?: string } {
  if (cards.length < MIN_CARDS_FOR_QUIZ) {
    return {
      canGenerate: false,
      reason: `Need at least ${MIN_CARDS_FOR_QUIZ} cards to play the quiz.`,
    };
  }

  // Check if at least one type can generate
  const validTypes = enabledTypes.filter((type) => {
    const generator = generators[type];
    return generator.canGenerate(cards).canGenerate;
  });

  if (validTypes.length === 0) {
    return {
      canGenerate: false,
      reason: "No enabled question types can generate questions from this collection.",
    };
  }

  return { canGenerate: true };
}
