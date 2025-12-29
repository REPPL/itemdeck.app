/**
 * Name to Image question generator.
 *
 * Shows a card name and asks the user to identify the correct image.
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
 * Generate a name-to-image question from a card.
 */
function generateQuestion(
  card: GeneratorCardData,
  allCards: GeneratorCardData[],
  useSimilarDistractors = false
): Question {
  // Create correct answer with image
  const correctAnswer: Answer = {
    id: generateAnswerId(),
    label: card.title,
    imageUrl: card.imageUrl,
  };

  // Select wrong answer cards with images
  // If useSimilarDistractors, prefers cards that are similar to the correct answer
  const cardsWithImages = filterCardsWithImages(allCards);
  const wrongCards = selectWrongAnswerCards(cardsWithImages, card, WRONG_ANSWER_COUNT, useSimilarDistractors);

  // Create wrong answers from wrong cards with their images
  const wrongAnswers: Answer[] = wrongCards.map((wrongCard) => ({
    id: generateAnswerId(),
    label: wrongCard.title,
    imageUrl: wrongCard.imageUrl,
  }));

  return {
    id: generateQuestionId(),
    type: "nameToImage",
    prompt: `Which image shows "${card.title}"?`,
    correctAnswer,
    wrongAnswers,
    relatedCardId: card.id,
    metadata: {
      correctImageUrl: card.imageUrl,
    },
  };
}

/**
 * Name to Image question generator.
 */
export const nameToImageGenerator: QuestionGenerator = {
  type: "nameToImage",

  canGenerate(cards: GeneratorCardData[]): GeneratorCheckResult {
    // Filter to cards with valid images
    const cardsWithImages = filterCardsWithImages(cards);

    if (cardsWithImages.length < MIN_CARDS_FOR_QUIZ) {
      return {
        canGenerate: false,
        reason: `Need at least ${String(MIN_CARDS_FOR_QUIZ)} cards with images for Name to Image questions.`,
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
