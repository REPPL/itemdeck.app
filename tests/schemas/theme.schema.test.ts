/**
 * Tests for external theme schema validation.
 */

import { describe, it, expect } from "vitest";
import {
  themeSchema,
  themeColoursSchema,
  themeAnimationsSchema,
  themeBordersSchema,
  themeShadowsSchema,
  validateTheme,
  safeValidateTheme,
  formatThemeValidationError,
} from "@/schemas/theme.schema";

describe("themeSchema", () => {
  it("validates a minimal theme", () => {
    const minimalTheme = {
      name: "Test Theme",
    };

    const result = themeSchema.safeParse(minimalTheme);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Test Theme");
    }
  });

  it("validates a complete theme", () => {
    const completeTheme = {
      id: "test-theme",
      name: "Test Theme",
      version: "1.0.0",
      description: "A test theme",
      author: "Test Author",
      extends: "retro" as const,
      colours: {
        accent: "#ff6b6b",
        hover: "#ff8888",
        cardBackground: "#1a1a2e",
        border: "#ffffff33",
        text: "#ffffff",
        textSecondary: "#cccccc",
      },
      animations: {
        flip: { duration: 0.5, easing: "ease-out" as const },
        detail: { duration: 0.3, easing: "ease-in-out" as const },
        overlay: { duration: 0.2, easing: "ease" as const },
      },
      borders: {
        radius: "medium" as const,
        width: "small" as const,
      },
      shadows: {
        intensity: "strong" as const,
      },
      verdict: {
        animationStyle: "flip" as const,
      },
    };

    const result = themeSchema.safeParse(completeTheme);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.log("Validation errors:", result.error.issues);
    }
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("test-theme");
      expect(result.data.extends).toBe("retro");
      expect(result.data.colours?.accent).toBe("#ff6b6b");
    }
  });

  it("rejects invalid ID format", () => {
    const theme = {
      id: "Invalid ID With Spaces",
      name: "Test",
    };

    const result = themeSchema.safeParse(theme);
    expect(result.success).toBe(false);
  });

  it("rejects invalid version format", () => {
    const theme = {
      name: "Test",
      version: "1.0", // Missing patch version
    };

    const result = themeSchema.safeParse(theme);
    expect(result.success).toBe(false);
  });

  it("rejects invalid extends value", () => {
    const theme = {
      name: "Test",
      extends: "invalid-base",
    };

    const result = themeSchema.safeParse(theme);
    expect(result.success).toBe(false);
  });
});

describe("themeColoursSchema", () => {
  it("validates hex colours with #", () => {
    const colours = {
      accent: "#ff6b6b",
      hover: "#FF8888",
    };

    const result = themeColoursSchema.safeParse(colours);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accent).toBe("#ff6b6b");
      expect(result.data.hover).toBe("#FF8888");
    }
  });

  it("validates and normalises hex colours without #", () => {
    const colours = {
      accent: "ff6b6b",
    };

    const result = themeColoursSchema.safeParse(colours);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accent).toBe("#ff6b6b");
    }
  });

  it("validates shorthand hex colours", () => {
    const colours = {
      accent: "#f00",
    };

    const result = themeColoursSchema.safeParse(colours);
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex colours", () => {
    const colours = {
      accent: "not-a-colour",
    };

    const result = themeColoursSchema.safeParse(colours);
    expect(result.success).toBe(false);
  });

  it("rejects 4-digit hex colours", () => {
    const colours = {
      accent: "#ffff",
    };

    const result = themeColoursSchema.safeParse(colours);
    expect(result.success).toBe(false);
  });
});

describe("themeAnimationsSchema", () => {
  it("validates animation timing", () => {
    const animations = {
      flip: { duration: 0.5, easing: "ease-out" },
    };

    const result = themeAnimationsSchema.safeParse(animations);
    expect(result.success).toBe(true);
  });

  it("rejects negative duration", () => {
    const animations = {
      flip: { duration: -1 },
    };

    const result = themeAnimationsSchema.safeParse(animations);
    expect(result.success).toBe(false);
  });

  it("rejects excessive duration", () => {
    const animations = {
      flip: { duration: 10 }, // Max is 5
    };

    const result = themeAnimationsSchema.safeParse(animations);
    expect(result.success).toBe(false);
  });

  it("rejects invalid easing", () => {
    const animations = {
      flip: { easing: "invalid-easing" },
    };

    const result = themeAnimationsSchema.safeParse(animations);
    expect(result.success).toBe(false);
  });
});

describe("themeBordersSchema", () => {
  it("validates border presets", () => {
    const borders = {
      radius: "medium",
      width: "small",
    };

    const result = themeBordersSchema.safeParse(borders);
    expect(result.success).toBe(true);
  });

  it("accepts all radius values", () => {
    const values = ["none", "small", "medium", "large", "pill"];
    for (const radius of values) {
      const result = themeBordersSchema.safeParse({ radius });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid radius", () => {
    const borders = {
      radius: "extra-large",
    };

    const result = themeBordersSchema.safeParse(borders);
    expect(result.success).toBe(false);
  });
});

describe("themeShadowsSchema", () => {
  it("validates shadow intensity", () => {
    const shadows = {
      intensity: "medium",
    };

    const result = themeShadowsSchema.safeParse(shadows);
    expect(result.success).toBe(true);
  });

  it("accepts all intensity values", () => {
    const values = ["none", "subtle", "medium", "strong"];
    for (const intensity of values) {
      const result = themeShadowsSchema.safeParse({ intensity });
      expect(result.success).toBe(true);
    }
  });
});

describe("validateTheme", () => {
  it("returns valid theme", () => {
    const theme = validateTheme({ name: "Test" });
    expect(theme.name).toBe("Test");
  });

  it("throws on invalid theme", () => {
    expect(() => validateTheme({})).toThrow();
  });
});

describe("safeValidateTheme", () => {
  it("returns success for valid theme", () => {
    const result = safeValidateTheme({ name: "Test" });
    expect(result.success).toBe(true);
  });

  it("returns error for invalid theme", () => {
    const result = safeValidateTheme({});
    expect(result.success).toBe(false);
  });
});

describe("formatThemeValidationError", () => {
  it("formats validation errors", () => {
    const result = safeValidateTheme({
      name: "", // Empty name is invalid
    });

    if (!result.success) {
      const message = formatThemeValidationError(result.error);
      expect(message).toContain("name");
    }
  });
});
