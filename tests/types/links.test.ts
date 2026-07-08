/**
 * Tests for detail link normalisation, including URL sanitisation
 * (normaliseDetailUrls is the choke point for collection-supplied links).
 */

import { describe, it, expect } from "vitest";
import { normaliseDetailUrls } from "@/types/links";

describe("normaliseDetailUrls", () => {
  it("returns empty array for null/undefined", () => {
    expect(normaliseDetailUrls(null)).toEqual([]);
    expect(normaliseDetailUrls(undefined)).toEqual([]);
  });

  it("wraps a plain string URL", () => {
    expect(normaliseDetailUrls("https://example.com")).toEqual([
      { url: "https://example.com" },
    ]);
  });

  it("wraps a single DetailLink", () => {
    expect(
      normaliseDetailUrls({ url: "https://example.com", source: "Wikipedia" })
    ).toEqual([{ url: "https://example.com", source: "Wikipedia" }]);
  });

  it("passes through an array of DetailLinks", () => {
    const links = [
      { url: "https://one.example.com" },
      { url: "https://two.example.com" },
    ];
    expect(normaliseDetailUrls(links)).toEqual(links);
  });

  it("drops a javascript: string URL", () => {
    expect(normaliseDetailUrls("javascript:alert(1)")).toEqual([]);
  });

  it("drops a single DetailLink with a javascript: URL", () => {
    expect(normaliseDetailUrls({ url: "javascript:alert(1)" })).toEqual([]);
  });

  it("filters unsafe URLs out of an array while keeping safe ones", () => {
    expect(
      normaliseDetailUrls([
        { url: "https://safe.example.com" },
        { url: "javascript:alert(1)", source: "Evil" },
        { url: "data:text/html,<script>alert(1)</script>" },
        { url: "http://also-safe.example.com" },
      ])
    ).toEqual([
      { url: "https://safe.example.com" },
      { url: "http://also-safe.example.com" },
    ]);
  });
});
