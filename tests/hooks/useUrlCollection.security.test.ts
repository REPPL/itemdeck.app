/**
 * Security tests for parseUrlPath: the ?collection= ingestion point must
 * enforce the source allowlist instead of accepting anything http-ish.
 */

import { describe, it, expect } from "vitest";
import { parseUrlPath } from "@/hooks/useUrlCollection";

describe("parseUrlPath allowlist enforcement", () => {
  it("rejects a non-allowlisted origin with a user-visible error", () => {
    const params = new URLSearchParams(
      "collection=https://evil.example/x"
    );
    const result = parseUrlPath("/", params);

    expect(result.directLoad).toBe(false);
    expect(result.collectionUrl).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("evil.example");
  });

  it("rejects insecure http URLs even for allowlisted hosts", () => {
    const params = new URLSearchParams(
      "collection=http://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games"
    );
    const result = parseUrlPath("/", params);

    expect(result.directLoad).toBe(false);
    expect(result.collectionUrl).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("rejects non-http schemes such as javascript:", () => {
    const params = new URLSearchParams("collection=javascript:alert(1)");
    const result = parseUrlPath("/", params);

    expect(result.directLoad).toBe(false);
    expect(result.collectionUrl).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('does not treat "httpfoo" as a URL (old startsWith bug)', () => {
    const params = new URLSearchParams("collection=httpfoo");
    const result = parseUrlPath("/", params);

    // Not an absolute URL: falls through to the other patterns, no direct load.
    expect(result.directLoad).toBe(false);
    expect(result.collectionUrl).toBeNull();
    expect(result.error).toBeNull();
  });

  it("still accepts an allowlisted jsDelivr URL", () => {
    const url =
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games";
    const params = new URLSearchParams(`collection=${url}`);
    const result = parseUrlPath("/", params);

    expect(result.directLoad).toBe(true);
    expect(result.collectionUrl).toBe(url);
    expect(result.error).toBeNull();
  });

  it("still accepts an allowlisted raw.githubusercontent.com URL", () => {
    const url =
      "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro-games";
    const params = new URLSearchParams(`collection=${url}`);
    const result = parseUrlPath("/", params);

    expect(result.directLoad).toBe(true);
    expect(result.collectionUrl).toBe(url);
    expect(result.error).toBeNull();
  });

  it("rejects lookalike subdomains of allowlisted hosts", () => {
    const params = new URLSearchParams(
      "collection=https://cdn.jsdelivr.net.evil.example/x"
    );
    const result = parseUrlPath("/", params);

    expect(result.directLoad).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
