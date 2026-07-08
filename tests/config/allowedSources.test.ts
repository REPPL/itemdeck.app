/**
 * Tests for the collection-source allowlist enforcement helper.
 */

import { describe, it, expect } from "vitest";
import { isAllowedCollectionSource } from "@/config/allowedSources";

describe("isAllowedCollectionSource", () => {
  it("allows allowlisted CDN hosts over https", () => {
    expect(
      isAllowedCollectionSource("https://cdn.jsdelivr.net/gh/u/r@main/x")
    ).toBe(true);
    expect(
      isAllowedCollectionSource("https://cdn.statically.io/gh/u/r/main/x")
    ).toBe(true);
  });

  it("allows allowlisted input hosts over https", () => {
    expect(
      isAllowedCollectionSource("https://raw.githubusercontent.com/u/r/main/x")
    ).toBe(true);
  });

  it("rejects non-allowlisted hosts", () => {
    expect(isAllowedCollectionSource("https://evil.example/x")).toBe(false);
  });

  it("rejects lookalike subdomains", () => {
    expect(
      isAllowedCollectionSource("https://cdn.jsdelivr.net.evil.example/x")
    ).toBe(false);
    expect(
      isAllowedCollectionSource("https://evil.cdn.jsdelivr.net/x")
    ).toBe(false);
  });

  it("rejects insecure http even for allowlisted hosts", () => {
    expect(isAllowedCollectionSource("http://cdn.jsdelivr.net/x")).toBe(false);
  });

  it("rejects non-http schemes", () => {
    expect(isAllowedCollectionSource("javascript:alert(1)")).toBe(false);
    expect(isAllowedCollectionSource("ftp://cdn.jsdelivr.net/x")).toBe(false);
  });

  it("rejects protocol-relative URLs to non-allowlisted hosts", () => {
    expect(isAllowedCollectionSource("//evil.example/x")).toBe(false);
  });

  it("allows same-origin relative paths", () => {
    expect(isAllowedCollectionSource("/collections/demo")).toBe(true);
    expect(isAllowedCollectionSource("collections/demo")).toBe(true);
    expect(isAllowedCollectionSource("./collections/demo")).toBe(true);
  });
});
