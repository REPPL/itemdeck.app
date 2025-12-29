/**
 * Tests for theme export/import utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportThemeToFile,
  importThemeFromFile,
  hasThemeCustomisations,
  countThemeOverrides,
  _testExports,
} from "@/utils/themeExport";
import { useSettingsStore, DEFAULT_THEME_CUSTOMISATIONS } from "@/stores/settingsStore";
import { THEME_EXPORT_VERSION } from "@/schemas/themeExport.schema";

describe("themeExport", () => {
  describe("exportThemeToFile", () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let capturedAnchor: { href: string; download: string } | null = null;
    let capturedBlob: Blob | null = null;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn((blob: Blob) => {
        capturedBlob = blob;
        return "blob:test-url";
      });
      mockRevokeObjectURL = vi.fn();
      mockClick = vi.fn();
      capturedAnchor = null;
      capturedBlob = null;

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
      capturedBlob = null;
    });

    it("creates a downloadable JSON file", () => {
      exportThemeToFile("modern");

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });

    it("formats filename with theme name and date", () => {
      exportThemeToFile("retro");

      expect(capturedAnchor).not.toBeNull();
      expect(capturedAnchor!.download).toMatch(/^itemdeck-theme-retro-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it("uses custom name in filename when provided", () => {
      exportThemeToFile("modern", "My Awesome Theme");

      expect(capturedAnchor).not.toBeNull();
      expect(capturedAnchor!.download).toMatch(/^itemdeck-theme-my-awesome-theme-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it("exports only overrides when theme is customised", async () => {
      // Customise the modern theme
      const store = useSettingsStore.getState();
      store.setThemeCustomisation("modern", {
        accentColour: "#123456",
        borderRadius: "large",
      });

      exportThemeToFile("modern");

      expect(capturedBlob).not.toBeNull();
      // Read blob content using FileReader pattern
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { resolve(reader.result as string); };
        reader.onerror = () => { reject(reader.error); };
        reader.readAsText(capturedBlob!);
      });
      const parsed = JSON.parse(content) as { customisation: Record<string, unknown> };

      // Should include overrides
      expect(parsed.customisation.accentColour).toBe("#123456");
      expect(parsed.customisation.borderRadius).toBe("large");

      // Should NOT include non-overridden values
      expect(parsed.customisation.shadowIntensity).toBeUndefined();
    });

    it("exports empty customisation when using defaults", async () => {
      exportThemeToFile("modern");

      expect(capturedBlob).not.toBeNull();
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { resolve(reader.result as string); };
        reader.onerror = () => { reject(reader.error); };
        reader.readAsText(capturedBlob!);
      });
      const parsed = JSON.parse(content) as { customisation: unknown; baseTheme: string; version: number };

      expect(parsed.customisation).toEqual({});
      expect(parsed.baseTheme).toBe("modern");
      expect(parsed.version).toBe(THEME_EXPORT_VERSION);
    });

    it("includes name in export when provided", async () => {
      exportThemeToFile("retro", "Cyberpunk");

      expect(capturedBlob).not.toBeNull();
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { resolve(reader.result as string); };
        reader.onerror = () => { reject(reader.error); };
        reader.readAsText(capturedBlob!);
      });
      const parsed = JSON.parse(content) as { name: string };

      expect(parsed.name).toBe("Cyberpunk");
    });
  });

  describe("importThemeFromFile", () => {
    const createMockFile = (content: string): File => {
      const file = new File([content], "theme.json", { type: "application/json" });
      file.text = vi.fn().mockResolvedValue(content);
      return file;
    };

    beforeEach(() => {
      useSettingsStore.getState().resetToDefaults();
    });

    it("successfully imports valid theme file", async () => {
      const validData = {
        version: THEME_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "retro",
        customisation: {
          accentColour: "#ff0000",
          borderRadius: "large",
        },
      };

      const file = createMockFile(JSON.stringify(validData));
      const result = await importThemeFromFile(file, true);

      expect(result.baseTheme).toBe("retro");
      expect(result.overrideCount).toBe(2);

      const state = useSettingsStore.getState();
      expect(state.visualTheme).toBe("retro"); // Switched
      expect(state.themeCustomisations.retro.accentColour).toBe("#ff0000");
      expect(state.themeCustomisations.retro.borderRadius).toBe("large");
    });

    it("switches to base theme when switchToBaseTheme is true", async () => {
      // Start with modern theme
      const store = useSettingsStore.getState();
      store.setVisualTheme("modern");

      const importData = {
        version: THEME_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "retro",
        customisation: {},
      };

      const file = createMockFile(JSON.stringify(importData));
      await importThemeFromFile(file, true);

      const state = useSettingsStore.getState();
      expect(state.visualTheme).toBe("retro"); // Switched to base theme
    });

    it("does not switch theme when switchToBaseTheme is false", async () => {
      // Start with modern theme
      const store = useSettingsStore.getState();
      store.setVisualTheme("modern");

      const importData = {
        version: THEME_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "retro",
        customisation: { accentColour: "#ff0000" },
      };

      const file = createMockFile(JSON.stringify(importData));
      await importThemeFromFile(file, false);

      const state = useSettingsStore.getState();
      expect(state.visualTheme).toBe("modern"); // Not switched
      // But customisation is still applied to retro
      expect(state.themeCustomisations.retro.accentColour).toBe("#ff0000");
    });

    it("returns theme name when present in import", async () => {
      const importData = {
        version: THEME_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        name: "Ocean Breeze",
        customisation: {},
      };

      const file = createMockFile(JSON.stringify(importData));
      const result = await importThemeFromFile(file, true);

      expect(result.name).toBe("Ocean Breeze");
    });

    it("throws error for invalid JSON", async () => {
      const file = createMockFile("not valid json {");

      await expect(importThemeFromFile(file, true)).rejects.toThrow("Invalid JSON file");
    });

    it("throws error for invalid structure", async () => {
      const invalidData = {
        version: 2, // Wrong version
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {},
      };

      const file = createMockFile(JSON.stringify(invalidData));

      await expect(importThemeFromFile(file, true)).rejects.toThrow("Invalid theme file");
    });

    it("throws error for invalid hex colour", async () => {
      const invalidData = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {
          accentColour: "red", // Invalid
        },
      };

      const file = createMockFile(JSON.stringify(invalidData));

      await expect(importThemeFromFile(file, true)).rejects.toThrow("Invalid theme file");
    });

    it("throws error for invalid baseTheme", async () => {
      const invalidData = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "dark", // Invalid
        customisation: {},
      };

      const file = createMockFile(JSON.stringify(invalidData));

      await expect(importThemeFromFile(file, true)).rejects.toThrow("Invalid theme file");
    });
  });

  describe("hasThemeCustomisations", () => {
    beforeEach(() => {
      useSettingsStore.getState().resetToDefaults();
    });

    it("returns false for default theme", () => {
      expect(hasThemeCustomisations("modern")).toBe(false);
      expect(hasThemeCustomisations("retro")).toBe(false);
      expect(hasThemeCustomisations("minimal")).toBe(false);
    });

    it("returns true when theme is customised", () => {
      const store = useSettingsStore.getState();
      store.setThemeCustomisation("modern", { accentColour: "#ff0000" });

      expect(hasThemeCustomisations("modern")).toBe(true);
      expect(hasThemeCustomisations("retro")).toBe(false); // Unmodified
    });

    it("returns false when customisation matches default", () => {
      const store = useSettingsStore.getState();
      // Set to same as default
      store.setThemeCustomisation("modern", {
        accentColour: DEFAULT_THEME_CUSTOMISATIONS.modern.accentColour,
      });

      expect(hasThemeCustomisations("modern")).toBe(false);
    });
  });

  describe("countThemeOverrides", () => {
    beforeEach(() => {
      useSettingsStore.getState().resetToDefaults();
    });

    it("returns 0 for default theme", () => {
      expect(countThemeOverrides("modern")).toBe(0);
    });

    it("counts number of overrides", () => {
      const store = useSettingsStore.getState();
      store.setThemeCustomisation("modern", {
        accentColour: "#ff0000",
        borderRadius: "large",
        shadowIntensity: "strong",
      });

      expect(countThemeOverrides("modern")).toBe(3);
    });

    it("does not count values matching defaults", () => {
      const store = useSettingsStore.getState();
      store.setThemeCustomisation("modern", {
        accentColour: "#ff0000", // Override
        borderRadius: DEFAULT_THEME_CUSTOMISATIONS.modern.borderRadius, // Same as default
      });

      expect(countThemeOverrides("modern")).toBe(1); // Only accentColour
    });
  });

  describe("_testExports.extractOverrides", () => {
    const { extractOverrides } = _testExports;

    it("extracts only values that differ from defaults", () => {
      const current = {
        ...DEFAULT_THEME_CUSTOMISATIONS.modern,
        accentColour: "#ff0000",
        borderRadius: "large" as const,
      };

      const overrides = extractOverrides(current, DEFAULT_THEME_CUSTOMISATIONS.modern);

      expect(overrides.accentColour).toBe("#ff0000");
      expect(overrides.borderRadius).toBe("large");
      expect(overrides.shadowIntensity).toBeUndefined();
      expect(overrides.animationStyle).toBeUndefined();
    });

    it("returns empty object when no overrides", () => {
      const overrides = extractOverrides(
        DEFAULT_THEME_CUSTOMISATIONS.modern,
        DEFAULT_THEME_CUSTOMISATIONS.modern
      );

      expect(Object.keys(overrides)).toHaveLength(0);
    });

    it("handles all customisation fields", () => {
      const current = {
        ...DEFAULT_THEME_CUSTOMISATIONS.retro,
        borderRadius: "large" as const,
        borderWidth: "medium" as const,
        shadowIntensity: "none" as const,
        animationStyle: "bouncy" as const,
        accentColour: "#123456",
        hoverColour: "#654321",
        cardBackgroundColour: "#000000",
        borderColour: "#ffffff",
        textColour: "#aaaaaa",
        detailTransparency: "75" as const,
        overlayStyle: "light" as const,
        moreButtonLabel: "Read More",
        autoExpandMore: true,
        zoomImage: false,
        flipAnimation: false,
        detailAnimation: false,
        overlayAnimation: false,
        verdictAnimationStyle: "slide" as const,
      };

      const overrides = extractOverrides(current, DEFAULT_THEME_CUSTOMISATIONS.retro);

      // All fields were changed, so all should be in overrides
      expect(Object.keys(overrides).length).toBeGreaterThan(10);
    });
  });
});
