/**
 * Tests for schema registry.
 */

import { describe, it, expect } from "vitest";
import {
  schemaRegistry,
  isValidSchema,
  getSupportedSchemas,
  getSchema,
  type SchemaId,
} from "@/schemas/registry";

describe("schemaRegistry", () => {
  it("contains ranked-collection schema", () => {
    expect(schemaRegistry["ranked-collection"]).toBeDefined();
    expect(schemaRegistry["ranked-collection"].version).toBe("1.0.0");
    expect(schemaRegistry["ranked-collection"].categories).not.toBeNull();
  });

  it("contains simple-list schema", () => {
    expect(schemaRegistry["simple-list"]).toBeDefined();
    expect(schemaRegistry["simple-list"].version).toBe("1.0.0");
    expect(schemaRegistry["simple-list"].categories).toBeNull();
  });

  it("contains timeline schema", () => {
    expect(schemaRegistry["timeline"]).toBeDefined();
    expect(schemaRegistry["timeline"].version).toBe("1.0.0");
    expect(schemaRegistry["timeline"].categories).toBeNull();
  });

  describe("display mappings", () => {
    it("ranked-collection has complete display mapping", () => {
      const display = schemaRegistry["ranked-collection"].display;
      expect(display.title).toBe("title");
      expect(display.subtitle).toBe("metadata.category");
      expect(display.description).toBe("summary");
      expect(display.image).toBe("imageUrl");
      expect(display.link).toBe("detailUrl");
      expect(display.badge).toBe("metadata.rank");
      expect(display.year).toBe("year");
    });

    it("simple-list has minimal display mapping", () => {
      const display = schemaRegistry["simple-list"].display;
      expect(display.title).toBe("title");
      expect(display.description).toBe("summary");
      expect(display.image).toBe("imageUrl");
      expect(display.link).toBe("detailUrl");
    });

    it("timeline has date-focused display mapping", () => {
      const display = schemaRegistry["timeline"].display;
      expect(display.title).toBe("title");
      expect(display.subtitle).toBe("year");
      expect(display.badge).toBe("metadata.location");
    });
  });
});

describe("isValidSchema", () => {
  it("returns true for valid schemas", () => {
    expect(isValidSchema("ranked-collection")).toBe(true);
    expect(isValidSchema("simple-list")).toBe(true);
    expect(isValidSchema("timeline")).toBe(true);
  });

  it("returns false for invalid schemas", () => {
    expect(isValidSchema("unknown-schema")).toBe(false);
    expect(isValidSchema("")).toBe(false);
    expect(isValidSchema("RANKED-COLLECTION")).toBe(false); // Case sensitive
  });

  it("narrows type correctly", () => {
    const schemaId = "ranked-collection";
    if (isValidSchema(schemaId)) {
      // TypeScript should allow this assignment
      const _id: SchemaId = schemaId;
      expect(_id).toBe("ranked-collection");
    }
  });
});

describe("getSupportedSchemas", () => {
  it("returns all schema identifiers", () => {
    const schemas = getSupportedSchemas();
    expect(schemas).toContain("ranked-collection");
    expect(schemas).toContain("simple-list");
    expect(schemas).toContain("timeline");
  });

  it("returns correct number of schemas", () => {
    const schemas = getSupportedSchemas();
    expect(schemas).toHaveLength(3);
  });

  it("returns array of SchemaId type", () => {
    const schemas = getSupportedSchemas();
    schemas.forEach((id) => {
      expect(isValidSchema(id)).toBe(true);
    });
  });
});

describe("getSchema", () => {
  it("returns schema definition for valid id", () => {
    const schema = getSchema("ranked-collection");
    expect(schema).toBeDefined();
    expect(schema?.version).toBe("1.0.0");
    expect(schema?.description).toBe("Personal ranked lists with categories");
  });

  it("returns undefined for invalid id", () => {
    const schema = getSchema("nonexistent");
    expect(schema).toBeUndefined();
  });

  it("returns schema with items validator", () => {
    const schema = getSchema("simple-list");
    expect(schema?.items).toBeDefined();

    // Verify the items schema can validate
    const validItem = { id: "test", title: "Test" };
    const result = schema?.items.safeParse(validItem);
    expect(result?.success).toBe(true);
  });
});
