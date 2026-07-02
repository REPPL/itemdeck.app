/**
 * Tests for query key factories.
 */

import { describe, it, expect } from "vitest";
import { cardKeys, collectionKeys, categoryKeys } from "@/hooks/queryKeys";

describe("cardKeys", () => {
  describe("all", () => {
    it("returns base key array", () => {
      expect(cardKeys.all).toEqual(["cards"]);
    });
  });

  describe("lists", () => {
    it("extends base key with list", () => {
      expect(cardKeys.lists()).toEqual(["cards", "list"]);
    });
  });

  describe("list", () => {
    it("includes filter object", () => {
      const filters = { category: "games" };
      expect(cardKeys.list(filters)).toEqual(["cards", "list", filters]);
    });

    it("creates unique keys for different filters", () => {
      const key1 = cardKeys.list({ category: "games" });
      const key2 = cardKeys.list({ category: "movies" });
      expect(key1).not.toEqual(key2);
    });

    it("handles empty filters", () => {
      expect(cardKeys.list({})).toEqual(["cards", "list", {}]);
    });
  });

  describe("details", () => {
    it("extends base key with detail", () => {
      expect(cardKeys.details()).toEqual(["cards", "detail"]);
    });
  });

  describe("detail", () => {
    it("includes card id", () => {
      expect(cardKeys.detail("card-123")).toEqual([
        "cards",
        "detail",
        "card-123",
      ]);
    });

    it("creates unique keys for different ids", () => {
      const key1 = cardKeys.detail("card-1");
      const key2 = cardKeys.detail("card-2");
      expect(key1).not.toEqual(key2);
    });
  });
});

describe("collectionKeys", () => {
  describe("all", () => {
    it("returns base key array", () => {
      expect(collectionKeys.all).toEqual(["collections"]);
    });
  });

  describe("local", () => {
    it("includes path", () => {
      expect(collectionKeys.local("/data/games")).toEqual([
        "collections",
        "local",
        "/data/games",
      ]);
    });
  });
});

describe("categoryKeys", () => {
  describe("all", () => {
    it("returns base key array", () => {
      expect(categoryKeys.all).toEqual(["categories"]);
    });
  });

  describe("list", () => {
    it("extends base key with list", () => {
      expect(categoryKeys.list()).toEqual(["categories", "list"]);
    });
  });
});

describe("key hierarchy", () => {
  it("card list keys start with card base key", () => {
    const listKey = cardKeys.list({ category: "test" });
    expect(listKey.slice(0, 1)).toEqual(cardKeys.all);
  });

  it("card detail keys start with card base key", () => {
    const detailKey = cardKeys.detail("123");
    expect(detailKey.slice(0, 1)).toEqual(cardKeys.all);
  });
});
