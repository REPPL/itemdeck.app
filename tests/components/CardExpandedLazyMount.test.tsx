/**
 * Lazy-mount regression tests for CardCompactItem and CardListItem.
 *
 * Each CardExpanded instance registers a window resize listener (via
 * useViewportSize) and several store subscriptions on mount. The list and
 * compact layouts are not virtualised, so mounting one CardExpanded per card
 * unconditionally multiplied into thousands of listeners/subscriptions on a
 * large collection. Both renderers must instead mount CardExpanded lazily, only
 * once the card is opened, matching Card.tsx.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { DisplayCard } from "@/hooks/useCollection";

// Replace CardExpanded with a marker so we can observe whether it is mounted.
vi.mock("@/components/CardExpanded", () => ({
  CardExpanded: () => <div data-testid="card-expanded-mounted" />,
}));

import { CardCompactItem } from "@/components/CardCompactItem/CardCompactItem";
import { CardListItem } from "@/components/CardListItem/CardListItem";

const mockCard = {
  id: "card-1",
  title: "Test Card",
  imageUrl: "https://example.com/image.jpg",
} as unknown as DisplayCard;

describe.each([
  ["CardCompactItem", CardCompactItem],
  ["CardListItem", CardListItem],
])("%s lazy CardExpanded mount", (_name, Component) => {
  it("does not mount CardExpanded before the card is opened", () => {
    render(<Component card={mockCard} />);
    expect(
      screen.queryByTestId("card-expanded-mounted")
    ).not.toBeInTheDocument();
  });

  it("mounts CardExpanded after the card is clicked", () => {
    render(<Component card={mockCard} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("card-expanded-mounted")).toBeInTheDocument();
  });
});
