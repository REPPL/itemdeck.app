/**
 * Tests for useAvailableFields field discovery.
 *
 * Entity schemas are loose, so an untrusted collection can carry an unbounded
 * number of keys. Every discovered field becomes an <option> in the settings
 * panel, which renders outside the collection error boundary, so discovery
 * must be capped.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { DisplayCard } from "@/types/card";

const collectionDataState: { cards: DisplayCard[] } = { cards: [] };

vi.mock("@/context/CollectionDataContext", () => ({
  useCollectionData: () => collectionDataState,
}));

import { useAvailableFields } from "@/hooks/useAvailableFields";

describe("useAvailableFields", () => {
  it("caps discovered fields from an entity with a huge key space", () => {
    // A single hostile entity carrying 5000 badge-matching keys.
    const hostile: Record<string, unknown> = { id: "x", title: "Hostile" };
    for (let i = 0; i < 5000; i++) {
      hostile[`score${String(i)}`] = i;
    }
    collectionDataState.cards = [hostile as unknown as DisplayCard];

    const { result } = renderHook(() => useAvailableFields());

    // Pre-fix allFields held 5000+ entries, each becoming a settings <option>.
    expect(result.current.allFields.length).toBeLessThanOrEqual(100);
    // The keyword-matched selectors must not exceed the discovered set either.
    expect(result.current.sortFields.length).toBeLessThanOrEqual(102);
    expect(result.current.topBadgeFields.length).toBeLessThanOrEqual(102);
  });

  it("still discovers the ordinary fields of a normal collection", () => {
    collectionDataState.cards = [
      { id: "a", title: "A", year: 1994, categoryShort: "SNES" },
    ] as unknown as DisplayCard[];

    const { result } = renderHook(() => useAvailableFields());

    const values = result.current.allFields.map((f) => f.value);
    expect(values).toContain("title");
    expect(values).toContain("year");
    expect(values).toContain("categoryShort");
  });
});
