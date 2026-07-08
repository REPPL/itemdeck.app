/**
 * Tests that collapsed cards do not register window resize listeners.
 *
 * CardExpanded uses useViewportSize, which adds a window resize listener
 * per instance. Card must only mount CardExpanded once the expanded view
 * has been opened, so a grid of N collapsed cards adds zero listeners.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Card } from "@/components/Card/Card";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CardData } from "@/types/card";

// Mock the useCollectionData hook to avoid needing full CollectionDataProvider
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

// Test wrapper with required providers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

function makeCard(id: number): CardData {
  return {
    id: `card-${String(id)}`,
    title: `Card ${String(id)}`,
    year: "2024",
    imageUrl: `https://example.com/image-${String(id)}.jpg`,
    imageUrls: [`https://example.com/image-${String(id)}.jpg`],
    logoUrl: undefined,
  };
}

/**
 * Render the given UI, count how many "resize" listeners were registered
 * on window during the render, then unmount.
 */
function countResizeRegistrations(ui: React.ReactElement): number {
  const spy = vi.spyOn(window, "addEventListener");
  const { unmount } = render(ui);
  const count = spy.mock.calls.filter(([type]) => type === "resize").length;
  spy.mockRestore();
  unmount();
  return count;
}

describe("Card resize listeners", () => {
  it("does not add window resize listeners for collapsed cards", () => {
    // Warm-up render: framer-motion lazily registers a one-time,
    // document-level resize listener on the first motion component mount.
    // Absorb it here so the measurements below only see per-card listeners.
    countResizeRegistrations(
      <TestWrapper>
        <Card card={makeCard(0)} />
      </TestWrapper>
    );

    const baseline = countResizeRegistrations(<TestWrapper>{null}</TestWrapper>);

    const withCards = countResizeRegistrations(
      <TestWrapper>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} card={makeCard(i)} />
        ))}
      </TestWrapper>
    );

    // Collapsed cards must not each register a resize listener
    expect(withCards).toBe(baseline);
  });

  it("mounts the expanded view when the card is opened", () => {
    render(
      <TestWrapper>
        <Card card={makeCard(1)} onOpenExpanded={vi.fn()} />
      </TestWrapper>
    );

    // Dialog is inside an aria-hidden backdrop, so include hidden elements
    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();

    const card = screen.getByRole("button", { name: /showing (back|front)/ });
    fireEvent.click(card);

    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
  });
});
