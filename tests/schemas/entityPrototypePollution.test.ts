/**
 * Tests that entity validation strips prototype-polluting keys.
 *
 * `JSON.parse` turns a `"__proto__"` key into a genuine own property. The
 * entity schema's `.loose()` pass-through would otherwise assign it, re-pointing
 * the validated object's prototype to attacker-controlled data and smuggling
 * values (e.g. an unvalidated `images` array) past the schema through the
 * prototype chain.
 */

import { describe, it, expect } from "vitest";
import {
  safeValidateEntity,
  safeValidateCollectionDefinition,
} from "@/schemas/v2/collection.schema";

describe("entity validation prototype-pollution hardening", () => {
  it("validates an ordinary entity unchanged", () => {
    const result = safeValidateEntity({
      id: "e1",
      images: [{ url: "https://example.com/a.png" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("e1");
      expect(result.data.images).toHaveLength(1);
    }
  });

  it("does not let a __proto__ payload smuggle unvalidated fields", () => {
    // Must use JSON.parse: an object literal's __proto__ sets the prototype
    // rather than creating an own key, so it would not reproduce the vector.
    const raw = JSON.parse(
      '{"id":"e1","__proto__":{"images":[{"url":"not a url at all"}]}}'
    );

    const result = safeValidateEntity(raw);

    expect(result.success).toBe(true);
    if (result.success) {
      // The smuggled images array must not be readable, and the validated
      // object's prototype must remain the ordinary Object.prototype.
      expect(result.data.images).toBeUndefined();
      expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
    }
    // Global prototype is untouched.
    expect(({} as Record<string, unknown>).images).toBeUndefined();
  });

  it("still rejects an invalid image url supplied as an own property", () => {
    const raw = JSON.parse('{"id":"e2","images":[{"url":"not a url at all"}]}');
    const result = safeValidateEntity(raw);
    expect(result.success).toBe(false);
  });

  it("strips __proto__ from collection definitions too", () => {
    const raw = JSON.parse(
      '{"$schema":"v2","name":"c","__proto__":{"polluted":true},"entityTypes":{}}'
    );
    const result = safeValidateCollectionDefinition(raw);
    // Whatever the definition schema decides, validation must not carry the
    // polluted prototype through.
    if (result.success) {
      expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
