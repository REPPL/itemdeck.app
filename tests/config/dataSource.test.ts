/**
 * Tests for data source configuration.
 */

import { describe, it, expect } from "vitest";
import {
  buildRawUrl,
  buildManifestUrl,
  defaultDataSource,
  isGitHubRawUrl,
  type GitHubRawConfig,
} from "@/config/dataSource";

describe("buildRawUrl", () => {
  it("builds correct URL with all parameters", () => {
    const config: GitHubRawConfig = {
      owner: "REPPL",
      repo: "MyPlausibleMe",
      collection: "retro-games",
      branch: "develop",
    };

    const url = buildRawUrl(config, "items.json");

    expect(url).toBe(
      "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/develop/data/collections/retro-games/items.json"
    );
  });

  it("defaults branch to main", () => {
    const config: GitHubRawConfig = {
      owner: "REPPL",
      repo: "MyPlausibleMe",
      collection: "retro-games",
    };

    const url = buildRawUrl(config, "categories.json");

    expect(url).toBe(
      "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro-games/categories.json"
    );
  });

  it("handles different file types", () => {
    const config: GitHubRawConfig = {
      owner: "test",
      repo: "data",
      collection: "movies",
    };

    expect(buildRawUrl(config, "collection.json")).toContain("collection.json");
    expect(buildRawUrl(config, "items.json")).toContain("items.json");
    expect(buildRawUrl(config, "categories.json")).toContain("categories.json");
  });
});

describe("buildManifestUrl", () => {
  it("builds correct manifest URL", () => {
    const url = buildManifestUrl("REPPL", "MyPlausibleMe", "main");

    expect(url).toBe(
      "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/manifest.json"
    );
  });

  it("defaults branch to main", () => {
    const url = buildManifestUrl("REPPL", "MyPlausibleMe");

    expect(url).toContain("/main/");
  });

  it("supports custom branch", () => {
    const url = buildManifestUrl("owner", "repo", "feature-branch");

    expect(url).toContain("/feature-branch/");
  });
});

describe("defaultDataSource", () => {
  it("has correct owner", () => {
    expect(defaultDataSource.owner).toBe("REPPL");
  });

  it("has correct repo", () => {
    expect(defaultDataSource.repo).toBe("MyPlausibleMe");
  });

  it("has correct collection", () => {
    expect(defaultDataSource.collection).toBe("retro-games");
  });

  it("has branch set to main", () => {
    expect(defaultDataSource.branch).toBe("main");
  });
});

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
