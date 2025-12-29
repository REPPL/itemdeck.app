/**
 * Stories for CardGrid component.
 *
 * Grid component that displays cards in a responsive layout.
 * Uses absolute positioning with JS-calculated positions.
 * CSS transitions handle smooth animation on resize.
 *
 * Note: CardGrid depends heavily on CollectionDataContext for its data.
 * These stories demonstrate the component's visual states rather than
 * full functionality, which requires the complete application context.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { withProviders } from "../../../.storybook/decorators";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const meta: Meta = {
  title: "Components/CardGrid",
  decorators: [withProviders],
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj;

/**
 * Loading state - shows skeleton cards while data loads.
 *
 * CardGrid displays LoadingSkeleton internally when isLoading is true.
 */
export const Loading: Story = {
  render: () => (
    <div style={{ padding: "2rem" }}>
      <LoadingSkeleton count={8} />
    </div>
  ),
};

/**
 * Empty state - no cards to display.
 */
export const Empty: Story = {
  render: () => (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        color: "#888",
      }}
    >
      <p style={{ fontSize: "1.25rem" }}>No cards to display</p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
        This is shown when the collection is empty or all cards are filtered
        out.
      </p>
    </div>
  ),
};

/**
 * Error state - shows error message.
 */
export const Error: Story = {
  render: () => (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        color: "#f44336",
      }}
    >
      <p style={{ fontSize: "1.25rem" }}>Error: Failed to load collection</p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#888" }}>
        This is shown when the collection fails to load.
      </p>
    </div>
  ),
};

/**
 * Default grid placeholder.
 *
 * Note: For a fully functional CardGrid with real cards, the component
 * requires CollectionDataContext which provides card data. In Storybook,
 * we demonstrate the loading/empty/error states which are self-contained.
 */
export const Default: Story = {
  render: () => (
    <div style={{ padding: "2rem" }}>
      <p style={{ marginBottom: "1rem", color: "#888" }}>
        CardGrid requires CollectionDataContext for full functionality.
      </p>
      <p style={{ marginBottom: "2rem", color: "#666", fontSize: "0.9rem" }}>
        See the Card component stories for individual card rendering.
        Below is the loading skeleton that CardGrid shows while fetching data.
      </p>
      <LoadingSkeleton count={6} />
    </div>
  ),
};

/**
 * Grouped cards placeholder.
 *
 * When groupByField is set, CardGrid renders CardGroup components.
 */
export const Grouped: Story = {
  render: () => (
    <div style={{ padding: "2rem" }}>
      <p style={{ marginBottom: "1rem", color: "#888" }}>
        Grouped view organises cards by a field value (e.g., year, platform).
      </p>
      <div
        style={{
          border: "1px dashed #444",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ color: "#fff", marginBottom: "1rem" }}>2024</h3>
        <LoadingSkeleton count={3} />
      </div>
      <div
        style={{
          border: "1px dashed #444",
          borderRadius: "8px",
          padding: "1rem",
        }}
      >
        <h3 style={{ color: "#fff", marginBottom: "1rem" }}>2023</h3>
        <LoadingSkeleton count={3} />
      </div>
    </div>
  ),
};
