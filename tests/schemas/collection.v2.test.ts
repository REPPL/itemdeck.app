/**
 * Tests for v2 collection schema validation.
 */

import { describe, it, expect } from "vitest";
import {
  imageSchema,
  entitySchema,
  uiLabelsSchema,
  cardDisplayConfigSchema,
} from "@/schemas/v2/collection.schema";
import { getPrimaryImage, type Image } from "@/types/image";

describe("imageSchema", () => {
  it("validates an image with a well-known type", () => {
    const result = imageSchema.safeParse({
      url: "https://example.com/a.png",
      type: "cover",
    });
    expect(result.success).toBe(true);
  });

  it("validates an image with a dataset-defined type outside the well-known set", () => {
    for (const type of ["flag", "poster", "portrait", "boxart", "console"]) {
      const result = imageSchema.safeParse({
        url: "https://example.com/a.png",
        type,
      });
      expect(result.success, `type "${type}" should validate`).toBe(true);
    }
  });

  it("rejects an empty-string type", () => {
    const result = imageSchema.safeParse({
      url: "https://example.com/a.png",
      type: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-string type", () => {
    const result = imageSchema.safeParse({
      url: "https://example.com/a.png",
      type: 42,
    });
    expect(result.success).toBe(false);
  });
});

describe("entitySchema", () => {
  it("validates an entity whose images use dataset-defined types", () => {
    const result = entitySchema.safeParse({
      id: "c64",
      name: "Commodore 64",
      year: 1982,
      images: [
        { url: "https://example.com/c64.png", type: "console" },
        { url: "https://example.com/c64-box.png", type: "boxart" },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("uiLabelsSchema", () => {
  it("truncates an over-long label instead of rejecting the collection", () => {
    // rankPlaceholder is rendered once per unranked card, so an unbounded value
    // is amplified by the card count. Truncating (rather than failing) keeps an
    // honest author's over-long label from denying the whole collection load.
    const result = uiLabelsSchema.safeParse({
      rankPlaceholder: "Z".repeat(50000),
    });
    expect(result.success).toBe(true);
    expect(result.data?.rankPlaceholder?.length).toBeLessThanOrEqual(120);
  });

  it("passes an ordinary label through unchanged", () => {
    const result = uiLabelsSchema.safeParse({ moreButton: "Show more" });
    expect(result.success).toBe(true);
    expect(result.data?.moreButton).toBe("Show more");
  });
});

describe("cardDisplayConfigSchema verdictFields bound", () => {
  it("truncates an unbounded verdictFields array (DoS guard)", () => {
    // getDisplayableFields scans every spec against the entity's fields, on
    // mount, once per card in the non-virtualised list/compact layouts, so an
    // uncapped array froze the tab on collection load. Truncate rather than
    // reject so an over-long list cannot deny the whole load.
    const result = cardDisplayConfigSchema.safeParse({
      verdictFields: Array.from(
        { length: 200_000 },
        (_, i) => `field-${String(i)}`
      ),
    });
    expect(result.success).toBe(true);
    expect(result.data?.verdictFields?.length).toBeLessThanOrEqual(100);
  });

  it("truncates an over-long individual verdictFields spec", () => {
    const result = cardDisplayConfigSchema.safeParse({
      verdictFields: ["Z".repeat(50_000)],
    });
    expect(result.success).toBe(true);
    expect(result.data?.verdictFields?.[0]?.length).toBeLessThanOrEqual(120);
  });

  it("passes an ordinary verdictFields list through unchanged", () => {
    const result = cardDisplayConfigSchema.safeParse({
      verdictFields: ["rating", "verdict", "summary"],
    });
    expect(result.success).toBe(true);
    expect(result.data?.verdictFields).toEqual([
      "rating",
      "verdict",
      "summary",
    ]);
  });
});

describe("getPrimaryImage", () => {
  it("prefers a boxart image over untyped images when no isPrimary flag is set", () => {
    const images: Image[] = [
      { url: "https://example.com/screen.png", type: "screenshot" },
      { url: "https://example.com/box.png", type: "boxart" },
    ];
    expect(getPrimaryImage(images)?.url).toBe("https://example.com/box.png");
  });
});
