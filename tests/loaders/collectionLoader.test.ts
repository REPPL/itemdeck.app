/**
 * Tests for collectionLoader: allowlist enforcement at the fetch choke
 * point (defence in depth) and tolerant entity validation on the live path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadCollection, loadEntities } from "@/loaders/collectionLoader";

/** Minimal valid v2 collection definition. */
const collectionDefinition = {
  id: "demo",
  name: "Demo",
  entityTypes: {
    advert: {
      primary: true,
      fields: {},
    },
  },
};

interface StubResponse {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  json: () => Promise<unknown>;
}

function jsonResponse(data: unknown): StubResponse {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(data),
  };
}

function notFound(): StubResponse {
  return {
    ok: false,
    status: 404,
    headers: { get: () => null },
    json: () => Promise.reject(new Error("not found")),
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

/** Install a fetch mock that serves the given URL -> data map. */
function stubFetch(routes: Record<string, unknown>): void {
  fetchMock = vi.fn((input: string) => {
    if (input in routes) {
      return Promise.resolve(jsonResponse(routes[input]));
    }
    return Promise.resolve(notFound());
  });
  vi.stubGlobal("fetch", fetchMock);
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadCollection allowlist enforcement", () => {
  it("refuses to fetch from a non-allowlisted origin", async () => {
    stubFetch({});

    await expect(
      loadCollection("https://evil.example/collections/x")
    ).rejects.toThrow(/allow/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never fetches entity files from a non-allowlisted origin", async () => {
    stubFetch({});

    const entities = await loadEntities("https://evil.example/col", "advert");

    expect(entities).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads collections from an allowlisted jsDelivr origin", async () => {
    const base =
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/demo";
    stubFetch({
      [`${base}/collection.json`]: collectionDefinition,
      [`${base}/adverts/index.json`]: ["a1"],
      [`${base}/adverts/a1.json`]: { id: "a1", title: "First" },
    });

    const collection = await loadCollection(base);

    expect(collection.primaryType).toBe("advert");
    expect(collection.entities["advert"]).toEqual([
      { id: "a1", title: "First" },
    ]);
  });

  it("loads collections from an allowlisted raw.githubusercontent.com origin", async () => {
    const base =
      "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/demo";
    stubFetch({
      [`${base}/collection.json`]: collectionDefinition,
      [`${base}/adverts.json`]: [{ id: "a1" }],
    });

    const collection = await loadCollection(base);

    expect(collection.entities["advert"]).toEqual([{ id: "a1" }]);
  });

  it("still allows same-origin relative paths", async () => {
    const base = "/collections/demo";
    stubFetch({
      [`${base}/collection.json`]: collectionDefinition,
      [`${base}/adverts.json`]: [{ id: "a1" }],
    });

    const collection = await loadCollection(base);

    expect(collection.entities["advert"]).toEqual([{ id: "a1" }]);
  });
});

describe("entity fetch fan-out is bounded", () => {
  const base =
    "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/demo";

  it("keeps concurrent entity fetches within the pool size", async () => {
    const ids = Array.from({ length: 50 }, (_, i) => `e${String(i)}`);
    let inFlight = 0;
    let maxInFlight = 0;

    const mock = vi.fn((input: string) => {
      if (input.endsWith("/adverts/index.json")) {
        return Promise.resolve(jsonResponse(ids));
      }
      // Entity files resolve on a later tick so overlap is observable.
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return new Promise<StubResponse>((resolve) => {
        setTimeout(() => {
          inFlight -= 1;
          const id = input.split("/").pop()?.replace(".json", "");
          resolve(jsonResponse({ id }));
        }, 2);
      });
    });
    vi.stubGlobal("fetch", mock);

    const entities = await loadEntities(base, "advert");

    expect(entities).toHaveLength(50);
    // A concurrency pool caps in-flight fetches; the old Promise.all over the
    // whole list would drive this to 50.
    expect(maxInFlight).toBeLessThanOrEqual(8);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it("preserves index order despite out-of-order settling", async () => {
    const ids = ["first", "second", "third"];
    const delays: Record<string, number> = {
      first: 6,
      second: 2,
      third: 0,
    };
    const mock = vi.fn((input: string) => {
      if (input.endsWith("/adverts/index.json")) {
        return Promise.resolve(jsonResponse(ids));
      }
      const id = input.split("/").pop()?.replace(".json", "") ?? "";
      return new Promise<StubResponse>((resolve) => {
        setTimeout(() => resolve(jsonResponse({ id })), delays[id] ?? 0);
      });
    });
    vi.stubGlobal("fetch", mock);

    const entities = await loadEntities(base, "advert");

    expect(entities.map((e) => (e as { id: string }).id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("caps a hostile index that lists more than the maximum ids", async () => {
    const ids = Array.from({ length: 10001 }, (_, i) => `e${String(i)}`);
    const mock = vi.fn((input: string) => {
      if (input.endsWith("/adverts/index.json")) {
        return Promise.resolve(jsonResponse(ids));
      }
      const id = input.split("/").pop()?.replace(".json", "");
      return Promise.resolve(jsonResponse({ id }));
    });
    vi.stubGlobal("fetch", mock);

    const entities = await loadEntities(base, "advert");

    expect(entities).toHaveLength(10000);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("10001"));
  });

  it("caps a single-file entity array that exceeds the maximum", async () => {
    // Skipping index.json and serving one big array must not bypass the id cap
    // the index-driven path enforces.
    const rows = Array.from({ length: 10001 }, (_, i) => ({
      id: `e${String(i)}`,
    }));
    stubFetch({ [`${base}/adverts.json`]: rows });

    const entities = await loadEntities(base, "advert");

    expect(entities).toHaveLength(10000);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("10001"));
  });
});

describe("entity-type fan-out is bounded", () => {
  const base =
    "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/demo";

  it("caps a hostile collection that defines too many entity types", async () => {
    // A collection.json with a huge entityTypes record: each type would fan
    // out into several probe fetches. The loader must cap the type count.
    const entityTypes: Record<string, unknown> = {
      advert: { primary: true, fields: {} },
    };
    for (let i = 0; i < 500; i += 1) {
      entityTypes[`type${String(i)}`] = { fields: {} };
    }
    const hostileDefinition = { id: "demo", name: "Demo", entityTypes };

    const probedTypeDirs = new Set<string>();
    const mock = vi.fn((input: string) => {
      if (input.endsWith("/collection.json")) {
        return Promise.resolve(jsonResponse(hostileDefinition));
      }
      // Record which entity-type directory each probe targets.
      const match = /\/data\/collections\/demo\/([^/]+)\//.exec(input);
      if (match?.[1]) probedTypeDirs.add(match[1]);
      return Promise.resolve(notFound());
    });
    vi.stubGlobal("fetch", mock);

    const collection = await loadCollection(base);

    // The primary type is always loaded even though it would otherwise be
    // among 500 keys; the total probed directories stay bounded.
    expect(collection.primaryType).toBe("advert");
    expect(probedTypeDirs.size).toBeLessThanOrEqual(50);
    expect(probedTypeDirs.has("adverts")).toBe(true);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("501"));
  });
});

describe("tolerant entity validation", () => {
  it("skips an invalid entity from a plural file and keeps the valid one", async () => {
    const base =
      "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/demo";
    stubFetch({
      [`${base}/adverts.json`]: [
        { id: "good", title: "Valid" },
        { title: "missing id" },
      ],
    });

    const entities = await loadEntities(base, "advert");

    expect(entities).toEqual([{ id: "good", title: "Valid" }]);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("adverts.json")
    );
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("id"));
  });

  it("skips an invalid entity file loaded via index.json and keeps the valid one", async () => {
    const base =
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/demo";
    stubFetch({
      [`${base}/adverts/index.json`]: ["good", "bad"],
      [`${base}/adverts/good.json`]: { id: "good" },
      [`${base}/adverts/bad.json`]: { title: "missing id" },
    });

    const entities = await loadEntities(base, "advert");

    expect(entities).toEqual([{ id: "good" }]);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("bad.json")
    );
  });

  it("rejects a single-entity file whose entity is invalid", async () => {
    const base =
      "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/demo";
    stubFetch({
      [`${base}/advert.json`]: { title: "missing id" },
    });

    const entities = await loadEntities(base, "advert");

    expect(entities).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("loadEntities duplicate id handling", () => {
  // Duplicate ids from an untrusted index defeat CardGrid's random-selection
  // guard, which proves "all selected ids still exist" by comparing counts —
  // a duplicate makes the count match while an id is missing, throwing during
  // render. They also produce duplicate React keys in every view and make one
  // flip toggle several cards.
  it("keeps one entity per id when an index lists a duplicate", async () => {
    const base = "/data/collections/demo";
    stubFetch({
      [`${base}/adverts/index.json`]: ["a", "a", "b"],
      [`${base}/adverts/a.json`]: { id: "a", title: "First" },
      [`${base}/adverts/b.json`]: { id: "b", title: "Second" },
    });

    const entities = await loadEntities(base, "advert");

    expect(entities.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("does not refetch an id an index lists twice", async () => {
    const base = "/data/collections/demo";
    stubFetch({
      [`${base}/adverts/index.json`]: ["a", "a", "a"],
      [`${base}/adverts/a.json`]: { id: "a", title: "First" },
    });

    await loadEntities(base, "advert");

    const entityFetches = fetchMock.mock.calls.filter(
      (call) => call[0] === `${base}/adverts/a.json`
    );
    expect(entityFetches).toHaveLength(1);
  });

  it("keeps one entity per id when a single array file repeats one", async () => {
    const base = "/data/collections/demo";
    stubFetch({
      [`${base}/adverts.json`]: [
        { id: "a", title: "First" },
        { id: "a", title: "Impostor" },
        { id: "b", title: "Second" },
      ],
    });

    const entities = await loadEntities(base, "advert");

    expect(entities.map((e) => e.id)).toEqual(["a", "b"]);
    expect(entities[0]?.title).toBe("First");
  });
});
