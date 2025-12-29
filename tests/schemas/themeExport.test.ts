/**
 * Tests for theme export schema.
 */

import { describe, it, expect } from "vitest";
import {
  themeExportSchema,
  themeCustomisationSchema,
  validateThemeExport,
  formatThemeValidationError,
  THEME_EXPORT_VERSION,
} from "@/schemas/themeExport.schema";

describe("themeExport schema", () => {
  describe("themeCustomisationSchema", () => {
    it("validates complete customisation object", () => {
      const validCustomisation = {
        borderRadius: "medium",
        borderWidth: "small",
        shadowIntensity: "strong",
        animationStyle: "smooth",
        accentColour: "#ff6b6b",
        hoverColour: "#ff8888",
        cardBackgroundColour: "#1a1a2e",
        borderColour: "#ffffff33",
        textColour: "#ffffff",
        detailTransparency: "25",
        overlayStyle: "dark",
        moreButtonLabel: "Verdict",
        autoExpandMore: false,
        zoomImage: true,
        flipAnimation: true,
        detailAnimation: true,
        overlayAnimation: true,
        verdictAnimationStyle: "flip",
      };

      const result = themeCustomisationSchema.safeParse(validCustomisation);
      expect(result.success).toBe(true);
    });

    it("accepts empty object (all fields optional)", () => {
      const result = themeCustomisationSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("validates hex colour format", () => {
      // Valid 6-digit hex
      const valid6 = themeCustomisationSchema.safeParse({ accentColour: "#ff6b6b" });
      expect(valid6.success).toBe(true);

      // Valid 8-digit hex (with alpha)
      const valid8 = themeCustomisationSchema.safeParse({ accentColour: "#ff6b6b80" });
      expect(valid8.success).toBe(true);

      // Invalid: no hash
      const noHash = themeCustomisationSchema.safeParse({ accentColour: "ff6b6b" });
      expect(noHash.success).toBe(false);

      // Invalid: 3-digit hex
      const hex3 = themeCustomisationSchema.safeParse({ accentColour: "#f6b" });
      expect(hex3.success).toBe(false);

      // Invalid: not hex
      const notHex = themeCustomisationSchema.safeParse({ accentColour: "#gggggg" });
      expect(notHex.success).toBe(false);
    });

    it("validates borderRadius enum values", () => {
      const validValues = ["none", "small", "medium", "large"];
      for (const borderRadius of validValues) {
        const result = themeCustomisationSchema.safeParse({ borderRadius });
        expect(result.success).toBe(true);
      }

      const invalid = themeCustomisationSchema.safeParse({ borderRadius: "huge" });
      expect(invalid.success).toBe(false);
    });

    it("validates shadowIntensity enum values", () => {
      const validValues = ["none", "subtle", "medium", "strong"];
      for (const shadowIntensity of validValues) {
        const result = themeCustomisationSchema.safeParse({ shadowIntensity });
        expect(result.success).toBe(true);
      }
    });

    it("validates animationStyle enum values", () => {
      const validValues = ["none", "subtle", "smooth", "bouncy"];
      for (const animationStyle of validValues) {
        const result = themeCustomisationSchema.safeParse({ animationStyle });
        expect(result.success).toBe(true);
      }
    });

    it("validates verdictAnimationStyle enum values", () => {
      const validValues = ["slide", "flip"];
      for (const verdictAnimationStyle of validValues) {
        const result = themeCustomisationSchema.safeParse({ verdictAnimationStyle });
        expect(result.success).toBe(true);
      }

      const invalid = themeCustomisationSchema.safeParse({ verdictAnimationStyle: "fade" });
      expect(invalid.success).toBe(false);
    });

    it("validates overlayStyle enum values", () => {
      const validValues = ["dark", "light"];
      for (const overlayStyle of validValues) {
        const result = themeCustomisationSchema.safeParse({ overlayStyle });
        expect(result.success).toBe(true);
      }
    });

    it("validates detailTransparency enum values", () => {
      const validValues = ["none", "25", "50", "75"];
      for (const detailTransparency of validValues) {
        const result = themeCustomisationSchema.safeParse({ detailTransparency });
        expect(result.success).toBe(true);
      }

      const invalid = themeCustomisationSchema.safeParse({ detailTransparency: "100" });
      expect(invalid.success).toBe(false);
    });

    it("validates boolean animation toggles", () => {
      const result = themeCustomisationSchema.safeParse({
        zoomImage: true,
        flipAnimation: false,
        detailAnimation: true,
        overlayAnimation: false,
        autoExpandMore: true,
      });
      expect(result.success).toBe(true);

      const invalid = themeCustomisationSchema.safeParse({
        zoomImage: "yes",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates fontUrl as valid URL", () => {
      const valid = themeCustomisationSchema.safeParse({
        fontUrl: "https://fonts.googleapis.com/css?family=Roboto",
      });
      expect(valid.success).toBe(true);

      const invalid = themeCustomisationSchema.safeParse({
        fontUrl: "not-a-url",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates cardBackBackgroundMode enum values", () => {
      const validValues = ["full", "tiled", "none"];
      for (const cardBackBackgroundMode of validValues) {
        const result = themeCustomisationSchema.safeParse({ cardBackBackgroundMode });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("themeExportSchema", () => {
    it("validates complete export structure", () => {
      const validExport = {
        version: THEME_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {
          accentColour: "#4f9eff",
          borderRadius: "medium",
        },
      };

      const result = themeExportSchema.safeParse(validExport);
      expect(result.success).toBe(true);
    });

    it("validates with optional name", () => {
      const validExport = {
        version: THEME_EXPORT_VERSION,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "retro",
        name: "My Custom Theme",
        customisation: {},
      };

      const result = themeExportSchema.safeParse(validExport);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My Custom Theme");
      }
    });

    it("requires version to be literal 1", () => {
      const validVersion = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {},
      };
      expect(themeExportSchema.safeParse(validVersion).success).toBe(true);

      const invalidVersion = {
        version: 2,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {},
      };
      expect(themeExportSchema.safeParse(invalidVersion).success).toBe(false);

      const stringVersion = {
        version: "1",
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {},
      };
      expect(themeExportSchema.safeParse(stringVersion).success).toBe(false);
    });

    it("validates baseTheme enum values", () => {
      const validThemes = ["retro", "modern", "minimal"];
      for (const baseTheme of validThemes) {
        const result = themeExportSchema.safeParse({
          version: 1,
          exportedAt: "2025-12-29T10:30:00.000Z",
          baseTheme,
          customisation: {},
        });
        expect(result.success).toBe(true);
      }

      const invalid = themeExportSchema.safeParse({
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "dark",
        customisation: {},
      });
      expect(invalid.success).toBe(false);
    });

    it("requires exportedAt to be a valid ISO datetime", () => {
      const valid = themeExportSchema.safeParse({
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {},
      });
      expect(valid.success).toBe(true);

      const invalid = themeExportSchema.safeParse({
        version: 1,
        exportedAt: "2025-12-29",
        baseTheme: "modern",
        customisation: {},
      });
      expect(invalid.success).toBe(false);
    });

    it("requires customisation object", () => {
      const noCustomisation = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
      };
      expect(themeExportSchema.safeParse(noCustomisation).success).toBe(false);
    });

    it("rejects empty name string", () => {
      const emptyName = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        name: "",
        customisation: {},
      };
      expect(themeExportSchema.safeParse(emptyName).success).toBe(false);
    });
  });

  describe("validateThemeExport", () => {
    it("returns success for valid data", () => {
      const validData = {
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: { accentColour: "#123456" },
      };

      const result = validateThemeExport(validData);
      expect(result.success).toBe(true);
    });

    it("returns error for invalid data", () => {
      const result = validateThemeExport({ invalid: true });
      expect(result.success).toBe(false);
    });

    it("returns error for invalid hex colour", () => {
      const result = validateThemeExport({
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: { accentColour: "red" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("formatThemeValidationError", () => {
    it("formats error messages with paths", () => {
      const result = themeExportSchema.safeParse({
        version: "invalid",
        exportedAt: 123,
      });

      if (!result.success) {
        const formatted = formatThemeValidationError(result.error);
        expect(formatted).toContain("version");
      } else {
        throw new Error("Expected validation to fail");
      }
    });

    it("formats nested customisation errors", () => {
      const result = themeExportSchema.safeParse({
        version: 1,
        exportedAt: "2025-12-29T10:30:00.000Z",
        baseTheme: "modern",
        customisation: {
          accentColour: "not-a-colour",
          borderRadius: "invalid",
        },
      });

      if (!result.success) {
        const formatted = formatThemeValidationError(result.error);
        expect(formatted).toContain("customisation.accentColour");
        expect(formatted).toContain("customisation.borderRadius");
      } else {
        throw new Error("Expected validation to fail");
      }
    });
  });

  describe("THEME_EXPORT_VERSION", () => {
    it("is version 1", () => {
      expect(THEME_EXPORT_VERSION).toBe(1);
    });
  });
});
