/**
 * Tests for deepMerge, including prototype-pollution hardening.
 */

import { describe, it, expect } from "vitest";
import { deepMerge } from "@/utils/deepMerge";

describe("deepMerge", () => {
  it("merges nested plain objects with source precedence", () => {
    const target = { a: { b: 1, c: 2 }, d: 3 };
    const result = deepMerge(target, { a: { c: 5 } } as Partial<typeof target>);
    expect(result).toEqual({ a: { b: 1, c: 5 }, d: 3 });
  });

  it("replaces arrays and scalars instead of merging them", () => {
    const target = { list: [1, 2], flag: true };
    const result = deepMerge(target, { list: [3], flag: false });
    expect(result).toEqual({ list: [3], flag: false });
  });

  describe("prototype pollution", () => {
    it("ignores a __proto__ key coming from parsed JSON", () => {
      const source = JSON.parse(
        '{"__proto__": {"polluted": true}}'
      ) as Record<string, unknown>;

      const result = deepMerge<Record<string, unknown>>({}, source);

      // The merged object must not inherit attacker-controlled values
      expect((result as { polluted?: unknown }).polluted).toBeUndefined();
      // Its prototype must remain Object.prototype
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      // The global Object prototype must not be polluted
      expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
    });

    it("ignores constructor and prototype keys coming from parsed JSON", () => {
      const source = JSON.parse(
        '{"constructor": {"bad": true}, "prototype": {"bad": true}, "safe": 1}'
      ) as Record<string, unknown>;

      const result = deepMerge<Record<string, unknown>>({}, source);

      expect(Object.prototype.hasOwnProperty.call(result, "constructor")).toBe(
        false
      );
      expect(Object.prototype.hasOwnProperty.call(result, "prototype")).toBe(
        false
      );
      // Legitimate keys still merge
      expect(result.safe).toBe(1);
    });

    it("ignores dangerous keys in nested objects", () => {
      const source = JSON.parse(
        '{"nested": {"__proto__": {"polluted": true}, "keep": 2}}'
      ) as Record<string, unknown>;

      const result = deepMerge<Record<string, unknown>>(
        { nested: { keep: 1 } },
        source
      );

      const nested = result.nested as Record<string, unknown>;
      expect(nested.keep).toBe(2);
      expect((nested as { polluted?: unknown }).polluted).toBeUndefined();
      expect(Object.getPrototypeOf(nested)).toBe(Object.prototype);
      expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
    });
  });
});
