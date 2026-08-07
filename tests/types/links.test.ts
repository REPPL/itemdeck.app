/**
 * Tests for detail link normalisation, including URL sanitisation
 * (normaliseDetailUrls is the choke point for collection-supplied links).
 */

import { describe, it, expect } from "vitest";
import { normaliseDetailUrls, type DetailUrls } from "@/types/links";

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

  it("does not throw on null array elements from untrusted collection data", () => {
    // A .loose() entity schema lets `detailUrls` pass through unvalidated, so a
    // collection can supply `"detailUrls": [null]`. The choke point must not
    // dereference `.url` on a null element (that throw would reject the whole
    // collection load, not just drop one link).
    expect(() =>
      normaliseDetailUrls([null] as unknown as DetailUrls)
    ).not.toThrow();
    expect(normaliseDetailUrls([null] as unknown as DetailUrls)).toEqual([]);
  });

  it("drops null/malformed array elements while keeping valid links", () => {
    expect(
      normaliseDetailUrls([
        { url: "https://ok.example.com" },
        null,
        undefined,
        5,
        "https://bare-string.example.com",
        { url: "javascript:alert(1)" },
      ] as unknown as DetailUrls)
    ).toEqual([{ url: "https://ok.example.com" }]);
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

describe("normaliseDetailUrls untrusted metadata", () => {
  // The v2 entity schema is loose, so detailUrls entries reach the render
  // with arbitrary shapes. Round 5 hardened the URL; source and label were
  // still passed through untyped, and SourcesOverlay lowercases source
  // during render while CardExpanded renders both as JSX children — so a
  // non-string value crashed the whole card grid up to the query boundary.
  it("drops a non-string source", () => {
    expect(
      normaliseDetailUrls({
        url: "https://example.com",
        source: 5,
      } as unknown as DetailUrls)
    ).toEqual([{ url: "https://example.com" }]);
  });

  it("drops an object source", () => {
    expect(
      normaliseDetailUrls({
        url: "https://example.com",
        source: { en: "Wikipedia" },
      } as unknown as DetailUrls)
    ).toEqual([{ url: "https://example.com" }]);
  });

  it("drops a non-string label", () => {
    expect(
      normaliseDetailUrls({
        url: "https://example.com",
        label: { en: "Read more" },
      } as unknown as DetailUrls)
    ).toEqual([{ url: "https://example.com" }]);
  });

  it("keeps valid string source and label", () => {
    expect(
      normaliseDetailUrls({
        url: "https://example.com",
        source: "Wikipedia",
        label: "Read more",
      })
    ).toEqual([
      { url: "https://example.com", source: "Wikipedia", label: "Read more" },
    ]);
  });
});
