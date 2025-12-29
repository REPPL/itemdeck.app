/**
 * Tests for collection types.
 */

import { describe, expect, it } from "vitest";
import {
  isValidCollectionExport,
  EXPORT_VERSION,
} from "@/mechanics/collection/types";
import type { CollectionExport } from "@/mechanics/collection/types";

describe("isValidCollectionExport", () => {
  it("should return true for valid export", () => {
    const validExport: CollectionExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      owned: ["card-1", "card-2"],
      wishlist: ["card-3"],
    };

    expect(isValidCollectionExport(validExport)).toBe(true);
  });

  it("should return true for empty arrays", () => {
    const validExport: CollectionExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      owned: [],
      wishlist: [],
    };

    expect(isValidCollectionExport(validExport)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isValidCollectionExport(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isValidCollectionExport(undefined)).toBe(false);
  });

  it("should return false for non-object", () => {
    expect(isValidCollectionExport("string")).toBe(false);
    expect(isValidCollectionExport(123)).toBe(false);
    expect(isValidCollectionExport([])).toBe(false);
  });

  it("should return false for wrong version", () => {
    const invalidExport = {
      version: "2.0",
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      owned: [],
      wishlist: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for missing sourceId", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      owned: [],
      wishlist: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for non-string sourceId", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      sourceId: 123,
      exportedAt: new Date().toISOString(),
      owned: [],
      wishlist: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for missing exportedAt", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      owned: [],
      wishlist: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for missing owned array", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      wishlist: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for missing wishlist array", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      owned: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for non-array owned", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      owned: "card-1",
      wishlist: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for non-string items in owned", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      owned: [123, "card-1"],
      wishlist: [],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });

  it("should return false for non-string items in wishlist", () => {
    const invalidExport = {
      version: EXPORT_VERSION,
      sourceId: "test-source",
      exportedAt: new Date().toISOString(),
      owned: [],
      wishlist: [null, "card-1"],
    };

    expect(isValidCollectionExport(invalidExport)).toBe(false);
  });
});
