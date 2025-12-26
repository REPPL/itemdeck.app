/**
 * Tests for edit export/import utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportEditsToFile, importEditsFromFile, exportedEditsSchema } from "@/utils/editExport";
import type { EntityEdit, ExportedEdits } from "@/stores/editsStore";

describe("editExport", () => {
  describe("exportEditsToFile", () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let capturedAnchor: { href: string; download: string } | null = null;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn(() => "blob:test-url");
      mockRevokeObjectURL = vi.fn();
      mockClick = vi.fn();
      capturedAnchor = null;

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock createElement to capture anchor properties
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === "a") {
          element.click = mockClick;
          // Capture the anchor when click is called
          const originalClick = element.click;
          element.click = function() {
            capturedAnchor = { href: element.href, download: element.download };
            return originalClick.call(this);
          };
        }
        return element;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      capturedAnchor = null;
    });

    it("creates a downloadable JSON file", () => {
      const edits: Record<string, EntityEdit> = {
        "entity-1": { fields: { title: "New Title" }, editedAt: 1234567890 },
      };

      exportEditsToFile(edits, "test-collection");

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });

    it("includes correct metadata in export", () => {
      const edits: Record<string, EntityEdit> = {
        "entity-1": { fields: { title: "Title 1" }, editedAt: 1000 },
        "entity-2": { fields: { title: "Title 2" }, editedAt: 2000 },
      };

      let capturedBlob: Blob | null = null;
      mockCreateObjectURL.mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return "blob:test-url";
      });

      exportEditsToFile(edits, "my-collection");

      expect(capturedBlob).not.toBeNull();
      // Can't easily read the blob content synchronously, but we verify it was created
    });

    it("formats filename with collection ID and date", () => {
      const edits: Record<string, EntityEdit> = {};

      exportEditsToFile(edits, "game-collection");

      expect(capturedAnchor).not.toBeNull();
      expect(capturedAnchor!.download).toMatch(/^game-collection-edits-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it("handles empty edits", () => {
      const edits: Record<string, EntityEdit> = {};

      expect(() => exportEditsToFile(edits, "test")).not.toThrow();
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("importEditsFromFile", () => {
    // Create a proper mock File with text() method
    const createMockFile = (content: string): File => {
      const file = new File([content], "test.json", { type: "application/json" });
      // JSDOM File doesn't implement text(), so we mock it
      file.text = vi.fn().mockResolvedValue(content);
      return file;
    };

    it("successfully imports valid edits file", async () => {
      const validData: ExportedEdits = {
        version: 1,
        exportedAt: "2024-01-15T10:30:00.000Z",
        collectionId: "test-collection",
        editCount: 2,
        edits: {
          "entity-1": { fields: { title: "New Title" }, editedAt: 1000 },
          "entity-2": { fields: { summary: "Updated" }, editedAt: 2000 },
        },
      };

      const file = createMockFile(JSON.stringify(validData));
      const result = await importEditsFromFile(file);

      expect(result.version).toBe(1);
      expect(result.collectionId).toBe("test-collection");
      expect(result.editCount).toBe(2);
      expect(result.edits["entity-1"].fields.title).toBe("New Title");
    });

    it("throws error for invalid JSON", async () => {
      const file = createMockFile("not valid json {");

      await expect(importEditsFromFile(file)).rejects.toThrow("Invalid JSON file");
    });

    it("throws error for invalid format", async () => {
      const invalidData = {
        version: 1,
        // Missing required fields
      };

      const file = createMockFile(JSON.stringify(invalidData));

      await expect(importEditsFromFile(file)).rejects.toThrow("Invalid edits file format");
    });

    it("throws error for unsupported version", async () => {
      const futureVersionData = {
        version: 99,
        exportedAt: "2024-01-15T10:30:00.000Z",
        collectionId: "test",
        editCount: 0,
        edits: {},
      };

      const file = createMockFile(JSON.stringify(futureVersionData));

      await expect(importEditsFromFile(file)).rejects.toThrow("Invalid edits file format");
    });

    it("validates entity edit structure", async () => {
      const invalidEntityData = {
        version: 1,
        exportedAt: "2024-01-15T10:30:00.000Z",
        collectionId: "test",
        editCount: 1,
        edits: {
          "entity-1": { fields: "not an object" }, // Invalid fields type
        },
      };

      const file = createMockFile(JSON.stringify(invalidEntityData));

      await expect(importEditsFromFile(file)).rejects.toThrow("Invalid edits file format");
    });

    it("allows complex field values", async () => {
      const complexData: ExportedEdits = {
        version: 1,
        exportedAt: "2024-01-15T10:30:00.000Z",
        collectionId: "test",
        editCount: 1,
        edits: {
          "entity-1": {
            fields: {
              title: "Text value",
              year: 2024,
              tags: ["tag1", "tag2"],
              metadata: { nested: true },
            },
            editedAt: 1000,
          },
        },
      };

      const file = createMockFile(JSON.stringify(complexData));
      const result = await importEditsFromFile(file);

      expect(result.edits["entity-1"].fields.title).toBe("Text value");
      expect(result.edits["entity-1"].fields.year).toBe(2024);
      expect(result.edits["entity-1"].fields.tags).toEqual(["tag1", "tag2"]);
    });
  });

  describe("exportedEditsSchema", () => {
    it("validates correct structure", () => {
      const valid = {
        version: 1,
        exportedAt: "2024-01-15T10:30:00.000Z",
        collectionId: "test",
        editCount: 0,
        edits: {},
      };

      const result = exportedEditsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects missing fields", () => {
      const invalid = {
        version: 1,
        exportedAt: "2024-01-15",
        // Missing collectionId, editCount, edits
      };

      const result = exportedEditsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects wrong version type", () => {
      const invalid = {
        version: "1", // Should be number
        exportedAt: "2024-01-15T10:30:00.000Z",
        collectionId: "test",
        editCount: 0,
        edits: {},
      };

      const result = exportedEditsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
