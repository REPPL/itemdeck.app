/**
 * Tests for collectionLoader: allowlist enforcement at the fetch choke
 * point (defence in depth) and tolerant entity validation on the live path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadCollection,
  loadEntities,
} from "@/loaders/collectionLoader";

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
