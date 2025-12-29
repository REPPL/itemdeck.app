/**
 * Stories for Card component.
 *
 * Card component with 3D flip animation. Shows back face (logo + year) by default.
 * When flipped, reveals front face (image + title overlay).
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { withProviders } from "../../../.storybook/decorators";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  decorators: [withProviders],
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    isFlipped: {
      control: "boolean",
      description: "Whether the card is flipped to show front",
    },
    showRankBadge: {
      control: "boolean",
      description: "Whether to show the rank badge",
    },
    showFooterBadge: {
      control: "boolean",
      description: "Whether to show the footer badge (device/platform)",
    },
    cardSize: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "Card size preset for responsive adjustments",
    },
    cardBackDisplay: {
      control: "select",
      options: ["logo", "image", "colour"],
      description: "What to display on card back",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// Mock card data
const mockCard = {
  id: "example-1",
  title: "Example Game Title",
  year: "2024",
  imageUrl: "https://picsum.photos/400/300",
  imageUrls: ["https://picsum.photos/400/300"],
  logoUrl: "https://picsum.photos/200/100",
  summary: "An example game for testing the card component.",
  rank: 1,
  device: "PC",
};

const mockCardNoYear = {
  id: "example-2",
  title: "Game Without Year",
  imageUrl: "https://picsum.photos/400/301",
  imageUrls: ["https://picsum.photos/400/301"],
  rank: 5,
};

const mockCardNoRank = {
  id: "example-3",
  title: "Unranked Game",
  year: "2023",
  imageUrl: "https://picsum.photos/400/302",
  imageUrls: ["https://picsum.photos/400/302"],
};

/**
 * Default card showing back face.
 */
export const Default: Story = {
  render: function DefaultCard() {
    const [isFlipped, setIsFlipped] = useState(false);
    return (
      <Card
        card={mockCard}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={true}
        showFooterBadge={true}
        cardSize="medium"
      />
    );
  },
};

/**
 * Card flipped to show front face.
 */
export const Flipped: Story = {
  render: function FlippedCard() {
    const [isFlipped, setIsFlipped] = useState(true);
    return (
      <Card
        card={mockCard}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={true}
        showFooterBadge={true}
        cardSize="medium"
      />
    );
  },
};

/**
 * Card with rank badge displayed.
 */
export const WithRank: Story = {
  render: function WithRankCard() {
    const [isFlipped, setIsFlipped] = useState(true);
    return (
      <Card
        card={mockCard}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={true}
        showFooterBadge={false}
        cardSize="medium"
      />
    );
  },
};

/**
 * Card with device badge displayed.
 */
export const WithDeviceBadge: Story = {
  render: function WithDeviceCard() {
    const [isFlipped, setIsFlipped] = useState(true);
    return (
      <Card
        card={mockCard}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={false}
        showFooterBadge={true}
        cardSize="medium"
      />
    );
  },
};

/**
 * Card without year field.
 */
export const WithoutYear: Story = {
  render: function WithoutYearCard() {
    const [isFlipped, setIsFlipped] = useState(true);
    return (
      <Card
        card={mockCardNoYear}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={true}
        showFooterBadge={false}
        cardSize="medium"
      />
    );
  },
};

/**
 * Card without rank (shows placeholder).
 */
export const WithoutRank: Story = {
  render: function WithoutRankCard() {
    const [isFlipped, setIsFlipped] = useState(true);
    return (
      <Card
        card={mockCardNoRank}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={true}
        showFooterBadge={false}
        rankPlaceholderText="?"
        cardSize="medium"
      />
    );
  },
};

/**
 * Small card size.
 */
export const SmallSize: Story = {
  render: function SmallCard() {
    const [isFlipped, setIsFlipped] = useState(true);
    return (
      <Card
        card={mockCard}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={true}
        showFooterBadge={true}
        cardSize="small"
      />
    );
  },
};

/**
 * Large card size.
 */
export const LargeSize: Story = {
  render: function LargeCard() {
    const [isFlipped, setIsFlipped] = useState(true);
    return (
      <Card
        card={mockCard}
        isFlipped={isFlipped}
        onFlip={() => { setIsFlipped(!isFlipped); }}
        showRankBadge={true}
        showFooterBadge={true}
        cardSize="large"
      />
    );
  },
};

/**
 * Multiple cards in a row for comparison.
 */
export const MultipleCards: Story = {
  render: function MultiCards() {
    const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
    const cards = [
      { ...mockCard, id: "card-1", title: "Game One", rank: 1 },
      { ...mockCard, id: "card-2", title: "Game Two", rank: 2 },
      { ...mockCard, id: "card-3", title: "Game Three", rank: 3 },
    ];

    const toggleFlip = (id: string) => {
      setFlippedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    };

    return (
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            isFlipped={flippedIds.has(card.id)}
            onFlip={() => { toggleFlip(card.id); }}
            showRankBadge={true}
            showFooterBadge={false}
            cardSize="medium"
          />
        ))}
      </div>
    );
  },
  parameters: {
    layout: "padded",
  },
};
