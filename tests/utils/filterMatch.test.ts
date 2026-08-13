/**
 * Tests for the shared search-bar filter definitions and match predicate.
 *
 * The filter field a card is matched against must be the same field its
 * options are collected from. These tests pin that contract: the Platform
 * filter matches on a card's short title (not the full title), and the Genre
 * filter matches any of a card's genres (not only the first).
 */

import { describe, it, expect } from "vitest";
import {
  FILTER_FIELD_DEFS,
  cardMatchesFilter,
} from "@/utils/filterMatch";

function defFor(label: string) {
  const def = FILTER_FIELD_DEFS.find((d) => d.label === label);
  if (!def) throw new Error(`no filter def for ${label}`);
  return def;
}

describe("cardMatchesFilter", () => {
  it("matches the Platform filter against the card's short title", () => {
    // Options are collected from the short title ("Switch"); pre-fix the filter
    // matched the full categoryTitle ("Nintendo Switch"), so it never matched.
    const card = {
      id: "a",
      categoryShort: "Switch",
      categoryTitle: "Nintendo Switch",
    };
    const platform = defFor("Platform");

    expect(
      cardMatchesFilter(card, { field: platform.field, values: ["Switch"] })
    ).toBe(true);
  });

  it("matches a genre that is not the card's first genre", () => {
    // Pre-fix the filter resolved genres[0] ("Action") only, so a card whose
    // matching genre sat at a later index was silently dropped.
    const card = { id: "a", genres: ["Action", "RPG"] };
    const genre = defFor("Genre");

    expect(
      cardMatchesFilter(card, { field: genre.field, values: ["RPG"] })
    ).toBe(true);
  });

  it("does not match a genre the card lacks", () => {
    const card = { id: "a", genres: ["Action", "RPG"] };
    const genre = defFor("Genre");

    expect(
      cardMatchesFilter(card, { field: genre.field, values: ["Puzzle"] })
    ).toBe(false);
  });

  it("matches a scalar year field", () => {
    const card = { id: "a", year: 1994 };
    const year = defFor("Year");

    expect(
      cardMatchesFilter(card, { field: year.field, values: ["1994"] })
    ).toBe(true);
  });

  it("returns false when the field is absent", () => {
    expect(
      cardMatchesFilter({ id: "a" }, { field: "genres", values: ["RPG"] })
    ).toBe(false);
  });
});
