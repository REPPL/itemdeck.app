/**
 * Quiz generation over untrusted relationship data.
 *
 * Relationship values are resolved from collection JSON, so both the pool of
 * distinct values and the set of values sharing a card title are sized by the
 * collection author. The wrong-answer selection scanned the correct set
 * linearly for every candidate value, so the two attacker-scaled dimensions
 * multiplied and froze the main thread; the resulting question also carried
 * one answer option per alternative.
 */

import { describe, it, expect } from "vitest";
import { relationshipToNameGenerator } from "@/mechanics/quiz/generators/relationshipToName";
import type { GeneratorCardData } from "@/mechanics/quiz/generators/types";

/**
 * Build cards sharing one title, each carrying a slice of a large studio
 * list, so the correct-answer set and the unique-value pool both scale.
 */
function hostileCards(uniqueValues: number, cardCount: number) {
  const perCard = Math.ceil(uniqueValues / cardCount);
  const cards: GeneratorCardData[] = [];

  for (let i = 0; i < cardCount; i++) {
    const studios = Array.from({ length: perCard }, (_, j) => ({
      id: `s${String(i * perCard + j)}`,
      title: `Studio ${String(i * perCard + j)}`,
    }));

    cards.push({
      id: `c${String(i)}`,
      title: "Shared Title",
      imageUrl: `https://example.com/${String(i)}.png`,
      _resolved: { studio: studios },
    });
  }

  return cards;
}

describe("relationshipToName with untrusted relationship values", () => {
  it("bounds the answer options a single question carries", () => {
    const cards = hostileCards(4000, 12);

    const questions = relationshipToNameGenerator.generate(cards, {
      count: 1,
    });

    for (const question of questions) {
      // Every wrong answer is rendered as its own button.
      expect(question.wrongAnswers.length).toBeLessThanOrEqual(16);
    }
  });

  it("generates a full quiz over a large value pool without stalling", () => {
    const cards = hostileCards(20000, 12);

    const started = Date.now();
    relationshipToNameGenerator.generate(cards, { count: 10 });
    const elapsed = Date.now() - started;

    // Pre-fix this scanned the correct-answer array once per candidate value
    // and took several seconds; the bound is generous to stay stable on slow
    // machines while still failing the quadratic scan.
    expect(elapsed).toBeLessThan(2000);
  });
});
