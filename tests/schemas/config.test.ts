/**
 * Tests for configuration schema validation.
 */

import { describe, it, expect } from "vitest";
import {
  CardConfigSchema,
  AnimationConfigSchema,
  BehaviourConfigSchema,
  AppConfigSchema,
  parseConfig,
  validatePartialConfig,
  DEFAULT_CONFIG,
  DEFAULT_CARD_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_BEHAVIOUR_CONFIG,
} from "@/schemas/config.schema";

describe("CardConfigSchema", () => {
  it("validates correct card config", () => {
    const config = {
      width: 300,
      aspectRatio: 1.4,
      gap: 16,
      borderRadius: 12,
    };
    expect(CardConfigSchema.safeParse(config).success).toBe(true);
  });

  it("rejects width below minimum", () => {
    const config = { ...DEFAULT_CARD_CONFIG, width: 50 };
    const result = CardConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects width above maximum", () => {
    const config = { ...DEFAULT_CARD_CONFIG, width: 700 };
    const result = CardConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects aspectRatio below minimum", () => {
    const config = { ...DEFAULT_CARD_CONFIG, aspectRatio: 0.5 };
    const result = CardConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects aspectRatio above maximum", () => {
    const config = { ...DEFAULT_CARD_CONFIG, aspectRatio: 3 };
    const result = CardConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("accepts optional logoUrl", () => {
    const config = { ...DEFAULT_CARD_CONFIG, logoUrl: "https://example.com/logo.png" };
    const result = CardConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.logoUrl).toBe("https://example.com/logo.png");
    }
  });
});

describe("AnimationConfigSchema", () => {
  it("validates correct animation config", () => {
    const config = {
      flipDuration: 0.6,
      transitionDuration: 0.3,
      enableAnimations: true,
    };
    expect(AnimationConfigSchema.safeParse(config).success).toBe(true);
  });

  it("rejects flipDuration above maximum", () => {
    const config = { ...DEFAULT_ANIMATION_CONFIG, flipDuration: 3 };
    const result = AnimationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("allows zero for flipDuration (instant)", () => {
    const config = { ...DEFAULT_ANIMATION_CONFIG, flipDuration: 0 };
    const result = AnimationConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});

describe("BehaviourConfigSchema", () => {
  it("validates correct behaviour config", () => {
    const config = { maxVisibleCards: 2 };
    expect(BehaviourConfigSchema.safeParse(config).success).toBe(true);
  });

  it("rejects maxVisibleCards below minimum", () => {
    const config = { maxVisibleCards: 0 };
    const result = BehaviourConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects maxVisibleCards above maximum", () => {
    const config = { maxVisibleCards: 25 };
    const result = BehaviourConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe("AppConfigSchema", () => {
  it("validates complete config", () => {
    const result = AppConfigSchema.safeParse(DEFAULT_CONFIG);
    expect(result.success).toBe(true);
  });

  it("rejects config with invalid nested values", () => {
    const config = {
      card: { ...DEFAULT_CARD_CONFIG, width: 50 },
      animation: DEFAULT_ANIMATION_CONFIG,
      behaviour: DEFAULT_BEHAVIOUR_CONFIG,
    };
    const result = AppConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe("parseConfig", () => {
  it("returns defaults for null input", () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it("returns defaults for undefined input", () => {
    expect(parseConfig(undefined)).toEqual(DEFAULT_CONFIG);
  });

  it("returns defaults for non-object input", () => {
    expect(parseConfig("string")).toEqual(DEFAULT_CONFIG);
    expect(parseConfig(123)).toEqual(DEFAULT_CONFIG);
    expect(parseConfig([])).toEqual(DEFAULT_CONFIG);
  });

  it("merges partial config with defaults", () => {
    const result = parseConfig({
      card: { width: 400 },
    });
    expect(result.card.width).toBe(400);
    expect(result.card.aspectRatio).toBe(DEFAULT_CARD_CONFIG.aspectRatio);
    expect(result.animation).toEqual(DEFAULT_ANIMATION_CONFIG);
    expect(result.behaviour).toEqual(DEFAULT_BEHAVIOUR_CONFIG);
  });

  it("returns defaults for invalid values", () => {
    const result = parseConfig({
      card: { width: 50 }, // Invalid: below minimum
    });
    // Should fall back to defaults when validation fails
    expect(result).toEqual(DEFAULT_CONFIG);
  });

  it("preserves valid nested overrides", () => {
    const result = parseConfig({
      animation: { flipDuration: 1.0 },
      behaviour: { maxVisibleCards: 5 },
    });
    expect(result.animation.flipDuration).toBe(1.0);
    expect(result.behaviour.maxVisibleCards).toBe(5);
    expect(result.card).toEqual(DEFAULT_CARD_CONFIG);
  });
});

describe("validatePartialConfig", () => {
  it("returns validated partial for valid input", () => {
    const result = validatePartialConfig({
      card: { width: 400 },
    });
    expect(result).not.toBeNull();
    expect(result?.card?.width).toBe(400);
  });

  it("returns null for invalid values", () => {
    const result = validatePartialConfig({
      card: { width: 50 }, // Invalid: below minimum
    });
    expect(result).toBeNull();
  });

  it("allows empty partial", () => {
    const result = validatePartialConfig({});
    expect(result).not.toBeNull();
    expect(result).toEqual({});
  });

  it("validates multiple nested partials", () => {
    const result = validatePartialConfig({
      card: { width: 450, borderRadius: 20 },
      animation: { enableAnimations: false },
    });
    expect(result).not.toBeNull();
    expect(result?.card?.width).toBe(450);
    expect(result?.card?.borderRadius).toBe(20);
    expect(result?.animation?.enableAnimations).toBe(false);
  });
});

describe("DEFAULT_CONFIG", () => {
  it("has valid card defaults", () => {
    expect(DEFAULT_CARD_CONFIG.width).toBe(300);
    expect(DEFAULT_CARD_CONFIG.aspectRatio).toBe(1.4);
    expect(DEFAULT_CARD_CONFIG.gap).toBe(16);
    expect(DEFAULT_CARD_CONFIG.borderRadius).toBe(12);
  });

  it("has valid animation defaults", () => {
    expect(DEFAULT_ANIMATION_CONFIG.flipDuration).toBe(0.6);
    expect(DEFAULT_ANIMATION_CONFIG.transitionDuration).toBe(0.3);
    expect(DEFAULT_ANIMATION_CONFIG.enableAnimations).toBe(true);
  });

  it("has valid behaviour defaults", () => {
    expect(DEFAULT_BEHAVIOUR_CONFIG.maxVisibleCards).toBe(2);
  });

  it("passes schema validation", () => {
    const result = AppConfigSchema.safeParse(DEFAULT_CONFIG);
    expect(result.success).toBe(true);
  });
});
