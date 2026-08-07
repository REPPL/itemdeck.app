/**
 * Tests for the Snap Ranking store's initGame guard against attacker-scaled
 * value sets. The UI renders one guess button per distinct value, so an
 * unbounded uniqueValues set (e.g. the default per-card `order` field on a
 * large untrusted collection) would freeze the tab. initGame must refuse.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useSnapRankingStore,
  MAX_UNIQUE_VALUES,
} from "@/mechanics/snap-ranking/store";
import type { GameConfig } from "@/mechanics/snap-ranking/types";

/** Build a config with `count` distinct numeric values (one card each). */
function configWithValues(count: number): GameConfig {
  const cards = Array.from({ length: count }, (_, i) => ({
    id: `c${String(i)}`,
    value: i,
  }));
  return {
    guessField: "order",
    cards,
    valueType: "numeric",
    uniqueValues: cards.map((c) => c.value),
  };
}

describe("snap-ranking initGame value cap", () => {
  beforeEach(() => {
    useSnapRankingStore.getState().resetGame();
  });

  it("starts a game when distinct values are within the cap", () => {
    useSnapRankingStore.getState().initGame(configWithValues(40));

    const state = useSnapRankingStore.getState();
    expect(state.errorMessage).toBeNull();
    expect(state.cardIds).toHaveLength(40);
    expect(state.uniqueValues).toHaveLength(40);
  });

  it("refuses to start when distinct values exceed the cap", () => {
    useSnapRankingStore
      .getState()
      .initGame(configWithValues(MAX_UNIQUE_VALUES + 1));

    const state = useSnapRankingStore.getState();
    expect(state.cardIds).toEqual([]);
    expect(state.uniqueValues).toEqual([]);
    expect(state.errorMessage).toMatch(/too many distinct values/i);
  });

  it("allows exactly the cap", () => {
    useSnapRankingStore
      .getState()
      .initGame(configWithValues(MAX_UNIQUE_VALUES));

    const state = useSnapRankingStore.getState();
    expect(state.errorMessage).toBeNull();
    expect(state.cardIds).toHaveLength(MAX_UNIQUE_VALUES);
  });
});

describe("snap-ranking with prototype-named card ids", () => {
  beforeEach(() => {
    useSnapRankingStore.setState(useSnapRankingStore.getInitialState());
  });

  it("scores a card whose id is __proto__", () => {
    // Entity ids come from untrusted collection data and are only validated
    // as non-empty strings. Assigning a primitive through the inherited
    // __proto__ setter is a silent no-op, so the card was dealt but its
    // value never stored, and the undefined guard in submitGuess read back
    // Object.prototype instead — the card could never be scored.
    const config: GameConfig = {
      guessField: "order",
      cards: [
        { id: "a", value: 1 },
        { id: "__proto__", value: 2 },
      ],
      valueType: "numeric",
      uniqueValues: [1, 2],
    };

    const store = useSnapRankingStore.getState();
    store.initGame(config);
    useSnapRankingStore.setState({ isActive: true });

    expect(useSnapRankingStore.getState().cardValues["__proto__"]).toBe(2);

    // Play to the __proto__ card and guess its true value.
    const cardIds = useSnapRankingStore.getState().cardIds;
    const target = cardIds.indexOf("__proto__");
    useSnapRankingStore.setState({
      currentIndex: target,
      isCurrentCardFlipped: true,
    });
    useSnapRankingStore.getState().submitGuess(2);

    const guesses = useSnapRankingStore.getState().guesses;
    expect(guesses).toHaveLength(1);
    expect(guesses[0]?.actualValue).toBe(2);
    expect(guesses[0]?.score).toBeGreaterThan(0);
  });
});
