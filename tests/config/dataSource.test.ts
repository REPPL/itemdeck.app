/**
 * Tests for data source configuration.
 */

import { describe, it, expect } from "vitest";
import {
  isGitHubRawUrl,
  buildMyPlausibleMeUrl,
  isMyPlausibleMeUrl,
  parseMyPlausibleMeUrl,
} from "@/config/dataSource";

describe("isGitHubRawUrl", () => {
  it("returns true for valid raw URLs", () => {
    expect(
      isGitHubRawUrl(
        "https://raw.githubusercontent.com/owner/repo/main/file.json"
      )
    ).toBe(true);
  });

  it("returns false for GitHub web URLs", () => {
    expect(isGitHubRawUrl("https://github.com/owner/repo")).toBe(false);
  });

  it("returns false for other domains", () => {
    expect(isGitHubRawUrl("https://example.com/file.json")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isGitHubRawUrl("not-a-url")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isGitHubRawUrl("")).toBe(false);
  });
});

describe("buildMyPlausibleMeUrl", () => {
  it("builds a CDN URL for a nested collection folder", () => {
    expect(
      buildMyPlausibleMeUrl({ username: "REPPL", folder: "retro/games" })
    ).toBe(
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro/games"
    );
  });

  it("supports a custom branch", () => {
    expect(
      buildMyPlausibleMeUrl({
        username: "REPPL",
        folder: "retro/commercials",
        branch: "develop",
      })
    ).toBe(
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@develop/data/collections/retro/commercials"
    );
  });
});

describe("isMyPlausibleMeUrl", () => {
  it("accepts a nested jsDelivr collection path", () => {
    expect(
      isMyPlausibleMeUrl(
        "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro/games"
      )
    ).toBe(true);
  });

  it("accepts a single-segment jsDelivr collection path", () => {
    expect(
      isMyPlausibleMeUrl(
        "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/movies"
      )
    ).toBe(true);
  });

  it("accepts a nested raw.githubusercontent path", () => {
    expect(
      isMyPlausibleMeUrl(
        "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro/games"
      )
    ).toBe(true);
  });

  it("rejects a non-MyPlausibleMe repository", () => {
    expect(
      isMyPlausibleMeUrl(
        "https://cdn.jsdelivr.net/gh/REPPL/OtherRepo@main/data/collections/retro/games"
      )
    ).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isMyPlausibleMeUrl("not-a-url")).toBe(false);
  });
});

describe("parseMyPlausibleMeUrl", () => {
  it("parses a nested jsDelivr URL, capturing the full folder path", () => {
    expect(
      parseMyPlausibleMeUrl(
        "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro/games"
      )
    ).toEqual({ username: "REPPL", folder: "retro/games", branch: "main" });
  });

  it("parses a nested raw.githubusercontent URL", () => {
    expect(
      parseMyPlausibleMeUrl(
        "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/develop/data/collections/retro/commercials"
      )
    ).toEqual({
      username: "REPPL",
      folder: "retro/commercials",
      branch: "develop",
    });
  });

  it("returns null for a non-MyPlausibleMe URL", () => {
    expect(
      parseMyPlausibleMeUrl(
        "https://cdn.jsdelivr.net/gh/REPPL/OtherRepo@main/data/collections/retro/games"
      )
    ).toBeNull();
  });
});
