/**
 * Tests for safeExternalUrl (stored XSS guard for collection-supplied URLs).
 */

import { describe, it, expect } from "vitest";
import { safeExternalUrl } from "@/utils/safeUrl";

describe("safeExternalUrl", () => {
  it("returns http URLs unchanged", () => {
    expect(safeExternalUrl("http://example.com/page")).toBe(
      "http://example.com/page"
    );
  });

  it("returns https URLs unchanged", () => {
    expect(safeExternalUrl("https://example.com/page?a=1#frag")).toBe(
      "https://example.com/page?a=1#frag"
    );
  });

  it("allows mailto URLs", () => {
    expect(safeExternalUrl("mailto:someone@example.com")).toBe(
      "mailto:someone@example.com"
    );
  });

  it("rejects javascript URLs", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects mixed-case JAVASCRIPT URLs", () => {
    expect(safeExternalUrl("JavaScRipt:alert(1)")).toBeNull();
    expect(safeExternalUrl("JAVASCRIPT:alert(1)")).toBeNull();
  });

  it("rejects whitespace-prefixed javascript URLs", () => {
    expect(safeExternalUrl("\tjavascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("  javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("\njavascript:alert(1)")).toBeNull();
  });

  it("rejects javascript URLs with embedded tab/newline in the scheme", () => {
    // The WHATWG URL parser strips ASCII tabs/newlines, so these still
    // parse as javascript: and must be rejected
    expect(safeExternalUrl("java\tscript:alert(1)")).toBeNull();
    expect(safeExternalUrl("java\nscript:alert(1)")).toBeNull();
  });

  it("rejects data URLs", () => {
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects vbscript URLs", () => {
    expect(safeExternalUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("allows protocol-relative URLs (they inherit http/https)", () => {
    expect(safeExternalUrl("//example.com/page")).toBe("//example.com/page");
  });

  it("allows plain relative strings (they resolve within http/https)", () => {
    expect(safeExternalUrl("some/relative/path")).toBe("some/relative/path");
  });

  it("trims surrounding whitespace from safe URLs", () => {
    expect(safeExternalUrl("  https://example.com/  ")).toBe(
      "https://example.com/"
    );
  });

  it("rejects empty and whitespace-only strings", () => {
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
  });

  it("rejects null and undefined", () => {
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
  });

  it("rejects non-http(s) schemes such as file and ftp", () => {
    expect(safeExternalUrl("file:///etc/passwd")).toBeNull();
    expect(safeExternalUrl("ftp://example.com/file")).toBeNull();
  });
});
