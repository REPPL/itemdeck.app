/**
 * Tests for SchemaNotSupportedError.
 */

import { describe, it, expect } from "vitest";
import { SchemaNotSupportedError } from "@/errors/SchemaNotSupportedError";

describe("SchemaNotSupportedError", () => {
  it("creates error with correct message", () => {
    const error = new SchemaNotSupportedError("unknown-schema", [
      "ranked-collection",
      "simple-list",
    ]);

    expect(error.message).toContain('Unsupported schema: "unknown-schema"');
    expect(error.message).toContain("ranked-collection, simple-list");
    expect(error.message).toContain("https://github.com/REPPL/itemdeck/issues");
  });

  it("stores requested schema", () => {
    const error = new SchemaNotSupportedError("custom-schema", []);
    expect(error.requestedSchema).toBe("custom-schema");
  });

  it("stores supported schemas", () => {
    const supported = ["ranked-collection", "simple-list", "timeline"];
    const error = new SchemaNotSupportedError("unknown", supported);
    expect(error.supportedSchemas).toEqual(supported);
  });

  it("has correct error name", () => {
    const error = new SchemaNotSupportedError("test", []);
    expect(error.name).toBe("SchemaNotSupportedError");
  });

  it("is instance of Error", () => {
    const error = new SchemaNotSupportedError("test", []);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SchemaNotSupportedError);
  });

  it("can be thrown and caught", () => {
    expect(() => {
      throw new SchemaNotSupportedError("bad-schema", ["good-schema"]);
    }).toThrow(SchemaNotSupportedError);
  });

  it("works with try-catch pattern", () => {
    try {
      throw new SchemaNotSupportedError("test-schema", ["a", "b"]);
    } catch (error) {
      if (error instanceof SchemaNotSupportedError) {
        expect(error.requestedSchema).toBe("test-schema");
        expect(error.supportedSchemas).toEqual(["a", "b"]);
      } else {
        throw new Error("Expected SchemaNotSupportedError");
      }
    }
  });
});
