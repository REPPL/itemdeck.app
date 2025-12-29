/**
 * Tests for GitHub API discovery and rate limiting.
 *
 * @see F-091: Entity Auto-Discovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseRateLimitHeaders,
  isRateLimited,
  clearRateLimitState,
  setRateLimitReset,
  parseJsDelivrUrl,
  isJsDelivrGitHubUrl,
  discoverEntitiesViaGitHub,
} from "@/loaders/githubDiscovery";

describe("githubDiscovery", () => {
  describe("parseRateLimitHeaders", () => {
    it("parses valid rate limit headers", () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "42");
      headers.set("X-RateLimit-Reset", "1735500000");

      const response = new Response(null, { headers });
      const result = parseRateLimitHeaders(response);

      expect(result).toEqual({
        remaining: 42,
        reset: 1735500000,
      });
    });

    it("returns null for missing remaining header", () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Reset", "1735500000");

      const response = new Response(null, { headers });
      const result = parseRateLimitHeaders(response);

      expect(result).toBeNull();
    });

    it("returns null for missing reset header", () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "42");

      const response = new Response(null, { headers });
      const result = parseRateLimitHeaders(response);

      expect(result).toBeNull();
    });

    it("returns null for no headers", () => {
      const response = new Response(null);
      const result = parseRateLimitHeaders(response);

      expect(result).toBeNull();
    });

    it("parses zero remaining correctly", () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "0");
      headers.set("X-RateLimit-Reset", "1735500000");

      const response = new Response(null, { headers });
      const result = parseRateLimitHeaders(response);

      expect(result).toEqual({
        remaining: 0,
        reset: 1735500000,
      });
    });
  });

  describe("isRateLimited", () => {
    beforeEach(() => {
      clearRateLimitState();
    });

    afterEach(() => {
      clearRateLimitState();
    });

    it("returns false when no rate limit recorded", () => {
      expect(isRateLimited()).toBe(false);
    });

    it("returns true when rate limited and not expired", () => {
      // Set rate limit to 1 hour in the future
      const futureReset = Math.floor(Date.now() / 1000) + 3600;
      setRateLimitReset(futureReset);

      expect(isRateLimited()).toBe(true);
    });

    it("returns false when rate limit has expired", () => {
      // Set rate limit to 1 hour in the past
      const pastReset = Math.floor(Date.now() / 1000) - 3600;
      setRateLimitReset(pastReset);

      expect(isRateLimited()).toBe(false);
    });

    it("returns false after clearing rate limit state", () => {
      const futureReset = Math.floor(Date.now() / 1000) + 3600;
      setRateLimitReset(futureReset);

      expect(isRateLimited()).toBe(true);

      clearRateLimitState();

      expect(isRateLimited()).toBe(false);
    });
  });

  describe("clearRateLimitState", () => {
    beforeEach(() => {
      clearRateLimitState();
    });

    it("clears the rate limit state", () => {
      const futureReset = Math.floor(Date.now() / 1000) + 3600;
      setRateLimitReset(futureReset);

      expect(isRateLimited()).toBe(true);

      clearRateLimitState();

      expect(isRateLimited()).toBe(false);
    });

    it("is safe to call multiple times", () => {
      clearRateLimitState();
      clearRateLimitState();
      clearRateLimitState();

      expect(isRateLimited()).toBe(false);
    });
  });

  describe("setRateLimitReset", () => {
    beforeEach(() => {
      clearRateLimitState();
    });

    afterEach(() => {
      clearRateLimitState();
    });

    it("sets the rate limit reset timestamp", () => {
      const futureReset = Math.floor(Date.now() / 1000) + 3600;
      setRateLimitReset(futureReset);

      expect(isRateLimited()).toBe(true);
    });

    it("accepts null to clear the state", () => {
      const futureReset = Math.floor(Date.now() / 1000) + 3600;
      setRateLimitReset(futureReset);
      expect(isRateLimited()).toBe(true);

      setRateLimitReset(null);
      expect(isRateLimited()).toBe(false);
    });
  });

  describe("parseJsDelivrUrl", () => {
    it("parses valid jsDelivr URL", () => {
      const url =
        "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games";
      const result = parseJsDelivrUrl(url);

      expect(result).toEqual({
        owner: "REPPL",
        repo: "MyPlausibleMe",
        branch: "main",
        path: "data/collections/retro-games",
      });
    });

    it("parses URL with nested path", () => {
      const url =
        "https://cdn.jsdelivr.net/gh/owner/repo@v1.0.0/deep/nested/path/to/data";
      const result = parseJsDelivrUrl(url);

      expect(result).toEqual({
        owner: "owner",
        repo: "repo",
        branch: "v1.0.0",
        path: "deep/nested/path/to/data",
      });
    });

    it("returns null for non-jsDelivr URL", () => {
      const url = "https://raw.githubusercontent.com/owner/repo/main/data";
      const result = parseJsDelivrUrl(url);

      expect(result).toBeNull();
    });

    it("returns null for malformed jsDelivr URL", () => {
      const url = "https://cdn.jsdelivr.net/gh/owner/repo/data";
      const result = parseJsDelivrUrl(url);

      expect(result).toBeNull();
    });

    it("returns null for empty path", () => {
      // This should fail because the regex requires a path after @branch/
      const url = "https://cdn.jsdelivr.net/gh/owner/repo@main/";
      const result = parseJsDelivrUrl(url);

      expect(result).toBeNull();
    });
  });

  describe("isJsDelivrGitHubUrl", () => {
    it("returns true for valid jsDelivr GitHub URL", () => {
      expect(
        isJsDelivrGitHubUrl("https://cdn.jsdelivr.net/gh/owner/repo@main/path")
      ).toBe(true);
    });

    it("returns true for http URL", () => {
      expect(
        isJsDelivrGitHubUrl("http://cdn.jsdelivr.net/gh/owner/repo@main/path")
      ).toBe(true);
    });

    it("returns false for non-jsDelivr URL", () => {
      expect(
        isJsDelivrGitHubUrl("https://raw.githubusercontent.com/owner/repo/main")
      ).toBe(false);
    });

    it("returns false for npm jsDelivr URL", () => {
      expect(isJsDelivrGitHubUrl("https://cdn.jsdelivr.net/npm/lodash")).toBe(
        false
      );
    });
  });

  describe("discoverEntitiesViaGitHub", () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      clearRateLimitState();
      vi.stubGlobal("fetch", mockFetch);
      mockFetch.mockReset();
    });

    afterEach(() => {
      clearRateLimitState();
      vi.unstubAllGlobals();
    });

    it("returns null for non-jsDelivr URL", async () => {
      const result = await discoverEntitiesViaGitHub(
        "https://example.com/data/games"
      );

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("skips API call when rate limited", async () => {
      const futureReset = Math.floor(Date.now() / 1000) + 3600;
      setRateLimitReset(futureReset);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[GitHub Discovery] Skipping due to rate limit"
      );

      consoleSpy.mockRestore();
    });

    it("returns entity IDs from successful API response", async () => {
      const mockContents = [
        { name: "001-mario.json", type: "file" },
        { name: "002-zelda.json", type: "file" },
        { name: "003-metroid.json", type: "file" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toEqual(["001-mario", "002-zelda", "003-metroid"]);
    });

    it("filters out non-JSON files", async () => {
      const mockContents = [
        { name: "001-mario.json", type: "file" },
        { name: "readme.md", type: "file" },
        { name: "image.png", type: "file" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toEqual(["001-mario"]);
    });

    it("filters out underscore-prefixed files", async () => {
      const mockContents = [
        { name: "001-mario.json", type: "file" },
        { name: "_template.json", type: "file" },
        { name: "_schema.json", type: "file" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toEqual(["001-mario"]);
    });

    it("filters out index.json", async () => {
      const mockContents = [
        { name: "001-mario.json", type: "file" },
        { name: "index.json", type: "file" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toEqual(["001-mario"]);
    });

    it("filters out directories", async () => {
      const mockContents = [
        { name: "001-mario.json", type: "file" },
        { name: "subdir", type: "dir" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toEqual(["001-mario"]);
    });

    it("returns null when no valid entities found", async () => {
      const mockContents = [
        { name: "_template.json", type: "file" },
        { name: "index.json", type: "file" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toBeNull();
    });

    it("returns null for single file response (not a directory)", async () => {
      const mockContent = { name: "file.json", type: "file" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContent),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toBeNull();
    });

    it("handles 403 rate limit response", async () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "0");
      headers.set("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 3600));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers,
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toBeNull();
      expect(isRateLimited()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[GitHub Discovery] Rate limited until")
      );

      consoleSpy.mockRestore();
    });

    it("handles 403 without rate limit headers (forbidden)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers(),
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toBeNull();
      expect(isRateLimited()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[GitHub Discovery] Access forbidden (403)"
      );

      consoleSpy.mockRestore();
    });

    it("handles 404 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/nonexistent"
      );

      expect(result).toBeNull();
    });

    it("handles fetch error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[GitHub Discovery] API discovery failed:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("sorts entity IDs alphabetically", async () => {
      const mockContents = [
        { name: "zelda.json", type: "file" },
        { name: "mario.json", type: "file" },
        { name: "kirby.json", type: "file" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
      });

      const result = await discoverEntitiesViaGitHub(
        "https://cdn.jsdelivr.net/gh/owner/repo@main/data/games"
      );

      expect(result).toEqual(["kirby", "mario", "zelda"]);
    });
  });
});
