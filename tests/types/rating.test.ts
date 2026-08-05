/**
 * Tests for rating helpers, focused on tolerance of untrusted values.
 *
 * Rating fields arrive from remote collection JSON and are only loosely
 * validated, so these helpers must never throw on a null, wrong-typed, or
 * malformed-object rating.
 */

import { describe, it, expect } from "vitest";
import {
  isStructuredRating,
  normaliseRating,
  formatRating,
  ratingToPercentage,
} from "@/types/rating";

describe("isStructuredRating", () => {
  it("returns true for a well-formed structured rating", () => {
    expect(isStructuredRating({ score: 4 })).toBe(true);
  });

  it("returns false for a simple number", () => {
    expect(isStructuredRating(3.5)).toBe(false);
  });

  it("does not throw on null and returns false", () => {
    // Previously `\"score\" in null` threw a TypeError.
    expect(() => isStructuredRating(null as never)).not.toThrow();
    expect(isStructuredRating(null as never)).toBe(false);
  });

  it("returns false for an object whose score is not a number", () => {
    expect(isStructuredRating({ score: "abc" } as never)).toBe(false);
  });
});

describe("normaliseRating", () => {
  it("normalises a simple number with the default max", () => {
    expect(normaliseRating(4)).toEqual({ score: 4, max: 5 });
  });

  it("preserves a structured rating and fills in max", () => {
    expect(normaliseRating({ score: 4, source: "Wiki" })).toEqual({
      score: 4,
      max: 5,
      source: "Wiki",
    });
  });

  it("does not throw on null and coerces to a usable rating", () => {
    expect(() => normaliseRating(null as never)).not.toThrow();
    expect(normaliseRating(null as never)).toEqual({ score: 0, max: 5 });
  });

  it("coerces a malformed structured rating (non-numeric score) to score 0", () => {
    expect(normaliseRating({ score: "abc" } as never)).toEqual({
      score: 0,
      max: 5,
    });
  });
});

describe("formatRating / ratingToPercentage tolerate malformed input", () => {
  it("formatRating does not throw on a non-numeric score", () => {
    // Previously reached `score.toFixed()` on a string and threw.
    expect(() => formatRating({ score: "abc" } as never)).not.toThrow();
    expect(formatRating({ score: "abc" } as never)).toBe("0.0/5");
  });

  it("ratingToPercentage does not throw on null", () => {
    expect(() => ratingToPercentage(null as never)).not.toThrow();
    expect(ratingToPercentage(null as never)).toBe(0);
  });
});
