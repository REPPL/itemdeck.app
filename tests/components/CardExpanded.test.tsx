/**
 * Tests for CardExpanded: legacy detailUrl fallback and link URL safety.
 *
 * Note: the expanded card backdrop is rendered with aria-hidden, so
 * content is queried via text/DOM rather than accessibility roles.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardExpanded } from "@/components/CardExpanded/CardExpanded";
import type { DisplayCard } from "@/hooks/useCollection";

// Mock collection contexts so no providers are needed
vi.mock("@/context/CollectionDataContext", () => ({
  useCollectionData: () => ({
    cards: [],
    displayConfig: undefined,
    config: undefined,
    collection: undefined,
    isLoading: false,
    error: null,
  }),
}));

function makeCard(overrides: Partial<DisplayCard> = {}): DisplayCard {
  return {
    id: "card-1",
    title: "Test Card",
    imageUrl: "https://example.com/image.jpg",
    imageUrls: ["https://example.com/image.jpg"],
    order: null,
    ...overrides,
  } as DisplayCard;
}

/** Find the closest button around the element containing the given text. */
function getButtonByText(text: string): HTMLButtonElement {
  const label = screen.getByText(text);
  const button = label.closest("button");
  if (!button) {
    throw new Error(`No button found containing text "${text}"`);
  }
  return button;
}

describe("CardExpanded legacy detailUrl fallback", () => {
  it("shows the Source button when detailUrls is empty but legacy detailUrl exists", () => {
    render(
      <CardExpanded
        card={makeCard({
          detailUrls: [],
          detailUrl: "https://example.com/details",
        })}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const sourceButton = getButtonByText("Source");

    // Opening the overlay falls back to the legacy detailUrl
    fireEvent.click(sourceButton);
    const link = document.querySelector(
      'a[href="https://example.com/details"]'
    );
    expect(link).not.toBeNull();
  });

  it("shows the Source button when only legacy detailUrl exists", () => {
    render(
      <CardExpanded
        card={makeCard({ detailUrl: "https://example.com/details" })}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(getButtonByText("Source")).toBeInTheDocument();
  });
});

describe("CardExpanded category link safety", () => {
  it("renders no javascript: link in the category overlay", () => {
    render(
      <CardExpanded
        card={makeCard({
          categoryInfo: {
            id: "platform-1",
            title: "Platform X",
            detailUrls: [
              { url: "javascript:alert(1)", source: "Evil" },
              { url: "https://example.com/platform", source: "Safe" },
            ],
          },
        })}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Open the category/platform overlay
    fireEvent.click(getButtonByText("Platform X"));

    const links = document.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://example.com/platform");
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});
