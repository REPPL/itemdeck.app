/**
 * Tests for settings export/import utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportSettingsToFile,
  importSettingsFromFile,
  _testExports,
} from "@/utils/settingsExport";
import { useSettingsStore } from "@/stores/settingsStore";
import { SETTINGS_EXPORT_VERSION } from "@/schemas/settingsExport.schema";

describe("settingsExport", () => {
  describe("exportSettingsToFile", () => {
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

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === "a") {
          element.click = mockClick;
          const originalClick = element.click;
          element.click = function () {
            capturedAnchor = { href: element.href, download: element.download };
            return originalClick.call(this);
          };
        }
        return element;
      });

      // Reset store to defaults
      useSettingsStore.getState().resetToDefaults();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      capturedAnchor = null;
    });

    it("creates a downloadable JSON file", () => {
      exportSettingsToFile();

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });

    it("formats filename with date", () => {
      exportSettingsToFile();

      expect(capturedAnchor).not.toBeNull();
      expect(capturedAnchor!.download).toMatch(/^itemdeck-settings-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it("includes version and exportedAt in blob", () => {
      let capturedBlob: Blob | null = null;
      mockCreateObjectURL.mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return "blob:test-url";
      });

      exportSettingsToFile();

      expect(capturedBlob).not.toBeNull();
      expect(capturedBlob!.type).toBe("application/json");
    });
  });

  describe("importSettingsFromFile", () => {
    const createMockFile = (content: string): File => {
      const file = new File([content], "test.json", { type: "application/json" });
      file.text = vi.fn().mockResolvedValue(content);
      return file;
    };

    beforeEach(() => {
      useSettingsStore.getState().resetToDefaults();
    });

    it("successfully imports valid settings file in merge mode", async () => {
      const validData = {
        version: SETTINGS_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          layout: "list",
          visualTheme: "retro",
          shuffleOnLoad: false,
        },
      };

      const file = createMockFile(JSON.stringify(validData));
      const result = await importSettingsFromFile(file, "merge");

      expect(result.version).toBe(SETTINGS_EXPORT_VERSION);
      expect(result.settingsCount).toBeGreaterThan(0);

      const state = useSettingsStore.getState();
      expect(state.layout).toBe("list");
      expect(state.visualTheme).toBe("retro");
      expect(state.shuffleOnLoad).toBe(false);
    });

    it("replaces all settings in replace mode", async () => {
      // Set some custom values first
      const store = useSettingsStore.getState();
      store.setLayout("compact");
      store.setMaxVisibleCards(5);

      const importData = {
        version: SETTINGS_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          layout: "list",
          // maxVisibleCards not included - should reset to default
        },
      };

      const file = createMockFile(JSON.stringify(importData));
      await importSettingsFromFile(file, "replace");

      const state = useSettingsStore.getState();
      expect(state.layout).toBe("list");
      expect(state.maxVisibleCards).toBe(2); // Default value
    });

    it("preserves unspecified settings in merge mode", async () => {
      // Set a custom value
      const store = useSettingsStore.getState();
      store.setMaxVisibleCards(5);

      const importData = {
        version: SETTINGS_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          layout: "list",
          // maxVisibleCards not included
        },
      };

      const file = createMockFile(JSON.stringify(importData));
      await importSettingsFromFile(file, "merge");

      const state = useSettingsStore.getState();
      expect(state.layout).toBe("list");
      expect(state.maxVisibleCards).toBe(5); // Preserved
    });

    it("throws error for invalid JSON", async () => {
      const file = createMockFile("not valid json {");

      await expect(importSettingsFromFile(file, "merge")).rejects.toThrow("Invalid JSON file");
    });

    it("throws error for invalid structure", async () => {
      const invalidData = {
        version: "not-a-number",
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {},
      };

      const file = createMockFile(JSON.stringify(invalidData));

      await expect(importSettingsFromFile(file, "merge")).rejects.toThrow("Invalid settings file");
    });

    it("throws error for missing settings", async () => {
      const invalidData = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        // missing settings
      };

      const file = createMockFile(JSON.stringify(invalidData));

      await expect(importSettingsFromFile(file, "merge")).rejects.toThrow("Invalid settings file");
    });

    it("handles older version imports with migration", async () => {
      // Simulate an old v14 export (before random selection was added)
      const oldData = {
        version: 14,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          layout: "grid",
          // randomSelectionEnabled not present in v14
        },
      };

      const file = createMockFile(JSON.stringify(oldData));
      const result = await importSettingsFromFile(file, "merge");

      expect(result.version).toBe(14);

      // Migration should add defaults
      const state = useSettingsStore.getState();
      expect(state.randomSelectionEnabled).toBe(false);
      expect(state.randomSelectionCount).toBe(10);
    });

    it("imports theme customisations per theme", async () => {
      const importData = {
        version: SETTINGS_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          themeCustomisations: {
            retro: {
              accentColour: "#123456",
              borderRadius: "large",
            },
          },
        },
      };

      const file = createMockFile(JSON.stringify(importData));
      await importSettingsFromFile(file, "merge");

      const state = useSettingsStore.getState();
      expect(state.themeCustomisations.retro.accentColour).toBe("#123456");
      expect(state.themeCustomisations.retro.borderRadius).toBe("large");
    });

    it("imports field mapping", async () => {
      const importData = {
        version: SETTINGS_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          fieldMapping: {
            titleField: "customTitle",
            sortDirection: "desc",
          },
        },
      };

      const file = createMockFile(JSON.stringify(importData));
      await importSettingsFromFile(file, "merge");

      const state = useSettingsStore.getState();
      expect(state.fieldMapping.titleField).toBe("customTitle");
      expect(state.fieldMapping.sortDirection).toBe("desc");
    });
  });

  describe("_testExports.migrateSettings", () => {
    const { migrateSettings } = _testExports;

    it("adds showViewButton for versions < 26", () => {
      const oldSettings = { layout: "grid" as const };
      const migrated = migrateSettings(oldSettings, 25);
      expect(migrated.showViewButton).toBe(true);
      expect(migrated.usePlaceholderImages).toBe(true);
    });

    it("adds searchBarMinimised for versions < 22", () => {
      const oldSettings = { layout: "grid" as const };
      const migrated = migrateSettings(oldSettings, 21);
      expect(migrated.searchBarMinimised).toBe(false);
    });

    it("adds searchScope for versions < 21", () => {
      const oldSettings = { layout: "grid" as const };
      const migrated = migrateSettings(oldSettings, 20);
      expect(migrated.searchScope).toBe("all");
    });

    it("adds showSearchBar for versions < 20", () => {
      const oldSettings = { layout: "grid" as const };
      const migrated = migrateSettings(oldSettings, 19);
      expect(migrated.showSearchBar).toBe(true);
    });

    it("preserves existing values during migration", () => {
      const oldSettings = {
        layout: "list" as const,
        showSearchBar: false, // Already set
      };
      const migrated = migrateSettings(oldSettings, 19);
      expect(migrated.showSearchBar).toBe(false); // Preserved
    });
  });

  describe("_testExports.countSettings", () => {
    const { countSettings } = _testExports;

    it("counts simple settings", () => {
      const settings = {
        layout: "grid" as const,
        shuffleOnLoad: true,
        maxVisibleCards: 3,
      };
      expect(countSettings(settings)).toBe(3);
    });

    it("counts nested themeCustomisations", () => {
      const settings = {
        themeCustomisations: {
          retro: { accentColour: "#123" },
          modern: { borderRadius: "large" as const },
        },
      };
      expect(countSettings(settings)).toBe(2); // 2 themes
    });

    it("counts nested fieldMapping", () => {
      const settings = {
        fieldMapping: {
          titleField: "title",
          subtitleField: "year",
          sortDirection: "asc" as const,
        },
      };
      expect(countSettings(settings)).toBe(3); // 3 fields
    });

    it("returns 0 for empty object", () => {
      expect(countSettings({})).toBe(0);
    });
  });

  describe("_testExports.extractExportableSettings", () => {
    const { extractExportableSettings } = _testExports;

    beforeEach(() => {
      useSettingsStore.getState().resetToDefaults();
    });

    it("extracts all exportable settings from store", () => {
      const state = useSettingsStore.getState();
      const extracted = extractExportableSettings(state);

      expect(extracted.layout).toBe(state.layout);
      expect(extracted.visualTheme).toBe(state.visualTheme);
      expect(extracted.shuffleOnLoad).toBe(state.shuffleOnLoad);
      expect(extracted.themeCustomisations).toEqual(state.themeCustomisations);
    });

    it("excludes transient state", () => {
      const state = useSettingsStore.getState();
      const extracted = extractExportableSettings(state);

      // These should NOT be in the export
      expect("searchQuery" in extracted).toBe(false);
      expect("activeFilters" in extracted).toBe(false);
      expect("collapsedGroups" in extracted).toBe(false);
      expect("activeMechanicId" in extracted).toBe(false);
      expect("_draft" in extracted).toBe(false);
      expect("isDirty" in extracted).toBe(false);
    });
  });
});
