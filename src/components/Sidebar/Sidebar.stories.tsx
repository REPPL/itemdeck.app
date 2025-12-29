/**
 * Stories for Sidebar component.
 *
 * Sidebar that grows from the menu button position.
 * White semi-transparent with backdrop blur, full height of the screen.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the sidebar is open",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

/**
 * Open sidebar state.
 */
export const Open: Story = {
  render: function OpenSidebar() {
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
          Open Sidebar
        </button>
        <Sidebar isOpen={isOpen} onClose={() => { setIsOpen(false); }} />
      </div>
    );
  },
};

/**
 * Closed sidebar state.
 */
export const Closed: Story = {
  render: function ClosedSidebar() {
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
          Open Sidebar
        </button>
        <p style={{ color: "#888", margin: "2rem" }}>
          Click the button above to open the sidebar.
        </p>
        <Sidebar isOpen={isOpen} onClose={() => { setIsOpen(false); }} />
      </div>
    );
  },
};

/**
 * Interactive toggle demonstration.
 */
export const Interactive: Story = {
  render: function InteractiveSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
        <div style={{ padding: "2rem" }}>
          <button
            onClick={() => { setIsOpen(!isOpen); }}
            style={{
              padding: "0.5rem 1rem",
              cursor: "pointer",
              background: isOpen ? "#666" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {isOpen ? "Close Sidebar" : "Open Sidebar"}
          </button>
          <p style={{ color: "#888", marginTop: "1rem" }}>
            Current state: {isOpen ? "Open" : "Closed"}
          </p>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Click outside the sidebar or the button to close it.
          </p>
        </div>
        <Sidebar isOpen={isOpen} onClose={() => { setIsOpen(false); }} />
      </div>
    );
  },
};
