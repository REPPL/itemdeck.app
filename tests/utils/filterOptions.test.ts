/**
 * Tests for the filter option bound.
 *
 * The filter dropdown renders one checkbox per option with no virtualisation
 * and re-reconciles the whole list on every toggle, so an uncapped option
 * list built from untrusted collection data freezes the tab.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { capFilterOptions, MAX_FILTER_OPTIONS } from "@/utils/filterOptions";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("capFilterOptions", () => {
  it("leaves a realistic option list untouched", () => {
    const options = ["Action", "Puzzle", "Racing"];

    expect(capFilterOptions(options, "genres")).toBe(options);
  });

  it("leaves a list exactly at the bound untouched", () => {
    const options = Array.from({ length: MAX_FILTER_OPTIONS }, (_, i) =>
      String(i)
    );

    expect(capFilterOptions(options, "genres")).toHaveLength(
      MAX_FILTER_OPTIONS
    );
  });

  it("truncates an attacker-scaled option list", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const options = Array.from({ length: 100000 }, (_, i) => `g${String(i)}`);

    const capped = capFilterOptions(options, "genres");

    expect(capped).toHaveLength(MAX_FILTER_OPTIONS);
    expect(capped[0]).toBe("g0");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
