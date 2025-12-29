/**
 * Stories for Toast component.
 *
 * Toast shows a brief notification message that auto-dismisses.
 * Used for quick feedback after actions.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

const meta: Meta<typeof Toast> = {
  title: "Components/Toast",
  component: Toast,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["info", "success", "warning"],
      description: "Toast type for styling",
    },
    duration: {
      control: { type: "range", min: 1000, max: 10000, step: 500 },
      description: "Auto-dismiss duration in ms",
    },
    message: {
      control: "text",
      description: "Message to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

/**
 * Info toast - default informational message.
 */
export const Info: Story = {
  render: function InfoToast() {
    const [visible, setVisible] = useState(true);
    return (
      <>
        <button
          onClick={() => { setVisible(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Show Info Toast
        </button>
        <Toast
          visible={visible}
          message="Settings have been updated"
          type="info"
          duration={3000}
          onHide={() => { setVisible(false); }}
        />
      </>
    );
  },
};

/**
 * Success toast - positive feedback.
 */
export const Success: Story = {
  render: function SuccessToast() {
    const [visible, setVisible] = useState(true);
    return (
      <>
        <button
          onClick={() => { setVisible(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Show Success Toast
        </button>
        <Toast
          visible={visible}
          message="Changes saved successfully!"
          type="success"
          duration={3000}
          onHide={() => { setVisible(false); }}
        />
      </>
    );
  },
};

/**
 * Warning toast - cautionary message.
 */
export const Warning: Story = {
  render: function WarningToast() {
    const [visible, setVisible] = useState(true);
    return (
      <>
        <button
          onClick={() => { setVisible(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Show Warning Toast
        </button>
        <Toast
          visible={visible}
          message="Connection is slow - some features may be delayed"
          type="warning"
          duration={4000}
          onHide={() => { setVisible(false); }}
        />
      </>
    );
  },
};

/**
 * Interactive demo with all toast types.
 */
export const AllTypes: Story = {
  render: function AllTypesToast() {
    const [toasts, setToasts] = useState<
      { id: number; type: "info" | "success" | "warning"; message: string }[]
    >([]);
    let counter = 0;

    const showToast = (type: "info" | "success" | "warning", message: string) => {
      const id = counter++;
      setToasts((prev) => [...prev, { id, type, message }]);
    };

    const hideToast = (id: number) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => { showToast("info", "Information message"); }}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Info Toast
          </button>
          <button
            onClick={() => { showToast("success", "Operation completed!"); }}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Success Toast
          </button>
          <button
            onClick={() => { showToast("warning", "Please check your input"); }}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Warning Toast
          </button>
        </div>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            visible={true}
            message={toast.message}
            type={toast.type}
            duration={3000}
            onHide={() => { hideToast(toast.id); }}
          />
        ))}
      </div>
    );
  },
};

/**
 * Long duration toast.
 */
export const LongDuration: Story = {
  render: function LongToast() {
    const [visible, setVisible] = useState(true);
    return (
      <>
        <button
          onClick={() => { setVisible(true); }}
          style={{
            padding: "0.5rem 1rem",
            margin: "2rem",
            cursor: "pointer",
          }}
        >
          Show Long Toast (10s)
        </button>
        <Toast
          visible={visible}
          message="This toast will stay visible for 10 seconds"
          type="info"
          duration={10000}
          onHide={() => { setVisible(false); }}
        />
      </>
    );
  },
};
