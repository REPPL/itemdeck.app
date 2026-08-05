/**
 * Tests for SourceIcon source detection.
 *
 * Detection must be based on the URL's hostname, not a substring of the whole
 * URL: otherwise an untrusted collection could brand an attacker link with a
 * trusted source's icon and name via a path like
 * `https://evil.example/en.wikipedia.org/x`.
 */

import { describe, it, expect } from "vitest";
import {
  isKnownSource,
  getSourceName,
  getSourceShortName,
} from "@/components/SourceIcon/SourceIcon";

describe("SourceIcon host-based detection", () => {
  it("recognises a genuine Wikipedia host (including subdomains)", () => {
    expect(isKnownSource("https://en.wikipedia.org/wiki/Example")).toBe(true);
    expect(getSourceName("https://en.wikipedia.org/wiki/Example")).toBe(
      "Wikipedia"
    );
    expect(getSourceShortName("https://en.wikipedia.org/wiki/Example")).toEqual(
      { shortName: "W", title: "Wikipedia" }
    );
  });

  it("does not brand an attacker URL that only contains the domain in its path", () => {
    const spoof = "https://evil.example/en.wikipedia.org/Free_Games";
    expect(isKnownSource(spoof)).toBe(false);
    expect(getSourceName(spoof)).toBeUndefined();
    expect(getSourceShortName(spoof)).toBeUndefined();
  });

  it("does not brand a look-alike host that suffixes the domain onto another registrable domain", () => {
    const spoof = "https://wikipedia.org.evil.example/x";
    expect(isKnownSource(spoof)).toBe(false);
    expect(getSourceShortName(spoof)).toBeUndefined();
  });

  it("no longer false-matches a substring host (design.com vs ign.com)", () => {
    expect(isKnownSource("https://www.design.com/portfolio")).toBe(false);
    expect(
      getSourceShortName("https://www.design.com/portfolio")
    ).toBeUndefined();
  });

  it("recognises an additional-source host by hostname", () => {
    expect(
      getSourceShortName("https://www.metacritic.com/game/example")
    ).toEqual({ shortName: "MC", title: "Metacritic" });
    // ...but not when the domain merely appears in the path.
    expect(
      getSourceShortName("https://evil.example/metacritic.com/x")
    ).toBeUndefined();
  });

  it("returns no match for non-absolute or unparseable URLs", () => {
    expect(isKnownSource("en.wikipedia.org/wiki/Example")).toBe(false);
    expect(isKnownSource("not a url")).toBe(false);
    expect(getSourceShortName("")).toBeUndefined();
  });
});
