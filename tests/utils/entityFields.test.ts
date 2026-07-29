/**
 * Tests for star-rating formatting with untrusted values.
 *
 * Rating values come from third-party collection JSON. Out-of-range or
 * non-finite values must never reach String.prototype.repeat with a negative
 * or huge argument, which would throw a RangeError (crashing the render) or
 * allocate a giant string (hanging the tab).
 */

import { describe, it, expect } from "vitest";
import { formatFieldValue } from "@/utils/entityFields";

describe("formatFieldValue star ratings", () => {
  it("formats an in-range 5-star rating", () => {
    expect(formatFieldValue(3, "myRating")).toBe("★★★☆☆");
  });

  it("formats an in-range 10-star rating", () => {
    expect(formatFieldValue(7, "averageRating")).toBe("★★★★★★★☆☆☆");
  });

  it("does not throw and clamps an over-range 5-star value", () => {
    let result: string | null = null;
    expect(() => {
      result = formatFieldValue(8, "myRating");
    }).not.toThrow();
    // Clamped to 5 filled stars, no empty stars — never a negative repeat.
    expect(result).toBe("★★★★★");
  });

  it("does not throw and clamps an over-range 10-star value", () => {
    expect(() => formatFieldValue(25, "averageRating")).not.toThrow();
    expect(formatFieldValue(25, "averageRating")).toBe("★★★★★★★★★★");
  });

  it("does not throw and clamps a negative value", () => {
    expect(() => formatFieldValue(-4, "myRating")).not.toThrow();
    expect(formatFieldValue(-4, "myRating")).toBe("☆☆☆☆☆");
  });

  it("does not allocate a huge string for an enormous value", () => {
    let result: string | null = null;
    expect(() => {
      result = formatFieldValue(1e8, "myRating");
    }).not.toThrow();
    expect((result as unknown as string).length).toBeLessThanOrEqual(5);
  });

  it("handles a rating object with max <= 0 without throwing", () => {
    expect(() =>
      formatFieldValue({ score: 5, max: 0 }, "averageRating")
    ).not.toThrow();
    expect(() =>
      formatFieldValue({ score: 5, max: 0 }, "genres")
    ).not.toThrow();
  });

  it("handles a rating object with an out-of-range score", () => {
    let result: string | null = null;
    expect(() => {
      result = formatFieldValue({ score: 1e8, max: 1e8 }, "myRating");
    }).not.toThrow();
    expect((result as unknown as string).length).toBeLessThan(1000);
  });
});
