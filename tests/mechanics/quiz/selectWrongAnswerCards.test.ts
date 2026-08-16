/**
 * Distractor selection over untrusted card data.
 *
 * On the expert and extreme difficulties every available card is scored for
 * similarity against the correct card, and the scoring walks the correct card's
 * keys. Both the collection size and the per-entity key count come from the
 * loaded collection, so the scan has to be bounded on each axis.
 */

import { describe, it, expect } from "vitest";
import {
  calculateSimilarity,
  selectWrongAnswerCards,
  MAX_SIMILARITY_KEYS,
} from "@/mechanics/quiz/generators/utils";
import type { GeneratorCardData } from "@/mechanics/quiz/generators/types";

/** Cards carrying `keyCount` extra string fields each. */
function wideCards(count: number, keyCount: number): GeneratorCardData[] {
  return Array.from({ length: count }, (_, i) => {
    const card: GeneratorCardData = {
      id: `c${String(i)}`,
      title: `Card ${String(i)}`,
      imageUrl: `https://example.com/${String(i)}.png`,
      year: String(1970 + (i % 50)),
      categoryShort: `cat${String(i % 8)}`,
    };
    for (let k = 0; k < keyCount; k++) {
      card[`field${String(k)}`] = `value${String(k % 11)}`;
    }
    return card;
  });
}

describe("selectWrongAnswerCards with untrusted card data", () => {
  it("selects similar distractors for a large wide collection without stalling", () => {
    // A quiz asks for distractors once per question; a full run is 20.
    const cards = wideCards(6000, 400);

    const started = Date.now();
    for (let i = 0; i < 20; i++) {
      const distractors = selectWrongAnswerCards(
        cards,
        cards[i] as GeneratorCardData,
        3,
        true
      );
      expect(distractors).toHaveLength(3);
      for (const distractor of distractors) {
        expect(distractor.id).not.toBe(cards[i]?.id);
      }
    }
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(1500);
  });

  it("still prefers similar cards for a normal collection", () => {
    // Fifteen cards: six share the correct card's category, the rest do not.
    // Six similar cards fill the entire six-strong candidate pool, so the
    // pick is deterministic regardless of the final unseeded shuffle.
    const correct: GeneratorCardData = {
      id: "target",
      title: "Target",
      imageUrl: "https://example.com/target.png",
      year: "1990",
      categoryShort: "ARC",
    };
    const similar = Array.from({ length: 6 }, (_, i) => ({
      id: `sim${String(i)}`,
      title: `Similar ${String(i)}`,
      imageUrl: `https://example.com/sim${String(i)}.png`,
      year: "1990",
      categoryShort: "ARC",
    }));
    const dissimilar = Array.from({ length: 8 }, (_, i) => ({
      id: `dis${String(i)}`,
      title: `Different ${String(i)}`,
      imageUrl: `https://example.com/dis${String(i)}.png`,
      year: "2020",
      categoryShort: "NES",
    }));

    const selected = selectWrongAnswerCards(
      [correct, ...similar, ...dissimilar],
      correct,
      3,
      true
    );

    expect(selected).toHaveLength(3);
    // The six-card candidate pool is exactly the six similar cards, so every
    // selected card must be one of them.
    expect(selected.every((c) => c.id.startsWith("sim"))).toBe(true);
    expect(selected.every((c) => c.id !== "target")).toBe(true);
  });

  it("never returns the correct card and honours the requested count", () => {
    const cards = wideCards(40, 5);
    const selected = selectWrongAnswerCards(
      cards,
      cards[0] as GeneratorCardData,
      3,
      true
    );

    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((c) => c.id)).size).toBe(3);
    expect(selected.every((c) => c.id !== cards[0]?.id)).toBe(true);
  });

  it("falls back to random selection when there are barely enough cards", () => {
    const cards = wideCards(4, 3);
    const selected = selectWrongAnswerCards(
      cards,
      cards[0] as GeneratorCardData,
      3,
      true
    );

    expect(selected.map((c) => c.id).sort()).toEqual(["c1", "c2", "c3"]);
  });
});

describe("calculateSimilarity with untrusted card data", () => {
  it("bounds the keys it walks on a card with a huge field count", () => {
    const fieldCount = 20000;
    let reads = 0;

    // The correct card drives the key loop, so count how many of its fields
    // a single similarity score actually reads.
    const wide: GeneratorCardData = {
      id: "wide",
      title: "Wide",
      imageUrl: "https://example.com/wide.png",
    };
    for (let k = 0; k < fieldCount; k++) {
      Object.defineProperty(wide, `field${String(k)}`, {
        enumerable: true,
        get: () => {
          reads++;
          return `value${String(k % 11)}`;
        },
      });
    }
    const other = wideCards(1, fieldCount)[0] as GeneratorCardData;

    calculateSimilarity(wide, other);

    expect(reads).toBeGreaterThan(0);
    expect(reads).toBeLessThanOrEqual(MAX_SIMILARITY_KEYS);
  });

  it("scores ordinary cards unchanged", () => {
    const a: GeneratorCardData = {
      id: "a",
      title: "A",
      imageUrl: "https://example.com/a.png",
      year: "1990",
      categoryShort: "ARC",
      publisher: "Acme",
    };
    const b: GeneratorCardData = {
      id: "b",
      title: "B",
      imageUrl: "https://example.com/b.png",
      year: "1990",
      categoryShort: "ARC",
      publisher: "Acme",
    };

    // 40 (category) + 30 (same year) + 10 (shared publisher)
    expect(calculateSimilarity(a, b)).toBe(80);
  });
});
