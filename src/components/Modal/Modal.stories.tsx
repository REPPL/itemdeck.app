/**
 * Stories for Modal component.
 *
 * Modal handles focus trapping, keyboard navigation, and accessibility
 * for overlay dialogs.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal } from "./Modal";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    title: {
      control: "text",
      description: "Modal title for accessibility",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * Default modal with simple content.
 */
export const Default: Story = {
  render: function DefaultModal() {
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
          Open Modal
        </button>
        <Modal
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
          title="Example Modal"
        >
          <p>This is an example modal with some content.</p>
          <p style={{ marginTop: "1rem" }}>
            Press Escape or click outside to close.
          </p>
        </Modal>
      </>
    );
  },
};

/**
 * Modal with long content that scrolls.
 */
export const WithLongContent: Story = {
  render: function LongContentModal() {
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
          Open Modal
        </button>
        <Modal
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
          title="Long Content Modal"
        >
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} style={{ marginBottom: "1rem" }}>
              Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
          ))}
        </Modal>
      </>
    );
  },
};

/**
 * Modal with form content.
 */
export const WithForm: Story = {
  render: function FormModal() {
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
          Open Modal
        </button>
        <Modal
          isOpen={isOpen}
          onClose={() => { setIsOpen(false); }}
          title="Form Modal"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="name"
                style={{ display: "block", marginBottom: "0.5rem" }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="email"
                style={{ display: "block", marginBottom: "0.5rem" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Submit
            </button>
          </form>
        </Modal>
      </>
    );
  },
};
