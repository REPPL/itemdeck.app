/**
 * Tests for base path helpers.
 *
 * The app is served from a subpath ("/demo/") in production while
 * vitest defaults import.meta.env.BASE_URL to "/". The helpers must be
 * robust to both.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { withBase, stripBase, getBasePath } from "@/config/basePath";
import { parseUrlPath } from "@/hooks/useUrlCollection";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getBasePath", () => {
  it("returns '/' under the default vitest environment", () => {
    expect(getBasePath()).toBe("/");
  });

  it("returns the configured base with leading and trailing slashes", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    expect(getBasePath()).toBe("/demo/");
  });

  it("normalises a base missing its trailing slash", () => {
    vi.stubEnv("BASE_URL", "/demo");
    expect(getBasePath()).toBe("/demo/");
  });
});

describe("withBase", () => {
  it("is a passthrough when the base is '/'", () => {
    expect(withBase("/themes/")).toBe("/themes/");
    expect(withBase("/data/retro-games")).toBe("/data/retro-games");
  });

  it("prefixes root-absolute paths with the base", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    expect(withBase("/themes/")).toBe("/demo/themes/");
    expect(withBase("/data/collections/retro-games")).toBe(
      "/demo/data/collections/retro-games"
    );
  });

  it("handles paths without a leading slash", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    expect(withBase("themes/index.json")).toBe("/demo/themes/index.json");
  });

  it("accepts an explicit base argument", () => {
    expect(withBase("/themes/", "/demo/")).toBe("/demo/themes/");
    expect(withBase("/themes/", "/")).toBe("/themes/");
  });
});

describe("stripBase", () => {
  it("is a passthrough when the base is '/'", () => {
    expect(stripBase("/gh/REPPL/c/my_games")).toBe("/gh/REPPL/c/my_games");
  });

  it("strips the base prefix from pathnames", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    expect(stripBase("/demo/gh/REPPL/c/my_games")).toBe("/gh/REPPL/c/my_games");
    expect(stripBase("/demo/gh")).toBe("/gh");
  });

  it("maps the bare base (with or without trailing slash) to '/'", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    expect(stripBase("/demo/")).toBe("/");
    expect(stripBase("/demo")).toBe("/");
  });

  it("leaves non-matching pathnames untouched", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    expect(stripBase("/gh/REPPL")).toBe("/gh/REPPL");
    expect(stripBase("/demonstration/gh")).toBe("/demonstration/gh");
  });

  it("accepts an explicit base argument", () => {
    expect(stripBase("/demo/gh/REPPL", "/demo/")).toBe("/gh/REPPL");
  });
});

describe("parseUrlPath under a non-root base", () => {
  it("parses /demo/gh?u=USER&c=folder", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    const params = new URLSearchParams("u=REPPL&c=my_games");
    const result = parseUrlPath("/demo/gh", params);

    expect(result.directLoad).toBe(true);
    expect(result.hasGitHubPath).toBe(true);
    expect(result.username).toBe("REPPL");
    expect(result.folder).toBe("my_games");
    expect(result.providerId).toBe("gh");
  });

  it("parses /demo/gh/USER/c/folder", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    const result = parseUrlPath("/demo/gh/REPPL/c/retro/my_games");

    expect(result.directLoad).toBe(true);
    expect(result.username).toBe("REPPL");
    expect(result.folder).toBe("retro/my_games");
  });

  it("parses /demo/gh/USER/ (opens picker)", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    const result = parseUrlPath("/demo/gh/REPPL/");

    expect(result.directLoad).toBe(false);
    expect(result.hasGitHubPath).toBe(true);
    expect(result.username).toBe("REPPL");
  });

  it("treats the bare base as no collection path", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    const result = parseUrlPath("/demo/");

    expect(result.hasGitHubPath).toBe(false);
    expect(result.directLoad).toBe(false);
  });

  // Legacy root-relative /gh paths must keep parsing under the /demo/
  // base: the hosting layer serves the app shell for them via a 200
  // rewrite (site/_redirects) and relies on the app to understand the
  // un-prefixed URL.
  it("parses legacy /gh?u=USER&c=folder served via rewrite", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    const params = new URLSearchParams("u=REPPL&c=retro/my_games");
    const result = parseUrlPath("/gh", params);

    expect(result.directLoad).toBe(true);
    expect(result.username).toBe("REPPL");
    expect(result.folder).toBe("retro/my_games");
  });

  it("parses legacy /gh/USER/c/folder served via rewrite", () => {
    vi.stubEnv("BASE_URL", "/demo/");
    const result = parseUrlPath("/gh/REPPL/c/retro/my_games");

    expect(result.directLoad).toBe(true);
    expect(result.username).toBe("REPPL");
    expect(result.folder).toBe("retro/my_games");
  });
});
