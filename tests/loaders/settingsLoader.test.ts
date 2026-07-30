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
            sortDirection: "sideways",
          },
        },
      }),
    });

    const result = await loadCollectionSettings("/data/collections/demo");

    // A non-string path would later throw in the render-time split; only the
    // valid string value survives.
    expect(result?.forced?.fieldMapping).toEqual({ subtitleField: "year" });
  });
});
