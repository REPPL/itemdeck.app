/**
 * Tests for EditForm: untrusted `myVerdict` values.
 *
 * Entity schemas are `.loose()`, so a collection can ship a non-string
 * `myVerdict`. The form must coerce it the same way the collection display
 * layer does, otherwise the value fails local validation on Save and the
 * modal appears dead.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditForm } from "@/components/EditForm/EditForm";
import { useEditsStore } from "@/stores/editsStore";
import type { DisplayCard } from "@/hooks/useCollection";

function makeCard(overrides: Partial<DisplayCard> = {}): DisplayCard {
  return {
    id: "card-1",
    title: "Test Card",
    imageUrl: "https://example.com/image.jpg",
    imageUrls: ["https://example.com/image.jpg"],
    order: null,
    ...overrides,
  } as DisplayCard;
}

/** The "My Verdict" textarea. */
function getVerdictField(): HTMLTextAreaElement {
  return screen.getByLabelText("My Verdict") as HTMLTextAreaElement;
}

describe("EditForm untrusted myVerdict", () => {
  beforeEach(() => {
    useEditsStore.setState({ edits: {} });
  });

  it("saves and closes when the source myVerdict is an object", () => {
    const onClose = vi.fn();

    render(
      <EditForm
        card={makeCard({ myVerdict: { a: 1 } as unknown as string })}
        onClose={onClose}
      />
    );

    // The object must never reach the textarea as "[object Object]"
    expect(getVerdictField().value).toBe("");

    fireEvent.click(screen.getByText("Save Changes"));

    expect(onClose).toHaveBeenCalled();
  });

  it("round-trips a numeric myVerdict as its string form", () => {
    const onClose = vi.fn();

    render(
      <EditForm
        card={makeCard({ myVerdict: 42 as unknown as string })}
        onClose={onClose}
      />
    );

    expect(getVerdictField().value).toBe("42");

    fireEvent.click(screen.getByText("Save Changes"));

    expect(onClose).toHaveBeenCalled();
    expect(useEditsStore.getState().edits["card-1"]?.fields.myVerdict).toBe(
      "42"
    );
  });

  it("shows an error message when the verdict fails validation", () => {
    const onClose = vi.fn();

    render(<EditForm card={makeCard()} onClose={onClose} />);

    // Title is required, so an empty title surfaces its error span
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "" } });
    fireEvent.click(screen.getByText("Save Changes"));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });
});
