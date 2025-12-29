/**
 * Stories for ConfirmDialog component.
 *
 * ConfirmDialog is a reusable confirmation dialog with support for
 * warning and danger variants.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { withProviders } from "../../../.storybook/decorators";
import { ConfirmDialog } from "./ConfirmDialog";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
  decorators: [withProviders],
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["warning", "danger"],
      description: "Visual variant - danger uses red accent",
    },
    confirmLabel: {
      control: "text",
      description: "Label for the confirm button",
    },
    cancelLabel: {
      control: "text",
      description: "Label for the cancel button",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

/**
 * Warning variant - default confirmation dialog.
 */
export const Warning: Story = {
  render: function WarningDialog() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Open Warning Dialog
        </button>
        <ConfirmDialog
          isOpen={isOpen}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action? This can be undone later."
          variant="warning"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={() => { setIsOpen(false); }}
          onCancel={() => { setIsOpen(false); }}
        />
      </>
    );
  },
};

/**
 * Danger variant - for destructive actions.
 */
export const Danger: Story = {
  render: function DangerDialog() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Open Danger Dialog
        </button>
        <ConfirmDialog
          isOpen={isOpen}
          title="Delete Item"
          message={
            <>
              <p>Are you sure you want to delete this item?</p>
              <p style={{ marginTop: "0.5rem", fontWeight: "bold" }}>
                This action cannot be undone.
              </p>
            </>
          }
          variant="danger"
          confirmLabel="Delete"
          cancelLabel="Keep"
          onConfirm={() => { setIsOpen(false); }}
          onCancel={() => { setIsOpen(false); }}
        />
      </>
    );
  },
};

/**
 * Custom labels for specific use cases.
 */
export const CustomLabels: Story = {
  render: function CustomLabelDialog() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Open Custom Dialog
        </button>
        <ConfirmDialog
          isOpen={isOpen}
          title="Clear Cache"
          message="This will clear all cached data. You may need to reload the page after this action."
          variant="warning"
          confirmLabel="Clear Cache"
          cancelLabel="Not Now"
          onConfirm={() => { setIsOpen(false); }}
          onCancel={() => { setIsOpen(false); }}
        />
      </>
    );
  },
};

/**
 * Reset confirmation example.
 */
export const ResetConfirmation: Story = {
  render: function ResetDialog() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <button
          onClick={() => { setIsOpen(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Open Reset Dialog
        </button>
        <ConfirmDialog
          isOpen={isOpen}
          title="Reset Settings"
          message="This will reset all settings to their default values. Your saved data will not be affected."
          variant="danger"
          confirmLabel="Reset All"
          cancelLabel="Cancel"
          onConfirm={() => { setIsOpen(false); }}
          onCancel={() => { setIsOpen(false); }}
        />
      </>
    );
  },
};
