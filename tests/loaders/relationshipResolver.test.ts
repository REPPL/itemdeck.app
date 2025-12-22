/**
 * Tests for relationship resolver.
 */

import { describe, it, expect } from "vitest";
import {
  createResolverContext,
  resolveReference,
  resolveEntityRelationships,
  resolveAllRelationships,
  getEntityRank,
} from "@/loaders/relationshipResolver";
import type { CollectionDefinition, Entity } from "@/types/schema";

describe("relationshipResolver", () => {
  const testDefinition: CollectionDefinition = {
    id: "test-collection",
    name: "Test Collection",
    entityTypes: {
      game: {
        primary: true,
        fields: {
          title: { type: "string", required: true },
          year: { type: "number" },
          platform: { type: "string", ref: "platform" },
        },
      },
      platform: {
        fields: {
          title: { type: "string", required: true },
        },
      },
    },
    relationships: {
      "game.platform": {
        target: "platform",
        cardinality: "many-to-one",
        required: true,
      },
      "game.rank": {
        type: "ordinal",
        scope: "platform",
      },
    },
  };

  const testEntities: Record<string, Entity[]> = {
    game: [
      { id: "metroid", title: "Super Metroid", year: 1994, platform: "snes", rank: 0 },
      { id: "zelda", title: "Link to the Past", year: 1991, platform: "snes", rank: 1 },
      { id: "mario", title: "Super Mario World", year: 1990, platform: "snes", rank: 2 },
    ],
    platform: [
      { id: "snes", title: "SNES", year: 1992 },
      { id: "nes", title: "NES", year: 1989 },
    ],
  };

  describe("createResolverContext", () => {
    it("should create entity maps", () => {
      const context = createResolverContext(testDefinition, testEntities);

      expect(context.entityMaps.game.size).toBe(3);
      expect(context.entityMaps.platform.size).toBe(2);
      expect(context.entityMaps.game.get("metroid")?.title).toBe("Super Metroid");
    });
  });

  describe("resolveReference", () => {
    it("should resolve entity reference", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const result = resolveReference("snes", "platform", context);

      expect(result).toBeDefined();
      expect(result?.title).toBe("SNES");
    });

    it("should return undefined for missing reference", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const result = resolveReference("gamecube", "platform", context);

      expect(result).toBeUndefined();
    });
  });

  describe("resolveEntityRelationships", () => {
    it("should resolve platform relationship", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const game = testEntities.game[0];
      const result = resolveEntityRelationships(game, "game", context);

      expect(result._resolved).toBeDefined();
      expect(result._resolved?.platform).toBeDefined();
      expect((result._resolved?.platform as Entity).title).toBe("SNES");
    });

    it("should not add _resolved if no relationships", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const platform = testEntities.platform[0];
      const result = resolveEntityRelationships(platform, "platform", context);

      expect(result._resolved).toBeUndefined();
    });
  });

  describe("resolveAllRelationships", () => {
    it("should resolve all game relationships", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const result = resolveAllRelationships("game", context);

      expect(result).toHaveLength(3);
      expect(result[0]._resolved?.platform).toBeDefined();
      expect(result[1]._resolved?.platform).toBeDefined();
    });
  });

  describe("getEntityRank", () => {
    it("should get rank from ordinal relationship", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const game = testEntities.game[0];
      const result = getEntityRank(game, "game", context);

      expect(result).toBe(0);
    });

    it("should get rank from implicit rank field", () => {
      const simpleDefinition: CollectionDefinition = {
        id: "simple",
        name: "Simple",
        entityTypes: {
          item: { fields: { title: { type: "string" } } },
        },
      };
      const simpleEntities = {
        item: [{ id: "a", title: "A", rank: 5 }],
      };
      const context = createResolverContext(simpleDefinition, simpleEntities);
      const result = getEntityRank(simpleEntities.item[0], "item", context);

      expect(result).toBe(5);
    });

    it("should parse string rank", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const gameWithStringRank = { ...testEntities.game[0], rank: "3" };
      const result = getEntityRank(gameWithStringRank, "game", context);

      expect(result).toBe(3);
    });

    it("should return null for missing rank", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const gameWithoutRank = { id: "test", title: "Test", platform: "snes" };
      const result = getEntityRank(gameWithoutRank, "game", context);

      expect(result).toBeNull();
    });
  });
});
