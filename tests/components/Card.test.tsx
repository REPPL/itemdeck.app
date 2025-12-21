/**
 * Tests for Card component flip behaviour.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Card } from "@/components/Card/Card";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import type { CardData } from "@/types/card";

// Test wrapper with required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </ConfigProvider>
  );
}

const mockCard: CardData = {
  id: "test-card-1",
  title: "Test Card",
  year: "2024",
  imageUrl: "https://example.com/image.jpg",
  logoUrl: undefined,
};

describe("Card", () => {
  // Helper to get the main card element (article with role="button")
  // Uses name filter to distinguish from the info button
  const getCardElement = () =>
    screen.getByRole("button", { name: /showing (back|front)/ });

  it("renders card with title", () => {
    render(
      <TestWrapper>
        <Card card={mockCard} />
      </TestWrapper>
    );

    // Card should have aria-label with title
    const card = getCardElement();
    expect(card).toHaveAttribute("aria-label", "Test Card (showing back)");
  });

  it("shows back face by default", () => {
    render(
      <TestWrapper>
        <Card card={mockCard} />
      </TestWrapper>
    );

    const card = getCardElement();
    expect(card).toHaveAttribute("data-flipped", "false");
    expect(card).toHaveAttribute("aria-pressed", "false");
  });

  it("shows front face when flipped", () => {
    render(
      <TestWrapper>
        <Card card={mockCard} isFlipped={true} />
      </TestWrapper>
    );

    const card = getCardElement();
    expect(card).toHaveAttribute("data-flipped", "true");
    expect(card).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onFlip when clicked", () => {
    const onFlip = vi.fn();

    render(
      <TestWrapper>
        <Card card={mockCard} onFlip={onFlip} />
      </TestWrapper>
    );

    const card = getCardElement();
    fireEvent.click(card);

    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it("calls onFlip when Enter key is pressed", () => {
    const onFlip = vi.fn();

    render(
      <TestWrapper>
        <Card card={mockCard} onFlip={onFlip} />
      </TestWrapper>
    );

    const card = getCardElement();
    fireEvent.keyDown(card, { key: "Enter" });

    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it("calls onFlip when Space key is pressed", () => {
    const onFlip = vi.fn();

    render(
      <TestWrapper>
        <Card card={mockCard} onFlip={onFlip} />
      </TestWrapper>
    );

    const card = getCardElement();
    fireEvent.keyDown(card, { key: " " });

    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it("does not call onFlip for other keys", () => {
    const onFlip = vi.fn();

    render(
      <TestWrapper>
        <Card card={mockCard} onFlip={onFlip} />
      </TestWrapper>
    );

    const card = getCardElement();
    fireEvent.keyDown(card, { key: "a" });
    fireEvent.keyDown(card, { key: "Tab" });
    fireEvent.keyDown(card, { key: "Escape" });

    expect(onFlip).not.toHaveBeenCalled();
  });

  it("renders without onFlip callback", () => {
    // Should not throw when no onFlip provided
    render(
      <TestWrapper>
        <Card card={mockCard} />
      </TestWrapper>
    );

    const card = getCardElement();
    fireEvent.click(card); // Should not throw

    expect(card).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(
      <TestWrapper>
        <Card card={mockCard} />
      </TestWrapper>
    );

    const card = getCardElement();

    expect(card).toHaveAttribute("tabIndex", "0");
    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(card).toHaveAttribute("aria-label", "Test Card (showing back)");
  });

  it("updates aria-label when flipped", () => {
    render(
      <TestWrapper>
        <Card card={mockCard} isFlipped={true} />
      </TestWrapper>
    );

    const card = getCardElement();
    expect(card).toHaveAttribute("aria-label", "Test Card (showing front)");
  });

  it("displays year on both faces", () => {
    render(
      <TestWrapper>
        <Card card={mockCard} />
      </TestWrapper>
    );

    // Year appears on both back (textField) and front (overlay)
    const yearElements = screen.getAllByText("2024");
    expect(yearElements).toHaveLength(2);
  });

  it("renders card without year", () => {
    const cardWithoutYear: CardData = {
      ...mockCard,
      year: undefined,
    };

    render(
      <TestWrapper>
        <Card card={cardWithoutYear} />
      </TestWrapper>
    );

    expect(screen.queryByText("2024")).not.toBeInTheDocument();
  });
});

describe("Card compound components", () => {
  it("exports CardBack component", () => {
    expect(Card.Back).toBeDefined();
  });

  it("exports CardFront component", () => {
    expect(Card.Front).toBeDefined();
  });

  it("exports CardInner component", () => {
    expect(Card.Inner).toBeDefined();
  });
});
