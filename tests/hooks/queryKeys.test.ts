/**
 * Tests for query key factories.
 */

import { describe, it, expect } from "vitest";
import { collectionKeys } from "@/hooks/queryKeys";

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

  describe("key hierarchy", () => {
    it("local keys start with collection base key", () => {
      const localKey = collectionKeys.local("/data/games");
      expect(localKey.slice(0, 1)).toEqual(collectionKeys.all);
    });
  });
});
