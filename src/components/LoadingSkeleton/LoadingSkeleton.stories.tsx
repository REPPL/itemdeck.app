/**
 * Stories for LoadingSkeleton component.
 *
 * LoadingSkeleton displays animated placeholder shapes while content is loading.
 * Uses CSS animation for a subtle shimmer effect.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingSkeleton } from "./LoadingSkeleton";

const meta: Meta<typeof LoadingSkeleton> = {
  title: "Components/LoadingSkeleton",
  component: LoadingSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    count: {
      control: { type: "range", min: 1, max: 20, step: 1 },
      description: "Number of skeleton cards to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSkeleton>;

/**
 * Default skeleton with 6 cards.
 */
export const Default: Story = {
  args: {
    count: 6,
  },
};

/**
 * Custom count - fewer cards.
 */
export const FewCards: Story = {
  args: {
    count: 3,
  },
};

/**
 * Custom count - more cards.
 */
export const ManyCards: Story = {
  args: {
    count: 12,
  },
};

/**
 * Single skeleton card.
 */
export const SingleCard: Story = {
  args: {
    count: 1,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "300px" }}>
        <Story />
      </div>
    ),
  ],
};
