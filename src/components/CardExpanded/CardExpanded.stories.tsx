/**
 * Stories for CardExpanded component.
 *
 * Expanded card view with animation from card position. Shows a detailed view
 * of a card with image gallery, rank display, and auto-discovered entity fields.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { withProviders } from "../../../.storybook/decorators";
import { CardExpanded } from "./CardExpanded";
import type { DisplayCard } from "@/hooks/useCollection";

const meta: Meta<typeof CardExpanded> = {
  title: "Components/CardExpanded",
  component: CardExpanded,
  decorators: [withProviders],
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the expanded view is open",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardExpanded>;

// Mock card data
const mockCard: DisplayCard = {
  id: "example-1",
  title: "Example Game Title",
  year: "2024",
  imageUrl: "https://picsum.photos/400/300",
  imageUrls: [
    "https://picsum.photos/400/300?1",
    "https://picsum.photos/400/300?2",
    "https://picsum.photos/400/300?3",
  ],
  logoUrl: "https://picsum.photos/200/100",
  summary:
    "An example game for testing the card expanded component. This is a longer description that shows how the summary field is displayed.",
  rank: 1,
  order: 1,
  device: "PC",
  detailUrl: "https://example.com/game",
  categoryTitle: "Action",
};

const mockCardSingleImage: DisplayCard = {
  id: "example-2",
  title: "Single Image Game",
  year: "2023",
  imageUrl: "https://picsum.photos/400/300",
  imageUrls: ["https://picsum.photos/400/300"],
  summary: "A game with only one image.",
  rank: 2,
  order: 2,
};

const mockCardWithVideo: DisplayCard = {
  id: "example-3",
  title: "Game With Video",
  year: "2023",
  imageUrl: "https://picsum.photos/400/300",
  imageUrls: [
    "https://picsum.photos/400/300",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // YouTube video URL
  ],
  summary: "A game with video content in the gallery.",
  rank: 3,
  order: 3,
};

/**
 * Open expanded view with default configuration.
 */
export const Open: Story = {
  render: function OpenExpanded() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Open Card Details
        </button>
        <CardExpanded
          card={mockCard}
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
        />
      </div>
    );
  },
};

/**
 * Expanded view with multiple images in gallery.
 */
export const WithMultipleImages: Story = {
  render: function MultiImageExpanded() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Open Card Details
        </button>
        <p style={{ margin: "0 2rem", color: "#888" }}>
          This card has multiple images. Use arrow keys or swipe to navigate.
        </p>
        <CardExpanded
          card={mockCard}
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
        />
      </div>
    );
  },
};

/**
 * Expanded view with single image.
 */
export const SingleImage: Story = {
  render: function SingleImageExpanded() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Open Card Details
        </button>
        <CardExpanded
          card={mockCardSingleImage}
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
        />
      </div>
    );
  },
};

/**
 * Expanded view with video content.
 */
export const WithVideo: Story = {
  render: function VideoExpanded() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Open Card Details
        </button>
        <p style={{ margin: "0 2rem", color: "#888" }}>
          This card includes a YouTube video in its gallery.
        </p>
        <CardExpanded
          card={mockCardWithVideo}
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
        />
      </div>
    );
  },
};

/**
 * Closed state - nothing visible.
 */
export const Closed: Story = {
  render: function ClosedExpanded() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Open Card Details
        </button>
        <p style={{ margin: "0 2rem", color: "#888" }}>
          Click the button to open the expanded card view.
        </p>
        <CardExpanded
          card={mockCard}
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
        />
      </div>
    );
  },
};
