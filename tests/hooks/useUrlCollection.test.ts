/**
 * Tests for useUrlCollection hook and parseUrlPath function.
 */

import { describe, it, expect } from "vitest";
import { parseUrlPath } from "@/hooks/useUrlCollection";

describe("parseUrlPath", () => {
  describe("legacy full URL format", () => {
    it("should parse ?collection=https://... format", () => {
      const params = new URLSearchParams("collection=https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games");
      const result = parseUrlPath("/", params);

      expect(result.directLoad).toBe(true);
      expect(result.collectionUrl).toBe("https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games");
      expect(result.providerId).toBeNull();
    });
  });

  describe("query param format with 'c' alias", () => {
    it("should parse /gh?u=USER&c=folder format", () => {
      const params = new URLSearchParams("u=REPPL&c=my_games");
      const result = parseUrlPath("/gh", params);

      expect(result.directLoad).toBe(true);
      expect(result.hasGitHubPath).toBe(true);
      expect(result.username).toBe("REPPL");
      expect(result.folder).toBe("my_games");
      expect(result.providerId).toBe("gh");
      expect(result.collectionUrl).toContain("my_games");
    });

    it("should parse /gh?u=USER&c=nested/folder format", () => {
      const params = new URLSearchParams("u=REPPL&c=retro/my_games");
      const result = parseUrlPath("/gh", params);

      expect(result.directLoad).toBe(true);
      expect(result.folder).toBe("retro/my_games");
      expect(result.collectionUrl).toContain("retro/my_games");
    });

    it("should prefer 'collection' over 'c' if both present", () => {
      const params = new URLSearchParams("u=REPPL&c=short&collection=full");
      const result = parseUrlPath("/gh", params);

      expect(result.folder).toBe("full");
    });
  });

  describe("query param format with full 'collection'", () => {
    it("should parse /gh?u=USER&collection=folder format", () => {
      const params = new URLSearchParams("u=REPPL&collection=commercials");
      const result = parseUrlPath("/gh", params);

      expect(result.directLoad).toBe(true);
      expect(result.username).toBe("REPPL");
      expect(result.folder).toBe("commercials");
    });
  });

  describe("new path format with /c/", () => {
    it("should parse /gh/USER/c/folder format", () => {
      const result = parseUrlPath("/gh/REPPL/c/my_games");

      expect(result.directLoad).toBe(true);
      expect(result.hasGitHubPath).toBe(true);
      expect(result.username).toBe("REPPL");
      expect(result.folder).toBe("my_games");
      expect(result.providerId).toBe("gh");
    });

    it("should parse /gh/USER/c/nested/folder format", () => {
      const result = parseUrlPath("/gh/REPPL/c/retro/my_games");

      expect(result.directLoad).toBe(true);
      expect(result.folder).toBe("retro/my_games");
      expect(result.collectionUrl).toContain("retro/my_games");
    });

    it("should handle trailing slash", () => {
      const result = parseUrlPath("/gh/REPPL/c/my_games/");

      expect(result.directLoad).toBe(true);
      expect(result.folder).toBe("my_games");
    });

    it("should handle deeply nested folders", () => {
      const result = parseUrlPath("/gh/REPPL/c/games/retro/snes/rpg");

      expect(result.directLoad).toBe(true);
      expect(result.folder).toBe("games/retro/snes/rpg");
    });
  });

  describe("legacy path format with /collection/", () => {
    it("should parse /gh/USER/collection/folder/ format", () => {
      const result = parseUrlPath("/gh/REPPL/collection/retro-games/");

      expect(result.directLoad).toBe(true);
      expect(result.username).toBe("REPPL");
      expect(result.folder).toBe("retro-games");
    });
  });

  describe("username only", () => {
    it("should parse /gh/USER/ format (opens picker)", () => {
      const result = parseUrlPath("/gh/REPPL/");

      expect(result.directLoad).toBe(false);
      expect(result.hasGitHubPath).toBe(true);
      expect(result.username).toBe("REPPL");
      expect(result.folder).toBeNull();
    });
  });

  describe("no match", () => {
    it("should return empty result for non-matching paths", () => {
      const result = parseUrlPath("/about");

      expect(result.hasGitHubPath).toBe(false);
      expect(result.directLoad).toBe(false);
      expect(result.username).toBeNull();
    });
  });
});
