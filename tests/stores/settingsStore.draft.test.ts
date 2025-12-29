/**
 * Tests for settings store draft state functionality (F-090).
 *
 * @see F-090: Settings Draft State Pattern
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";

describe("settingsStore - Draft State (F-090)", () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useSettingsStore.getState().resetToDefaults();
  });

  describe("startEditing", () => {
    it("creates a draft from current committed state", () => {
      // Set a custom value first
      useSettingsStore.getState().setVisualTheme("minimal");

      // Start editing
      useSettingsStore.getState().startEditing();

      const state = useSettingsStore.getState();
      expect(state._draft).not.toBeNull();
      expect(state._draft?.visualTheme).toBe("minimal");
      expect(state.isDirty).toBe(false);
    });

    it("includes all draftable settings in the draft", () => {
      useSettingsStore.getState().startEditing();

      const draft = useSettingsStore.getState()._draft;
      expect(draft).toHaveProperty("layout");
      expect(draft).toHaveProperty("cardSizePreset");
      expect(draft).toHaveProperty("visualTheme");
      expect(draft).toHaveProperty("shuffleOnLoad");
      expect(draft).toHaveProperty("fieldMapping");
    });
  });

  describe("updateDraft", () => {
    it("updates draft values without affecting committed state", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });

      const state = useSettingsStore.getState();
      expect(state._draft?.visualTheme).toBe("retro");
      expect(state.visualTheme).toBe("modern"); // committed state unchanged
    });

    it("marks draft as dirty when values differ from committed", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ cardSizePreset: "large" });

      expect(useSettingsStore.getState().isDirty).toBe(true);
    });

    it("marks draft as not dirty when values match committed", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });
      expect(useSettingsStore.getState().isDirty).toBe(true);

      // Change back to original value
      useSettingsStore.getState().updateDraft({ visualTheme: "modern" });
      expect(useSettingsStore.getState().isDirty).toBe(false);
    });

    it("does nothing if not in editing mode", () => {
      // Not in editing mode (no draft)
      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });

      expect(useSettingsStore.getState()._draft).toBeNull();
      expect(useSettingsStore.getState().visualTheme).toBe("modern");
    });

    it("handles nested objects like fieldMapping", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({
        fieldMapping: { titleField: "customTitle" },
      });

      const draft = useSettingsStore.getState()._draft;
      expect(draft?.fieldMapping?.titleField).toBe("customTitle");
    });
  });

  describe("commitDraft", () => {
    it("applies draft values to committed state", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });
      useSettingsStore.getState().commitDraft();

      expect(useSettingsStore.getState().visualTheme).toBe("retro");
      expect(useSettingsStore.getState()._draft).toBeNull();
      expect(useSettingsStore.getState().isDirty).toBe(false);
    });

    it("clears draft after commit", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ cardSizePreset: "small" });
      useSettingsStore.getState().commitDraft();

      expect(useSettingsStore.getState()._draft).toBeNull();
    });

    it("does nothing if no draft exists", () => {
      const originalTheme = useSettingsStore.getState().visualTheme;
      useSettingsStore.getState().commitDraft();

      expect(useSettingsStore.getState().visualTheme).toBe(originalTheme);
    });
  });

  describe("discardDraft", () => {
    it("clears draft without applying changes", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });
      useSettingsStore.getState().discardDraft();

      expect(useSettingsStore.getState()._draft).toBeNull();
      expect(useSettingsStore.getState().isDirty).toBe(false);
      expect(useSettingsStore.getState().visualTheme).toBe("modern");
    });

    it("resets isDirty to false", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ layout: "list" });
      expect(useSettingsStore.getState().isDirty).toBe(true);

      useSettingsStore.getState().discardDraft();
      expect(useSettingsStore.getState().isDirty).toBe(false);
    });
  });

  describe("getEffective", () => {
    it("returns draft value when editing", () => {
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ visualTheme: "minimal" });

      const effective = useSettingsStore.getState().getEffective("visualTheme");
      expect(effective).toBe("minimal");
    });

    it("returns committed value when not editing", () => {
      useSettingsStore.getState().setVisualTheme("retro");

      const effective = useSettingsStore.getState().getEffective("visualTheme");
      expect(effective).toBe("retro");
    });

    it("returns committed value for unchanged draft keys", () => {
      useSettingsStore.getState().setVisualTheme("minimal");
      useSettingsStore.getState().startEditing();

      const effective = useSettingsStore.getState().getEffective("visualTheme");
      expect(effective).toBe("minimal");
    });
  });

  describe("draft state persistence", () => {
    it("draft state is not persisted (transient)", () => {
      // This tests that the draft fields are excluded from localStorage.
      // We can't truly test localStorage without mocking, but we can verify
      // the initial state after reset.
      useSettingsStore.getState().startEditing();
      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });

      // Reset simulates what happens on page reload
      useSettingsStore.getState().resetToDefaults();

      expect(useSettingsStore.getState()._draft).toBeNull();
      expect(useSettingsStore.getState().isDirty).toBe(false);
    });
  });

  describe("multiple draft updates", () => {
    it("accumulates changes correctly", () => {
      useSettingsStore.getState().startEditing();

      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });
      useSettingsStore.getState().updateDraft({ cardSizePreset: "large" });
      useSettingsStore.getState().updateDraft({ layout: "list" });

      const draft = useSettingsStore.getState()._draft;
      expect(draft?.visualTheme).toBe("retro");
      expect(draft?.cardSizePreset).toBe("large");
      expect(draft?.layout).toBe("list");
    });

    it("allows overwriting previous draft values", () => {
      useSettingsStore.getState().startEditing();

      useSettingsStore.getState().updateDraft({ visualTheme: "retro" });
      useSettingsStore.getState().updateDraft({ visualTheme: "minimal" });

      expect(useSettingsStore.getState()._draft?.visualTheme).toBe("minimal");
    });
  });
});
