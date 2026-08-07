/**
 * Fill-the-blank generation over untrusted card data.
 *
 * The wrong-answer pool and the set of values sharing a card title are both
 * sized by the collection, and the generator scanned the correct set linearly
 * for every candidate value. The question also carried one rendered option
 * per alternative correct answer.
 */

import { describe, it, expect } from "vitest";
import { fillTheBlankGenerator } from "@/mechanics/quiz/generators/fillTheBlank";
import type { GeneratorCardData } from "@/mechanics/quiz/generators/types";

/** Cards sharing one title so their distinct years all count as correct. */
function cardsSharingTitle(count: number): GeneratorCardData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${String(i)}`,
    title: "Shared Title",
    imageUrl: `https://example.com/${String(i)}.png`,
    year: String(1970 + i),
  }));
}

describe("fillTheBlank with untrusted card data", () => {
  it("bounds the answer options a single question carries", () => {
    const questions = fillTheBlankGenerator.generate(cardsSharingTitle(400), {
      count: 1,
    });

    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      // Every wrong answer is rendered as its own button: at most the three
      // wrong answers plus the three capped alternatives.
      expect(question.wrongAnswers.length).toBeLessThanOrEqual(6);
    }
  });

  it("generates a full quiz over a large value pool without stalling", () => {
    const cards = cardsSharingTitle(8000);

    const started = Date.now();
    fillTheBlankGenerator.generate(cards, { count: 10 });
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(1500);
  });

  it("keeps a normal collection's alternatives selectable", () => {
    // Two cards share a title with different years, so the second year is a
    // legitimate alternative correct answer and must still be offered.
    const cards: GeneratorCardData[] = [
      {
        id: "a",
        title: "Dual",
        imageUrl: "https://example.com/a.png",
        year: "1984",
      },
      {
        id: "b",
        title: "Dual",
        imageUrl: "https://example.com/b.png",
        year: "1986",
      },
      {
        id: "c",
        title: "Other",
        imageUrl: "https://example.com/c.png",
        year: "1990",
      },
      {
        id: "d",
        title: "Third",
        imageUrl: "https://example.com/d.png",
        year: "1992",
      },
      {
        id: "e",
        title: "Fourth",
        imageUrl: "https://example.com/e.png",
        year: "1994",
      },
    ];

    const questions = fillTheBlankGenerator.generate(cards, { count: 5 });
    const dual = questions.find((q) => q.prompt.includes("Dual"));

    expect(dual).toBeDefined();
    expect(dual?.alternativeCorrectIds?.length).toBe(1);
    const labels = dual?.wrongAnswers.map((a) => a.label) ?? [];
    expect(labels).toContain(
      dual?.correctAnswer.label === "1984" ? "1986" : "1984"
    );
  });
});
