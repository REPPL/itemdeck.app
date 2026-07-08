/**
 * Tests for v2 collection schema validation.
 */

import { describe, it, expect } from "vitest";
import {
  imageSchema,
  entitySchema,
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

describe("getPrimaryImage", () => {
  it("prefers a boxart image over untyped images when no isPrimary flag is set", () => {
    const images: Image[] = [
      { url: "https://example.com/screen.png", type: "screenshot" },
      { url: "https://example.com/box.png", type: "boxart" },
    ];
    expect(getPrimaryImage(images)?.url).toBe("https://example.com/box.png");
  });
});
