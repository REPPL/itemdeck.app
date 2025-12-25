/**
 * Tests for colour contrast utilities.
 */

import { describe, it, expect } from "vitest";
import {
  getLuminance,
  isLightColour,
  getContrastTextColour,
  getContrastRatio,
  meetsWCAG_AA,
} from "@/utils/colourContrast";

describe("getLuminance", () => {
  it("returns 0 for black", () => {
    expect(getLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("returns 1 for white", () => {
    expect(getLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns ~0.93 for yellow", () => {
    // Yellow (#ffff00) has high luminance
    expect(getLuminance("#ffff00")).toBeGreaterThan(0.9);
  });

  it("handles hex without #", () => {
    expect(getLuminance("ffffff")).toBeCloseTo(1, 5);
  });

  it("handles shorthand hex", () => {
    expect(getLuminance("#fff")).toBeCloseTo(1, 5);
    expect(getLuminance("#000")).toBeCloseTo(0, 5);
  });

  it("calculates correct luminance for red", () => {
    // Red is relatively dark due to lower green/blue contribution
    expect(getLuminance("#ff0000")).toBeLessThan(0.3);
  });

  it("calculates correct luminance for blue", () => {
    // Pure blue has low luminance
    expect(getLuminance("#0000ff")).toBeLessThan(0.1);
  });
});

describe("isLightColour", () => {
  it("returns true for white", () => {
    expect(isLightColour("#ffffff")).toBe(true);
  });

  it("returns false for black", () => {
    expect(isLightColour("#000000")).toBe(false);
  });

  it("returns true for yellow", () => {
    // Yellow is very light
    expect(isLightColour("#ffff00")).toBe(true);
  });

  it("returns false for dark blue", () => {
    expect(isLightColour("#1a1a2e")).toBe(false);
  });

  it("returns true for light grey", () => {
    expect(isLightColour("#cccccc")).toBe(true);
  });

  it("returns false for dark grey", () => {
    expect(isLightColour("#333333")).toBe(false);
  });

  it("respects custom threshold", () => {
    // #808080 has luminance around 0.22
    const midGrey = "#808080";
    expect(isLightColour(midGrey, 0.2)).toBe(true);
    expect(isLightColour(midGrey, 0.3)).toBe(false);
  });
});

describe("getContrastTextColour", () => {
  it("returns black for white background", () => {
    expect(getContrastTextColour("#ffffff")).toBe("#000000");
  });

  it("returns white for black background", () => {
    expect(getContrastTextColour("#000000")).toBe("#ffffff");
  });

  it("returns black for yellow background", () => {
    expect(getContrastTextColour("#ffff00")).toBe("#000000");
  });

  it("returns white for dark blue background", () => {
    expect(getContrastTextColour("#1a1a2e")).toBe("#ffffff");
  });
});

describe("getContrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1 for same colours", () => {
    expect(getContrastRatio("#ff6b6b", "#ff6b6b")).toBeCloseTo(1, 0);
  });

  it("returns high ratio for yellow on black", () => {
    const ratio = getContrastRatio("#ffff00", "#000000");
    expect(ratio).toBeGreaterThan(15);
  });
});

describe("meetsWCAG_AA", () => {
  it("returns true for black on white (normal text)", () => {
    expect(meetsWCAG_AA("#000000", "#ffffff")).toBe(true);
  });

  it("returns false for low contrast pairs", () => {
    // Light grey on white has poor contrast
    expect(meetsWCAG_AA("#cccccc", "#ffffff")).toBe(false);
  });

  it("uses lower threshold for large text", () => {
    // Some colour pairs may pass for large text but fail for normal
    expect(meetsWCAG_AA("#777777", "#ffffff", true)).toBe(true);
    expect(meetsWCAG_AA("#777777", "#ffffff", false)).toBe(false);
  });
});
