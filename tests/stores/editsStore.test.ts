/**
 * Entity edits store tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useEditsStore } from "@/stores/editsStore";

describe("useEditsStore", () => {
  beforeEach(() => {
    // Clear store state before each test
    useEditsStore.setState({ edits: {} });
  });

  describe("setField", () => {
    it("should set a single field", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "New Title");

      const edit = useEditsStore.getState().edits["entity-1"];
      expect(edit).toBeDefined();
      expect(edit?.fields.title).toBe("New Title");
      expect(edit?.editedAt).toBeGreaterThan(0);
    });

    it("should preserve existing fields when adding new field", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "New Title");
      store.setField("entity-1", "year", 2024);

      const edit = useEditsStore.getState().edits["entity-1"];
      expect(edit?.fields.title).toBe("New Title");
      expect(edit?.fields.year).toBe(2024);
    });

    it("should update existing field", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "First Title");
      store.setField("entity-1", "title", "Updated Title");

      const edit = useEditsStore.getState().edits["entity-1"];
      expect(edit?.fields.title).toBe("Updated Title");
    });

    it("should update editedAt timestamp", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "First");
      const firstTimestamp = useEditsStore.getState().edits["entity-1"]?.editedAt;

      // Wait a tiny bit to ensure different timestamp
      store.setField("entity-1", "year", 2024);
      const secondTimestamp = useEditsStore.getState().edits["entity-1"]?.editedAt;

      expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp!);
    });
  });

  describe("setFields", () => {
    it("should set multiple fields at once", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", {
        title: "New Title",
        year: 2024,
        summary: "A summary",
      });

      const edit = useEditsStore.getState().edits["entity-1"];
      expect(edit?.fields.title).toBe("New Title");
      expect(edit?.fields.year).toBe(2024);
      expect(edit?.fields.summary).toBe("A summary");
    });

    it("should merge with existing fields", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", { title: "Title" });
      store.setFields("entity-1", { year: 2024 });

      const edit = useEditsStore.getState().edits["entity-1"];
      expect(edit?.fields.title).toBe("Title");
      expect(edit?.fields.year).toBe(2024);
    });
  });

  describe("revertField", () => {
    it("should remove a single field", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", { title: "Title", year: 2024 });
      store.revertField("entity-1", "title");

      const edit = useEditsStore.getState().edits["entity-1"];
      expect(edit?.fields.title).toBeUndefined();
      expect(edit?.fields.year).toBe(2024);
    });

    it("should remove entity entry if no fields remain", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "Title");
      store.revertField("entity-1", "title");

      expect(useEditsStore.getState().edits["entity-1"]).toBeUndefined();
    });

    it("should do nothing for non-existent entity", () => {
      const store = useEditsStore.getState();
      store.revertField("non-existent", "title");

      expect(useEditsStore.getState().edits["non-existent"]).toBeUndefined();
    });
  });

  describe("revertEntity", () => {
    it("should remove all edits for an entity", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", { title: "Title", year: 2024 });
      store.setFields("entity-2", { title: "Other" });
      store.revertEntity("entity-1");

      expect(useEditsStore.getState().edits["entity-1"]).toBeUndefined();
      expect(useEditsStore.getState().edits["entity-2"]).toBeDefined();
    });

    it("should do nothing for non-existent entity", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "Title");
      store.revertEntity("non-existent");

      expect(useEditsStore.getState().edits["entity-1"]).toBeDefined();
    });
  });

  describe("revertAll", () => {
    it("should remove all edits", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", { title: "Title 1" });
      store.setFields("entity-2", { title: "Title 2" });
      store.setFields("entity-3", { title: "Title 3" });
      store.revertAll();

      expect(useEditsStore.getState().edits).toEqual({});
    });
  });

  describe("getEdit", () => {
    it("should return edits for entity", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", { title: "Title" });

      expect(store.getEdit("entity-1")?.fields.title).toBe("Title");
    });

    it("should return undefined for non-existent entity", () => {
      const store = useEditsStore.getState();
      expect(store.getEdit("non-existent")).toBeUndefined();
    });
  });

  describe("hasEdits", () => {
    it("should return true for entity with edits", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "Title");

      expect(store.hasEdits("entity-1")).toBe(true);
    });

    it("should return false for entity without edits", () => {
      const store = useEditsStore.getState();
      expect(store.hasEdits("non-existent")).toBe(false);
    });
  });

  describe("getEditedEntityIds", () => {
    it("should return all entity IDs with edits", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "Title 1");
      store.setField("entity-2", "title", "Title 2");
      store.setField("entity-3", "title", "Title 3");

      const ids = store.getEditedEntityIds();
      expect(ids).toContain("entity-1");
      expect(ids).toContain("entity-2");
      expect(ids).toContain("entity-3");
      expect(ids).toHaveLength(3);
    });

    it("should return empty array when no edits", () => {
      const store = useEditsStore.getState();
      expect(store.getEditedEntityIds()).toEqual([]);
    });
  });

  describe("getTotalEditCount", () => {
    it("should return count of edited entities", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "Title 1");
      store.setField("entity-2", "title", "Title 2");

      expect(store.getTotalEditCount()).toBe(2);
    });

    it("should return 0 when no edits", () => {
      const store = useEditsStore.getState();
      expect(store.getTotalEditCount()).toBe(0);
    });
  });

  describe("exportEdits", () => {
    it("should export edits in correct format", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", { title: "Title", year: 2024 });
      store.setFields("entity-2", { summary: "A summary" });

      const exported = store.exportEdits("test-collection");

      expect(exported.version).toBe(1);
      expect(exported.collectionId).toBe("test-collection");
      expect(exported.editCount).toBe(2);
      expect(exported.exportedAt).toBeDefined();
      expect(exported.edits["entity-1"]?.fields.title).toBe("Title");
      expect(exported.edits["entity-2"]?.fields.summary).toBe("A summary");
    });

    it("should include valid ISO timestamp", () => {
      const store = useEditsStore.getState();
      store.setField("entity-1", "title", "Title");

      const exported = store.exportEdits("test-collection");
      const date = new Date(exported.exportedAt);

      expect(date.toISOString()).toBe(exported.exportedAt);
    });
  });

  describe("importEdits", () => {
    const createExportedEdits = (edits: Record<string, { fields: Record<string, unknown>; editedAt: number }>) => ({
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      collectionId: "test-collection",
      editCount: Object.keys(edits).length,
      edits,
    });

    describe("replace mode", () => {
      it("should replace all existing edits", () => {
        const store = useEditsStore.getState();
        store.setField("entity-1", "title", "Existing");

        const imported = createExportedEdits({
          "entity-2": { fields: { title: "Imported" }, editedAt: 1000 },
        });

        store.importEdits(imported, "replace");

        expect(useEditsStore.getState().edits["entity-1"]).toBeUndefined();
        expect(useEditsStore.getState().edits["entity-2"]?.fields.title).toBe("Imported");
      });
    });

    describe("merge mode", () => {
      it("should add new edits while preserving existing", () => {
        const store = useEditsStore.getState();
        store.setField("entity-1", "title", "Existing");

        const imported = createExportedEdits({
          "entity-2": { fields: { title: "Imported" }, editedAt: 1000 },
        });

        store.importEdits(imported, "merge");

        expect(useEditsStore.getState().edits["entity-1"]?.fields.title).toBe("Existing");
        expect(useEditsStore.getState().edits["entity-2"]?.fields.title).toBe("Imported");
      });

      it("should keep existing values for conflicting fields", () => {
        const store = useEditsStore.getState();
        store.setFields("entity-1", { title: "Existing", year: 2024 });

        const imported = createExportedEdits({
          "entity-1": { fields: { title: "Imported", summary: "New" }, editedAt: 1000 },
        });

        store.importEdits(imported, "merge");

        const edit = useEditsStore.getState().edits["entity-1"];
        expect(edit?.fields.title).toBe("Existing"); // Existing takes priority
        expect(edit?.fields.year).toBe(2024); // Preserved from existing
        expect(edit?.fields.summary).toBe("New"); // Added from import
      });

      it("should use latest timestamp for merged entities", () => {
        const store = useEditsStore.getState();
        store.setField("entity-1", "title", "Existing");

        const existingTimestamp = useEditsStore.getState().edits["entity-1"]?.editedAt ?? 0;
        const laterTimestamp = existingTimestamp + 1000;

        const imported = createExportedEdits({
          "entity-1": { fields: { summary: "New" }, editedAt: laterTimestamp },
        });

        store.importEdits(imported, "merge");

        expect(useEditsStore.getState().edits["entity-1"]?.editedAt).toBe(laterTimestamp);
      });
    });
  });

  describe("round-trip export/import", () => {
    it("should preserve all data through export/import cycle", () => {
      const store = useEditsStore.getState();
      store.setFields("entity-1", { title: "Title 1", year: 2024 });
      store.setFields("entity-2", { summary: "Summary", myRank: 5 });

      const exported = store.exportEdits("test-collection");

      // Clear and re-import
      store.revertAll();
      expect(store.getTotalEditCount()).toBe(0);

      store.importEdits(exported, "replace");

      expect(store.getTotalEditCount()).toBe(2);
      expect(store.getEdit("entity-1")?.fields.title).toBe("Title 1");
      expect(store.getEdit("entity-1")?.fields.year).toBe(2024);
      expect(store.getEdit("entity-2")?.fields.summary).toBe("Summary");
      expect(store.getEdit("entity-2")?.fields.myRank).toBe(5);
    });
  });
});
