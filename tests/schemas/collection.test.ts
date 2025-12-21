/**
 * Tests for collection schema validation.
 */

import { describe, it, expect } from "vitest";
import {
  collectionSchema,
  collectionMetaSchema,
  validateCollection,
  safeValidateCollection,
  joinCardsWithCategories,
  type Collection,
  type CardWithCategory,
} from "@/schemas/collection.schema";
import type { CardData } from "@/schemas/cardData.schema";
import type { Category } from "@/schemas/category.schema";

describe("collectionMetaSchema", () => {
  it("validates minimal metadata", () => {
    const meta = { name: "Test Collection" };
    const result = collectionMetaSchema.safeParse(meta);
    expect(result.success).toBe(true);
  });

  it("validates complete metadata", () => {
    const meta = {
      name: "My Collection",
      description: "A test collection",
      version: "1.0.0",
      schema: "ranked-collection",
      schemaVersion: "1.0.0",
      display: {
        cardBack: {
          showLogo: true,
          showCategory: true,
          showYear: true,
        },
        cardFront: {
          showImage: true,
          showTitle: true,
          showDescription: true,
          showLink: true,
        },
        theme: "retro",
        themeVersion: "1.0.0",
      },
      metadata: {
        author: "Test",
        licence: "MIT",
      },
    };
    const result = collectionMetaSchema.safeParse(meta);
    expect(result.success).toBe(true);
  });

  it("rejects metadata without name", () => {
    const meta = { description: "No name" };
    const result = collectionMetaSchema.safeParse(meta);
    expect(result.success).toBe(false);
  });
});

describe("collectionSchema", () => {
  it("validates empty collection", () => {
    const collection = {
      items: [],
      categories: [],
    };
    const result = collectionSchema.safeParse(collection);
    expect(result.success).toBe(true);
  });

  it("validates collection with items only", () => {
    const collection = {
      items: [
        { id: "1", title: "Item 1" },
        { id: "2", title: "Item 2" },
      ],
      categories: [],
    };
    const result = collectionSchema.safeParse(collection);
    expect(result.success).toBe(true);
  });

  it("validates complete collection", () => {
    const collection: Collection = {
      items: [
        { id: "1", title: "Item 1", metadata: { category: "cat1" } },
        { id: "2", title: "Item 2", metadata: { category: "cat2" } },
      ],
      categories: [
        { id: "cat1", title: "Category 1" },
        { id: "cat2", title: "Category 2" },
      ],
      meta: {
        name: "Test Collection",
        schema: "ranked-collection",
      },
    };
    const result = collectionSchema.safeParse(collection);
    expect(result.success).toBe(true);
  });

  it("rejects collection with invalid items", () => {
    const collection = {
      items: [{ title: "No ID" }],
      categories: [],
    };
    const result = collectionSchema.safeParse(collection);
    expect(result.success).toBe(false);
  });

  it("rejects collection with invalid categories", () => {
    const collection = {
      items: [],
      categories: [{ id: "cat1" }], // Missing title
    };
    const result = collectionSchema.safeParse(collection);
    expect(result.success).toBe(false);
  });
});

describe("validateCollection", () => {
  it("returns validated collection for valid input", () => {
    const collection = {
      items: [{ id: "1", title: "Test" }],
      categories: [],
    };
    const result = validateCollection(collection);
    expect(result.items).toHaveLength(1);
    expect(result.categories).toHaveLength(0);
  });

  it("throws for invalid input", () => {
    expect(() => validateCollection({ items: "invalid" })).toThrow();
  });
});

describe("safeValidateCollection", () => {
  it("returns success for valid collection", () => {
    const collection = {
      items: [],
      categories: [],
    };
    const result = safeValidateCollection(collection);
    expect(result.success).toBe(true);
  });

  it("returns error for invalid collection", () => {
    const result = safeValidateCollection({ invalid: true });
    expect(result.success).toBe(false);
  });
});

describe("joinCardsWithCategories", () => {
  const categories: Category[] = [
    { id: "nes", title: "NES", year: "1989" },
    { id: "snes", title: "SNES", year: "1992" },
    { id: "n64", title: "N64", year: "1997" },
  ];

  it("joins cards with matching categories", () => {
    const cards: CardData[] = [
      { id: "1", title: "Mario", metadata: { category: "NES" } },
      { id: "2", title: "Zelda", metadata: { category: "SNES" } },
    ];

    const result = joinCardsWithCategories(cards, categories);

    expect(result).toHaveLength(2);
    expect(result[0].category?.id).toBe("nes");
    expect(result[0].category?.title).toBe("NES");
    expect(result[1].category?.id).toBe("snes");
  });

  it("handles case-insensitive category matching", () => {
    const cards: CardData[] = [
      { id: "1", title: "Test", metadata: { category: "NES" } },
      { id: "2", title: "Test 2", metadata: { category: "nes" } },
      { id: "3", title: "Test 3", metadata: { category: "Nes" } },
    ];

    const result = joinCardsWithCategories(cards, categories);

    expect(result[0].category?.id).toBe("nes");
    expect(result[1].category?.id).toBe("nes");
    expect(result[2].category?.id).toBe("nes");
  });

  it("returns undefined category for unmatched cards", () => {
    const cards: CardData[] = [
      { id: "1", title: "Test", metadata: { category: "UNKNOWN" } },
    ];

    const result = joinCardsWithCategories(cards, categories);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeUndefined();
  });

  it("handles cards without metadata", () => {
    const cards: CardData[] = [{ id: "1", title: "No Metadata" }];

    const result = joinCardsWithCategories(cards, categories);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeUndefined();
  });

  it("handles cards without category in metadata", () => {
    const cards: CardData[] = [
      { id: "1", title: "Test", metadata: { rank: "1" } },
    ];

    const result = joinCardsWithCategories(cards, categories);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeUndefined();
  });

  it("handles empty arrays", () => {
    expect(joinCardsWithCategories([], categories)).toEqual([]);
    expect(joinCardsWithCategories([{ id: "1", title: "T" }], [])).toHaveLength(
      1
    );
  });

  it("preserves original card data", () => {
    const cards: CardData[] = [
      {
        id: "1",
        title: "Mario",
        year: "1985",
        summary: "Platform game",
        metadata: { category: "NES", rank: "1" },
      },
    ];

    const result = joinCardsWithCategories(cards, categories);

    const joined = result[0] as CardWithCategory;
    expect(joined.id).toBe("1");
    expect(joined.title).toBe("Mario");
    expect(joined.year).toBe("1985");
    expect(joined.summary).toBe("Platform game");
    expect(joined.metadata?.rank).toBe("1");
  });
});

describe("real-world data compatibility", () => {
  it("validates retro-games collection format", () => {
    // Sample from actual data
    const collection = {
      items: [
        {
          id: "cosmic-ark-vcs2600",
          title: "Cosmic Ark",
          metadata: { category: "VCS2600", rank: "1" },
          year: "1981",
          summary: "Space rescue game.",
          detailUrl: "https://en.wikipedia.org/wiki/Cosmic_Ark",
        },
      ],
      categories: [
        {
          id: "vcs2600",
          title: "VCS2600",
          year: "1981",
          summary: "Atari 2600 console.",
          detailUrl: "https://en.wikipedia.org/wiki/Atari_2600",
        },
      ],
      meta: {
        name: "My Top Computer & Video Games",
        description: "A personal ranking.",
        version: "1.0.0",
        schema: "ranked-collection",
        schemaVersion: "1.0.0",
      },
    };

    const result = collectionSchema.safeParse(collection);
    expect(result.success).toBe(true);
  });
});
