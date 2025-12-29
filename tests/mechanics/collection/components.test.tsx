/**
 * Tests for collection mechanic components.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CollectionCardOverlay } from "@/mechanics/collection/components/CollectionCardOverlay";
import { useCollectionStore } from "@/mechanics/collection/store";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: React.ComponentPropsWithChildren<React.HTMLAttributes<HTMLButtonElement>>) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, ...props }: React.ComponentPropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.ComponentPropsWithChildren) => <>{children}</>,
}));

describe("CollectionCardOverlay", () => {
  beforeEach(() => {
    // Reset store state before each test
    useCollectionStore.setState({
      isActive: true,
      activeSourceId: "test-source",
      collections: {},
      settings: {
        showProgress: true,
        showUnownedBadge: false,
        keyboardShortcuts: true,
      },
      allCardIds: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should render nothing when mechanic is not active", () => {
    useCollectionStore.setState({ isActive: false });

    const { container } = render(<CollectionCardOverlay cardId="card-1" />);

    expect(container.firstChild).toBeNull();
  });

  it("should render owned badge when card is owned", () => {
    useCollectionStore.getState().setOwnership("card-1", "owned");

    render(<CollectionCardOverlay cardId="card-1" />);

    expect(screen.getByTitle("In collection")).toBeInTheDocument();
  });

  it("should render wishlist badge when card is wishlisted", () => {
    useCollectionStore.getState().setOwnership("card-1", "wishlist");

    render(<CollectionCardOverlay cardId="card-1" />);

    expect(screen.getByTitle("Wishlisted")).toBeInTheDocument();
  });

  it("should not render badge when card is not owned and setting is disabled", () => {
    // showUnownedBadge is false by default
    const { container } = render(<CollectionCardOverlay cardId="card-1" />);

    expect(container.querySelector("button")).toBeNull();
  });

  it("should render unowned badge when setting is enabled", () => {
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      settings: {
        ...useCollectionStore.getState().settings,
        showUnownedBadge: true,
      },
    });

    render(<CollectionCardOverlay cardId="card-1" />);

    expect(screen.getByTitle("Add to collection")).toBeInTheDocument();
  });

  it("should cycle status on click: none -> owned", () => {
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      settings: {
        ...useCollectionStore.getState().settings,
        showUnownedBadge: true,
      },
    });

    render(<CollectionCardOverlay cardId="card-1" />);

    const badge = screen.getByTitle("Add to collection");
    fireEvent.click(badge);

    expect(useCollectionStore.getState().getStatus("card-1")).toBe("owned");
  });

  it("should cycle status on click: owned -> wishlist", () => {
    useCollectionStore.getState().setOwnership("card-1", "owned");

    render(<CollectionCardOverlay cardId="card-1" />);

    const badge = screen.getByTitle("In collection");
    fireEvent.click(badge);

    expect(useCollectionStore.getState().getStatus("card-1")).toBe("wishlist");
  });

  it("should cycle status on click: wishlist -> none", () => {
    useCollectionStore.getState().setOwnership("card-1", "wishlist");

    render(<CollectionCardOverlay cardId="card-1" />);

    const badge = screen.getByTitle("Wishlisted");
    fireEvent.click(badge);

    expect(useCollectionStore.getState().getStatus("card-1")).toBe("none");
  });
});
