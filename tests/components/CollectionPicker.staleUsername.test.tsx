/**
 * Tests for CollectionPicker source pairing.
 *
 * Regression: the picker paired the CURRENT username state with whatever
 * collection entry was on screen. A scan result that arrived from an earlier
 * username therefore persisted (and activated) a source built from the new
 * username and the old folder — a permanently-404ing source, added with no
 * validation. The picker must use the username the entry was scanned from.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/hooks/useMyPlausibleMeDiscovery", () => ({
  useMyPlausibleMeDiscovery: vi.fn(),
}));

import { CollectionPicker } from "@/components/CollectionPicker/CollectionPicker";
import { useMyPlausibleMeDiscovery } from "@/hooks/useMyPlausibleMeDiscovery";
import { useSourceStore } from "@/stores/sourceStore";

const SCANNED_USER = "scanneduser";
const CURRENT_USER = "currentuser";

const addMyPlausibleMeSource = vi.fn(() => "src_test_1");
const setActiveSource = vi.fn();

describe("CollectionPicker source pairing", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useMyPlausibleMeDiscovery).mockReturnValue({
      collections: [
        {
          folder: "retro/games",
          name: "Retro Games",
          username: SCANNED_USER,
        },
      ],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    useSourceStore.setState({
      addMyPlausibleMeSource,
      setActiveSource,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds the source under the username the collection was scanned from", () => {
    render(
      <CollectionPicker onSelect={vi.fn()} initialUsername={CURRENT_USER} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Retro Games/ }));

    expect(addMyPlausibleMeSource).toHaveBeenCalledWith(
      SCANNED_USER,
      "retro/games",
      "Retro Games"
    );
    expect(setActiveSource).toHaveBeenCalledWith("src_test_1");
  });
});
