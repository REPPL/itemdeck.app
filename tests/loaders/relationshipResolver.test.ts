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
      {
        id: "metroid",
        title: "Super Metroid",
        year: 1994,
        platform: "snes",
        rank: 0,
      },
      {
        id: "zelda",
        title: "Link to the Past",
        year: 1991,
        platform: "snes",
        rank: 1,
      },
      {
        id: "mario",
        title: "Super Mario World",
        year: 1990,
        platform: "snes",
        rank: 2,
      },
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
      expect(context.entityMaps.game.get("metroid")?.title).toBe(
        "Super Metroid"
      );
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

  describe("prototype-chain safety", () => {
    it("resolveReference returns undefined for an Object.prototype target type", () => {
      const context = createResolverContext(testDefinition, testEntities);
      // `entityMaps` is a plain object; before the fix this returned
      // Object.prototype.toString and then threw `map.get is not a function`.
      expect(() => resolveReference("snes", "toString", context)).not.toThrow();
      expect(resolveReference("snes", "toString", context)).toBeUndefined();
    });

    it("does not crash when a relationship target names an Object.prototype member", () => {
      const definition: CollectionDefinition = {
        id: "c",
        name: "C",
        entityTypes: {
          game: { primary: true, fields: { title: { type: "string" } } },
          platform: { fields: { title: { type: "string" } } },
        },
        relationships: {
          // Untrusted target pointing at a prototype member. The field name
          // ("maker") is not itself an entity type, so only the explicit
          // target path runs — which is the path that crashed before the fix.
          "game.maker": { target: "toString", cardinality: "many-to-one" },
        },
      };
      const context = createResolverContext(definition, testEntities);
      const game: Entity = { id: "g1", title: "G", maker: "snes" };

      expect(() =>
        resolveEntityRelationships(game, "game", context)
      ).not.toThrow();
      // The bogus relationship simply does not resolve.
      const resolved = resolveEntityRelationships(game, "game", context);
      expect(resolved._resolved).toBeUndefined();
    });

    it("does not crash when an entity field is named after a prototype member", () => {
      const context = createResolverContext(testDefinition, testEntities);
      const game: Entity = {
        id: "g1",
        title: "G",
        platform: "snes",
        toString: "snes",
      };

      expect(() =>
        resolveEntityRelationships(game, "game", context)
      ).not.toThrow();
    });
  });
});

describe("relationshipResolver with an attacker-scaled definition", () => {
  /**
   * Both the relationship count and the entity count come from untrusted
   * collection JSON, and neither is capped. Rebuilding the relationship
   * entries per entity multiplies the two, so the cost grows with the square
   * of the payload rather than with its size.
   */
  function hostileDefinition(relationshipCount: number): CollectionDefinition {
    const relationships: CollectionDefinition["relationships"] = {};
    for (let i = 0; i < relationshipCount; i++) {
      // Keys naming a type that does not exist: every entry is scanned and
      // discarded for each entity.
      relationships[`ghost${String(i)}.field${String(i)}`] = {};
    }
    return {
      id: "hostile",
      name: "Hostile",
      entityTypes: { game: { primary: true, fields: {} } },
      relationships,
    };
  }

  it("resolves a large collection without super-linear cost", () => {
    const definition = hostileDefinition(10000);
    const entities: Entity[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `g${String(i)}`,
      title: `Game ${String(i)}`,
    }));
    const context = createResolverContext(definition, { game: entities });

    const started = Date.now();
    const resolved = resolveAllRelationships("game", context);
    const elapsed = Date.now() - started;

    expect(resolved).toHaveLength(1000);
    // Pre-fix this rebuilt all 10000 relationship entries for each of the
    // 1000 entities and took several seconds.
    expect(elapsed).toBeLessThan(1500);
  });

  it("ranks entities without rescanning the relationship record", () => {
    const definition = hostileDefinition(10000);
    const entities: Entity[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `g${String(i)}`,
      title: `Game ${String(i)}`,
    }));
    const context = createResolverContext(definition, { game: entities });

    const started = Date.now();
    for (const entity of entities) {
      getEntityRank(entity, "game", context);
    }
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(1500);
  });
});
