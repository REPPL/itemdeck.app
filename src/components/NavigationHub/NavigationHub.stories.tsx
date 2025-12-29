/**
 * Stories for NavigationHub component.
 *
 * NavigationHub is a collapsible navigation hub with staggered expand/collapse animation.
 * Always visible: Help (bottom) + Navigation toggle (above Help).
 * Expandable: Settings, Games, Search, View (revealed above Navigation).
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { withProviders } from "../../../.storybook/decorators";
import { NavigationHub } from "./NavigationHub";

const meta: Meta<typeof NavigationHub> = {
  title: "Components/NavigationHub",
  component: NavigationHub,
  decorators: [withProviders],
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Whether all buttons should be disabled",
    },
    showHelpButton: {
      control: "boolean",
      description: "Whether the Help button is visible",
    },
    showSettingsButton: {
      control: "boolean",
      description: "Whether the Settings button is visible",
    },
    showSearchBar: {
      control: "boolean",
      description: "Whether the Search button is visible",
    },
    showViewButton: {
      control: "boolean",
      description: "Whether the View button is visible",
    },
    hidden: {
      control: "boolean",
      description: "Whether to hide the entire hub",
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationHub>;

// Default props with no-op handlers
const defaultArgs = {
  onHelpClick: () => { console.log("Help clicked"); },
  onSearchClick: () => { console.log("Search clicked"); },
  onGamesClick: () => { console.log("Games clicked"); },
  onSettingsClick: () => { console.log("Settings clicked"); },
  onViewClick: () => { console.log("View clicked"); },
  disabled: false,
  showHelpButton: true,
  showSettingsButton: true,
  showSearchBar: true,
  showViewButton: true,
  hidden: false,
};

// Wrapper for consistent positioning
const HubWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      minHeight: "100vh",
      background: "#1a1a1a",
      position: "relative",
    }}
  >
    <div style={{ padding: "2rem", color: "#888" }}>
      <p>Click the menu (hamburger) button to expand the navigation hub.</p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
        The hub appears in the bottom-right corner of the screen.
      </p>
    </div>
    {children}
  </div>
);

/**
 * Collapsed state - only Help and Navigation toggle visible.
 */
export const Collapsed: Story = {
  args: defaultArgs,
  render: (args) => (
    <HubWrapper>
      <NavigationHub {...args} />
    </HubWrapper>
  ),
};

/**
 * Expanded state - all buttons visible.
 * Note: The expanded state is controlled by the settings store.
 */
export const Expanded: Story = {
  args: defaultArgs,
  render: (args) => (
    <HubWrapper>
      <NavigationHub {...args} />
    </HubWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Click the navigation toggle to expand. The expanded state is controlled by the settings store.",
      },
    },
  },
};

/**
 * Disabled state - all buttons are disabled.
 */
export const Disabled: Story = {
  args: {
    ...defaultArgs,
    disabled: true,
  },
  render: (args) => (
    <HubWrapper>
      <NavigationHub {...args} />
    </HubWrapper>
  ),
};

/**
 * Minimal configuration - only navigation toggle.
 */
export const MinimalButtons: Story = {
  args: {
    ...defaultArgs,
    showHelpButton: false,
    showSettingsButton: false,
    showSearchBar: false,
    showViewButton: false,
  },
  render: (args) => (
    <HubWrapper>
      <NavigationHub {...args} />
    </HubWrapper>
  ),
};

/**
 * Hidden state - entire hub is hidden.
 */
export const Hidden: Story = {
  args: {
    ...defaultArgs,
    hidden: true,
  },
  render: (args) => (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a1a",
        padding: "2rem",
        color: "#888",
      }}
    >
      <p>The NavigationHub is hidden (hidden=true).</p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
        This is used when search or view overlays are open.
      </p>
      <NavigationHub {...args} />
    </div>
  ),
};

/**
 * Custom button configuration.
 */
export const CustomConfiguration: Story = {
  args: {
    ...defaultArgs,
    showHelpButton: true,
    showSettingsButton: true,
    showSearchBar: false,
    showViewButton: false,
  },
  render: (args) => (
    <HubWrapper>
      <NavigationHub {...args} />
    </HubWrapper>
  ),
};
