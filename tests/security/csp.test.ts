/**
 * Tests that index.html ships a restrictive Content-Security-Policy.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Vitest runs with the project root as the working directory
const indexHtmlPath = resolve(process.cwd(), "index.html");

function getCspContent(): string {
  const html = readFileSync(indexHtmlPath, "utf8");
  const doc = new DOMParser().parseFromString(html, "text/html");
  const meta = doc.querySelector(
    'meta[http-equiv="Content-Security-Policy"]'
  );
  expect(meta, "CSP meta tag must exist in index.html").not.toBeNull();
  return meta?.getAttribute("content") ?? "";
}

describe("index.html Content-Security-Policy", () => {
  it("has a CSP meta tag", () => {
    expect(getCspContent()).not.toBe("");
  });

  it("does not allow 'unsafe-eval'", () => {
    expect(getCspContent()).not.toContain("unsafe-eval");
  });

  it("restricts default-src to 'self' with no wildcard", () => {
    const csp = getCspContent();
    const defaultSrc = csp
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("default-src"));

    expect(defaultSrc, "default-src directive must exist").toBeDefined();
    expect(defaultSrc).toContain("'self'");
    expect(defaultSrc).not.toContain("*");
  });

  it("restricts script-src to 'self'", () => {
    const csp = getCspContent();
    const scriptSrc = csp
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("script-src"));

    expect(scriptSrc).toBe("script-src 'self'");
  });

  it("limits connect-src to self plus known data hosts", () => {
    const csp = getCspContent();
    const connectSrc = csp
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("connect-src"));

    expect(connectSrc, "connect-src directive must exist").toBeDefined();

    const tokens = (connectSrc ?? "").split(/\s+/).slice(1);
    expect(tokens).toContain("'self'");
    // No wildcard and no bare scheme source (https: would allow any host)
    expect(tokens).not.toContain("*");
    expect(tokens).not.toContain("https:");
    // Every other token is a specific https host
    for (const token of tokens) {
      if (token === "'self'") continue;
      expect(token).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    }
  });
});
