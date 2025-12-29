/**
 * Image to Name question generator.
 *
 * Shows a card image and asks the user to identify the card by name.
 */

import type { Question, Answer } from "../types";
import type { QuestionGenerator, GeneratorCardData, GeneratorOptions, GeneratorCheckResult } from "./types";
import {
  generateQuestionId,
  generateAnswerId,
  selectWrongAnswerCards,
  filterCardsWithImages,
  MIN_CARDS_FOR_QUIZ,
  WRONG_ANSWER_COUNT,
} from "./utils";

/**
 * Generate an image-to-name question from a card.
 */
function generateQuestion(
  card: GeneratorCardData,
  allCards: GeneratorCardData[],
  useSimilarDistractors = false
): Question {
  // Create correct answer
  const correctAnswer: Answer = {
    id: generateAnswerId(),
    label: card.title,
  };

  // Select wrong answer cards (different cards from the collection)
  // If useSimilarDistractors, prefers cards that are similar to the correct answer
  const wrongCards = selectWrongAnswerCards(allCards, card, WRONG_ANSWER_COUNT, useSimilarDistractors);

  // Create wrong answers from wrong cards
  const wrongAnswers: Answer[] = wrongCards.map((wrongCard) => ({
    id: generateAnswerId(),
    label: wrongCard.title,
  }));

  return {
    id: generateQuestionId(),
    type: "imageToName",
    prompt: "Which card is shown in this image?",
    correctAnswer,
    wrongAnswers,
    relatedCardId: card.id,
    metadata: {
      imageUrl: card.imageUrl,
    },
  };
}

/**
 * Image to Name question generator.
 */
export const imageToNameGenerator: QuestionGenerator = {
  type: "imageToName",

  canGenerate(cards: GeneratorCardData[]): GeneratorCheckResult {
    // Filter to cards with valid images
    const cardsWithImages = filterCardsWithImages(cards);

    if (cardsWithImages.length < MIN_CARDS_FOR_QUIZ) {
      return {
        canGenerate: false,
        reason: `Need at least ${String(MIN_CARDS_FOR_QUIZ)} cards with images for Image to Name questions.`,
      };
    }

    return {
      canGenerate: true,
      availableCards: cardsWithImages,
    };
  },

  generate(cards: GeneratorCardData[], options: GeneratorOptions): Question[] {
    const check = this.canGenerate(cards);
    if (!check.canGenerate || !check.availableCards) {
      return [];
    }

    const availableCards = check.availableCards;
    const questions: Question[] = [];
    const usedCardIds = new Set<string>(options.excludeCardIds);

    // Filter out already used cards
    let candidateCards = availableCards.filter((c) => !usedCardIds.has(c.id));

    // Generate questions up to the count
    const count = Math.min(options.count, candidateCards.length);

    for (let i = 0; i < count; i++) {
      // Pick a random card
      const randomIndex = Math.floor(Math.random() * candidateCards.length);
      const card = candidateCards[randomIndex];

      if (!card) continue;

      // Generate question
      const question = generateQuestion(card, availableCards, options.useSimilarDistractors);
      questions.push(question);

      // Mark as used
      usedCardIds.add(card.id);
      candidateCards = candidateCards.filter((c) => c.id !== card.id);
    }

    return questions;
  },
};
