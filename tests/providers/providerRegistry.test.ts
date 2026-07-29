/**
 * Tests for the provider registry lookup: inherited Object.prototype members
 * must never be treated as registered providers. A bare `in`/property lookup
 * would accept a crafted URL path such as "/constructor" and crash the render
 * (a shareable denial-of-service link).
 */

import { describe, it, expect } from "vitest";
import {
  getProvider,
  hasProvider,
  buildCollectionUrl,
  parseProviderUrl,
} from "@/providers";

const PROTOTYPE_NAMES = [
  "constructor",
  "__proto__",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "prototype",
];

describe("provider registry prototype-chain safety", () => {
  it("recognises the real provider", () => {
    expect(hasProvider("gh")).toBe(true);
    expect(getProvider("gh")).toBeDefined();
  });

  it.each(PROTOTYPE_NAMES)(
    "does not treat inherited name %s as a provider",
    (name) => {
      expect(hasProvider(name)).toBe(false);
      expect(getProvider(name)).toBeUndefined();
    }
  );

  it.each(PROTOTYPE_NAMES)(
    "buildCollectionUrl returns null (does not throw) for %s",
    (name) => {
      expect(() =>
        buildCollectionUrl(name, { u: "a", collection: "b" })
      ).not.toThrow();
      expect(buildCollectionUrl(name, { u: "a", collection: "b" })).toBeNull();
    }
  );

  it("parseProviderUrl rejects a crafted prototype path", () => {
    expect(
      parseProviderUrl("/constructor", new URLSearchParams("u=a&collection=b"))
    ).toBeNull();
  });
});
