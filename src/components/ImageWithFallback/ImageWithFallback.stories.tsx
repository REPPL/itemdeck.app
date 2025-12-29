/**
 * Stories for ImageWithFallback component.
 *
 * ImageWithFallback displays an image with a coloured placeholder background.
 * The placeholder is generated from the title and provides visual continuity
 * while images load or when they fail.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImageWithFallback } from "./ImageWithFallback";

const meta: Meta<typeof ImageWithFallback> = {
  title: "Components/ImageWithFallback",
  component: ImageWithFallback,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px", height: "200px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    loading: {
      control: "select",
      options: ["lazy", "eager"],
      description: "Loading attribute for lazy loading",
    },
    isPlaceholderUrl: {
      control: "boolean",
      description: "Whether this is a placeholder URL (skip loading if true)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageWithFallback>;

/**
 * Default state with a working image URL.
 */
export const Default: Story = {
  args: {
    src: "https://picsum.photos/400/300",
    alt: "Example image",
    title: "Example Card",
    loading: "lazy",
    isPlaceholderUrl: false,
  },
};

/**
 * Loading state - shows the coloured placeholder while image loads.
 * Use a slow-loading or non-existent image to observe the placeholder.
 */
export const Loading: Story = {
  args: {
    src: "https://httpstat.us/200?sleep=10000", // Slow loading URL
    alt: "Loading image",
    title: "Loading Example",
    loading: "lazy",
    isPlaceholderUrl: false,
  },
};

/**
 * Error state - shows when the image fails to load.
 * The coloured placeholder remains visible.
 */
export const Error: Story = {
  args: {
    src: "https://invalid-url-that-will-fail.example/image.jpg",
    alt: "Failed image",
    title: "Error Example",
    loading: "lazy",
    isPlaceholderUrl: false,
  },
};

/**
 * With fallback URL - attempts fallback when primary fails.
 */
export const WithFallback: Story = {
  args: {
    src: "https://invalid-url-that-will-fail.example/image.jpg",
    fallbackSrc: "https://picsum.photos/400/300",
    alt: "Image with fallback",
    title: "Fallback Example",
    loading: "lazy",
    isPlaceholderUrl: false,
  },
};

/**
 * Placeholder URL mode - skips image loading entirely.
 * Only shows the coloured background placeholder.
 */
export const PlaceholderOnly: Story = {
  args: {
    src: "https://example.com/placeholder.png",
    alt: "Placeholder only",
    title: "Placeholder Mode",
    loading: "lazy",
    isPlaceholderUrl: true,
  },
};

/**
 * Different titles generate different placeholder colours.
 */
export const ColourVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      {["Adventure Game", "Racing Game", "Puzzle Game", "RPG", "Shooter"].map(
        (title) => (
          <div key={title} style={{ width: "150px", height: "100px" }}>
            <ImageWithFallback
              src=""
              alt={title}
              title={title}
              isPlaceholderUrl={true}
            />
          </div>
        )
      )}
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
