/**
 * Tests for the collection settings loader's source allowlist.
 *
 * The active basePath can be an arbitrary user-added source, so settings.json
 * must never be fetched from an origin outside the allowlist — an un-gated
 * fetch would leak the visitor's presence to a non-allowlisted origin even
 * when the collection fetch itself is refused.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadCollectionSettings } from "@/loaders/settingsLoader";

describe("loadCollectionSettings allowlist", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch from a non-allowlisted origin", async () => {
    const result = await loadCollectionSettings("https://attacker.example/x");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fetch from an http (non-https) origin", async () => {
    const result = await loadCollectionSettings(
      "http://cdn.jsdelivr.net/gh/a/b"
    );

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches settings from an allowlisted CDN origin", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ version: 1 }),
    });

    await loadCollectionSettings(
      "https://cdn.jsdelivr.net/gh/user/repo@main/data"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdn.jsdelivr.net/gh/user/repo@main/data/settings.json"
    );
  });

  it("fetches settings for a same-origin relative basePath", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ version: 1 }),
    });

    await loadCollectionSettings("/data/collections/demo");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/data/collections/demo/settings.json"
    );
  });

  it("drops non-string forced fieldMapping values from untrusted settings", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        version: 1,
        forced: {
          fieldMapping: {
            titleField: 123,
            subtitleField: "year",
            topBadgeField: "myRank",
            sortDirection: "sideways",
          },
        },
      }),
    });

    const result = await loadCollectionSettings("/data/collections/demo");

    // A non-string path would later throw in the render-time split; the valid
    // string values (including topBadgeField) survive while the number and the
    // invalid enum are dropped.
    expect(result?.forced?.fieldMapping).toEqual({
      subtitleField: "year",
      topBadgeField: "myRank",
    });
  });

  it("caps the length of a forced rankPlaceholderText", async () => {
    // Rendered once per unranked card, so an unbounded value is amplified by
    // the card count into a tab-freezing layout pass, and it persists globally.
    const hostile = "A".repeat(50000);
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        version: 1,
        forced: { rankPlaceholderText: hostile },
      }),
    });

    const result = await loadCollectionSettings("/data/collections/demo");

    expect(result?.forced?.rankPlaceholderText).toBeDefined();
    expect(result?.forced?.rankPlaceholderText?.length).toBeLessThanOrEqual(120);
  });

  it("accepts valid forced cardBackStyle and titleDisplayMode enum values", async () => {
    // These allowlists were previously inverted: they admitted only out-of-enum
    // values and silently dropped every legitimate one, so an honest author's
    // forced value never took effect and an out-of-enum value persisted into
    // global settings (bricking the user's own settings export on reimport).
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        version: 1,
        forced: {
          cardBackStyle: "colour",
          titleDisplayMode: "truncate",
        },
      }),
    });

    const result = await loadCollectionSettings("/data/collections/demo");

    expect(result?.forced?.cardBackStyle).toBe("colour");
    expect(result?.forced?.titleDisplayMode).toBe("truncate");
  });

  it("drops out-of-enum forced cardBackStyle and titleDisplayMode values", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        version: 1,
        forced: {
          // The stale allowlist admitted exactly these; they are not valid
          // members of the CardBackStyle / TitleDisplayMode enums and the
          // settings-export schema rejects them, so they must be dropped here.
          cardBackStyle: "plain",
          titleDisplayMode: "always",
        },
      }),
    });

    const result = await loadCollectionSettings("/data/collections/demo");

    expect(result?.forced?.cardBackStyle).toBeUndefined();
    expect(result?.forced?.titleDisplayMode).toBeUndefined();
  });
});

describe("loadCollectionSettings default bounds", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockSettings(defaults: Record<string, unknown>) {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ version: 1, defaults }),
    });
    return loadCollectionSettings("/data/collections/demo");
  }

  it("rejects a fractional maxVisibleCards that would floor to zero", async () => {
    // The bound is tested before the floor, so 0.5 would otherwise be stored
    // as 0 — CardGrid then discards every card on flip, disabling the app's
    // core interaction for every later collection because the value persists.
    const result = await mockSettings({ maxVisibleCards: 0.5 });

    expect(result?.defaults?.maxVisibleCards).toBeUndefined();
  });

  it("rejects a non-finite maxVisibleCards", async () => {
    // JSON.parse("1e400") yields Infinity, which survives `> 0` and later
    // serialises to null in localStorage — the same brick after one reload.
    const result = await mockSettings({ maxVisibleCards: Infinity });

    expect(result?.defaults?.maxVisibleCards).toBeUndefined();
  });

  it("clamps an oversized maxVisibleCards to the settings-panel maximum", async () => {
    const result = await mockSettings({ maxVisibleCards: 5000 });

    expect(result?.defaults?.maxVisibleCards).toBe(10);
  });

  it("keeps an in-range maxVisibleCards", async () => {
    const result = await mockSettings({ maxVisibleCards: 3 });

    expect(result?.defaults?.maxVisibleCards).toBe(3);
  });

  it("caps an oversized searchFields list", async () => {
    // Search cost is cards x fields on every settled query, so an unbounded
    // field list from an untrusted collection freezes the tab — and the value
    // persists globally, following the visitor to every later collection.
    const result = await mockSettings({
      searchFields: Array.from({ length: 5000 }, (_, i) => `f${String(i)}`),
    });

    expect(result?.defaults?.searchFields).toHaveLength(32);
    expect(result?.defaults?.searchFields?.[0]).toBe("f0");
  });

  it("keeps a normal searchFields list unchanged", async () => {
    const result = await mockSettings({
      searchFields: ["title", "summary", 7, "verdict"],
    });

    expect(result?.defaults?.searchFields).toEqual([
      "title",
      "summary",
      "verdict",
    ]);
  });
});
