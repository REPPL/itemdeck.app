/**
 * Tests for settings export schema.
 */

import { describe, it, expect } from "vitest";
import {
  settingsExportSchema,
  exportableSettingsSchema,
  validateSettingsExport,
  formatSettingsValidationError,
  SETTINGS_EXPORT_VERSION,
} from "@/schemas/settingsExport.schema";

describe("settingsExport schema", () => {
  describe("exportableSettingsSchema", () => {
    it("validates complete settings object", () => {
      const validSettings = {
        layout: "grid",
        cardSizePreset: "medium",
        cardAspectRatio: "5:7",
        maxVisibleCards: 2,
        cardBackDisplay: "logo",
        shuffleOnLoad: true,
        visualTheme: "modern",
        reduceMotion: "system",
        highContrast: false,
        titleDisplayMode: "truncate",
        dragModeEnabled: true,
        showHelpButton: true,
        showSettingsButton: true,
        showDragIcon: true,
      };

      const result = exportableSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it("accepts empty object (all fields optional)", () => {
      const result = exportableSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("validates layout enum values", () => {
      const validLayouts = ["grid", "list", "compact", "fit"];
      for (const layout of validLayouts) {
        const result = exportableSettingsSchema.safeParse({ layout });
        expect(result.success).toBe(true);
      }

      const result = exportableSettingsSchema.safeParse({ layout: "invalid" });
      expect(result.success).toBe(false);
    });

    it("validates visualTheme enum values", () => {
      const validThemes = ["retro", "modern", "minimal"];
      for (const visualTheme of validThemes) {
        const result = exportableSettingsSchema.safeParse({ visualTheme });
        expect(result.success).toBe(true);
      }

      const result = exportableSettingsSchema.safeParse({ visualTheme: "dark" });
      expect(result.success).toBe(false);
    });

    it("validates maxVisibleCards range", () => {
      const result1 = exportableSettingsSchema.safeParse({ maxVisibleCards: 1 });
      expect(result1.success).toBe(true);

      const result10 = exportableSettingsSchema.safeParse({ maxVisibleCards: 10 });
      expect(result10.success).toBe(true);

      const resultZero = exportableSettingsSchema.safeParse({ maxVisibleCards: 0 });
      expect(resultZero.success).toBe(false);

      const resultTooHigh = exportableSettingsSchema.safeParse({ maxVisibleCards: 11 });
      expect(resultTooHigh.success).toBe(false);
    });

    it("validates boolean fields", () => {
      const result = exportableSettingsSchema.safeParse({
        shuffleOnLoad: true,
        highContrast: false,
        dragModeEnabled: true,
      });
      expect(result.success).toBe(true);

      const invalidResult = exportableSettingsSchema.safeParse({
        shuffleOnLoad: "yes",
      });
      expect(invalidResult.success).toBe(false);
    });

    it("validates reduceMotion enum values", () => {
      const validValues = ["system", "on", "off"];
      for (const reduceMotion of validValues) {
        const result = exportableSettingsSchema.safeParse({ reduceMotion });
        expect(result.success).toBe(true);
      }
    });

    it("validates nested themeCustomisations", () => {
      const validData = {
        themeCustomisations: {
          retro: {
            borderRadius: "none",
            shadowIntensity: "strong",
            accentColour: "#ff6b6b",
          },
          modern: {
            borderRadius: "medium",
            animationStyle: "smooth",
          },
        },
      };

      const result = exportableSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("validates nested fieldMapping", () => {
      const validData = {
        fieldMapping: {
          titleField: "title",
          subtitleField: "year",
          sortDirection: "asc",
        },
      };

      const result = exportableSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("validates searchFields array", () => {
      const validData = {
        searchFields: ["title", "summary", "verdict"],
      };

      const result = exportableSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("settingsExportSchema", () => {
    it("validates complete export structure", () => {
      const validExport = {
        version: SETTINGS_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          layout: "grid",
          visualTheme: "modern",
        },
      };

      const result = settingsExportSchema.safeParse(validExport);
      expect(result.success).toBe(true);
    });

    it("requires version to be a positive integer", () => {
      const validExport = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {},
      };

      const result = settingsExportSchema.safeParse(validExport);
      expect(result.success).toBe(true);

      const invalidVersion = {
        version: 0,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {},
      };
      expect(settingsExportSchema.safeParse(invalidVersion).success).toBe(false);

      const stringVersion = {
        version: "1",
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {},
      };
      expect(settingsExportSchema.safeParse(stringVersion).success).toBe(false);
    });

    it("requires exportedAt to be a valid ISO datetime", () => {
      const validExport = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {},
      };
      expect(settingsExportSchema.safeParse(validExport).success).toBe(true);

      const invalidDate = {
        version: 1,
        exportedAt: "not-a-date",
        settings: {},
      };
      expect(settingsExportSchema.safeParse(invalidDate).success).toBe(false);

      const shortDate = {
        version: 1,
        exportedAt: "2025-12-29",
        settings: {},
      };
      expect(settingsExportSchema.safeParse(shortDate).success).toBe(false);
    });

    it("requires settings object", () => {
      const noSettings = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
      };
      expect(settingsExportSchema.safeParse(noSettings).success).toBe(false);

      const nullSettings = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: null,
      };
      expect(settingsExportSchema.safeParse(nullSettings).success).toBe(false);
    });
  });

  describe("validateSettingsExport", () => {
    it("returns success for valid data", () => {
      const validData = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: { layout: "grid" },
      };

      const result = validateSettingsExport(validData);
      expect(result.success).toBe(true);
    });

    it("returns error for invalid data", () => {
      const result = validateSettingsExport({ invalid: true });
      expect(result.success).toBe(false);
    });

    it("returns error for non-object data", () => {
      expect(validateSettingsExport(null).success).toBe(false);
      expect(validateSettingsExport("string").success).toBe(false);
      expect(validateSettingsExport(123).success).toBe(false);
    });
  });

  describe("formatSettingsValidationError", () => {
    it("formats error messages with paths", () => {
      const result = settingsExportSchema.safeParse({
        version: "invalid",
        exportedAt: 123,
      });

      if (!result.success) {
        const formatted = formatSettingsValidationError(result.error);
        expect(formatted).toContain("version");
        expect(formatted).toContain("exportedAt");
      } else {
        throw new Error("Expected validation to fail");
      }
    });

    it("formats nested path errors", () => {
      const result = settingsExportSchema.safeParse({
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        settings: {
          layout: "invalid-layout",
        },
      });

      if (!result.success) {
        const formatted = formatSettingsValidationError(result.error);
        expect(formatted).toContain("settings.layout");
      } else {
        throw new Error("Expected validation to fail");
      }
    });
  });

  describe("SETTINGS_EXPORT_VERSION", () => {
    it("matches settingsStore version", () => {
      // This ensures the export version stays in sync
      expect(SETTINGS_EXPORT_VERSION).toBe(26);
    });
  });
});
