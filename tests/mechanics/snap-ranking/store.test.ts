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
