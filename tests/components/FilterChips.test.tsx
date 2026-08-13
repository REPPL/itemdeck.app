/**
 * Tests for the add-filter dropdown counts.
 *
 * Each filter row shows the number of options for its own field. A stale
 * field-name branch previously made the Platform row show the genre count.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterChips } from "@/components/SearchBar/FilterChips";

describe("FilterChips add-filter dropdown", () => {
  it("shows each filter's own option count, not another field's", async () => {
    render(
      <FilterChips
        filterOptions={{
          platforms: ["Switch"],
          years: [1994],
          genres: ["RPG", "Action", "Puzzle"],
        }}
      />
    );

    await userEvent.click(screen.getByTitle("Add filter"));

    // Platform has 1 option; the genre count is 3. The Platform row must show
    // its own count, so its text is "Platform1" (label + count), not
    // "Platform3".
    const platformRow = screen.getByRole("button", { name: /Platform/ });
    expect(platformRow.textContent).toBe("Platform1");

    const genreRow = screen.getByRole("button", { name: /Genre/ });
    expect(genreRow.textContent).toBe("Genre3");
  });
});
