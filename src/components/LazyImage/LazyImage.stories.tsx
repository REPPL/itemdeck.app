/**
 * Stories for LazyImage component.
 *
 * LazyImage uses Intersection Observer to defer image loading until
 * the element approaches the viewport. Shows a shimmer animation
 * placeholder while loading.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { LazyImage } from "./LazyImage";

const meta: Meta<typeof LazyImage> = {
  title: "Components/LazyImage",
  component: LazyImage,
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
    blur: {
      control: "boolean",
      description: "Whether to blur during loading (progressive reveal)",
    },
    showSpinner: {
      control: "boolean",
      description: "Show loading spinner overlay",
    },
    placeholderColour: {
      control: "color",
      description: "Background colour for placeholder",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LazyImage>;

/**
 * Default lazy loading image.
 */
export const Default: Story = {
  args: {
    src: "https://picsum.photos/400/300",
    alt: "Lazy loaded image",
    blur: true,
    showSpinner: false,
  },
};

/**
 * Loading state with shimmer animation.
 * The placeholder shows while waiting for the image.
 */
export const Loading: Story = {
  args: {
    src: "https://httpstat.us/200?sleep=10000", // Slow loading URL
    alt: "Loading image",
    blur: true,
    showSpinner: false,
  },
};

/**
 * With loading spinner overlay.
 */
export const WithSpinner: Story = {
  args: {
    src: "https://httpstat.us/200?sleep=10000", // Slow loading URL
    alt: "Image with spinner",
    blur: true,
    showSpinner: true,
  },
};

/**
 * Error state when image fails to load.
 */
export const Error: Story = {
  args: {
    src: "https://invalid-url-that-will-fail.example/image.jpg",
    alt: "Failed image",
    blur: true,
    showSpinner: false,
  },
};

/**
 * With fallback URL - uses fallback when primary fails.
 */
export const WithFallback: Story = {
  args: {
    src: "https://invalid-url-that-will-fail.example/image.jpg",
    fallbackSrc: "https://picsum.photos/400/300",
    alt: "Image with fallback",
    blur: true,
    showSpinner: false,
  },
};

/**
 * Custom placeholder colour.
 */
export const CustomPlaceholder: Story = {
  args: {
    src: "https://httpstat.us/200?sleep=5000",
    alt: "Custom placeholder",
    placeholderColour: "#3b82f6",
    blur: true,
    showSpinner: false,
  },
};

/**
 * Without blur effect - instant reveal on load.
 */
export const NoBlur: Story = {
  args: {
    src: "https://picsum.photos/400/300",
    alt: "No blur image",
    blur: false,
    showSpinner: false,
  },
};
