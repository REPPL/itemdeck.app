/**
 * Tests for the caching-permission rule.
 *
 * "Never cache" previously only suppressed the consent dialog while image
 * preloading still fetched and persisted every image, making it weaker than
 * declining once.
 */

import { describe, it, expect } from "vitest";
import { mayCacheCollection } from "@/utils/cacheConsent";

const base = {
  hasActiveSource: true,
  isBuiltIn: false,
  preference: "ask" as const,
  hasSourceConsent: false,
};

describe("mayCacheCollection", () => {
  it("refuses when the visitor chose never", () => {
    expect(mayCacheCollection({ ...base, preference: "never" })).toBe(false);
  });

  it("refuses when the visitor chose never even after an earlier grant", () => {
    expect(
      mayCacheCollection({
        ...base,
        preference: "never",
        hasSourceConsent: true,
      })
    ).toBe(false);
  });

  it("allows when the visitor chose always", () => {
    expect(mayCacheCollection({ ...base, preference: "always" })).toBe(true);
  });

  it("allows a built-in source regardless of preference", () => {
    expect(
      mayCacheCollection({ ...base, isBuiltIn: true, preference: "never" })
    ).toBe(true);
  });

  it("defers to the per-source grant in ask mode", () => {
    expect(mayCacheCollection(base)).toBe(false);
    expect(mayCacheCollection({ ...base, hasSourceConsent: true })).toBe(true);
  });

  it("refuses when no source is active", () => {
    expect(mayCacheCollection({ ...base, hasActiveSource: false })).toBe(false);
  });
});
