/**
 * Tests for CardDetailModal, focused on detail URL safety
 * (collection-supplied URLs must not become javascript: hrefs).
 *
 * Note: the modal overlay is rendered with aria-hidden, so links are
 * queried via the DOM rather than accessibility roles.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CardDetailModal } from "@/components/Card/CardDetailModal";
import type { DisplayCard } from "@/hooks/useCollection";

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

describe("CardDetailModal detail URL safety", () => {
  it("renders a link for a safe https detailUrl", () => {
    render(
      <CardDetailModal
        card={makeCard({ detailUrl: "https://example.com/details" })}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const link = document.querySelector("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "https://example.com/details");
  });

  it("renders no clickable link for a javascript: detailUrl", () => {
    render(
      <CardDetailModal
        card={makeCard({ detailUrl: "javascript:alert(1)" })}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(document.querySelector("a")).toBeNull();
  });

  it("renders no clickable link for a data: detailUrl", () => {
    render(
      <CardDetailModal
        card={makeCard({
          detailUrl: "data:text/html,<script>alert(1)</script>",
        })}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(document.querySelector("a")).toBeNull();
  });
});
