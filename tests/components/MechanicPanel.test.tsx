/**
 * Tests that MechanicPanel defers loading game mechanic bundles until the
 * panel is first opened. The panel is always mounted (App renders it with
 * isOpen toggling), so loading on mount would dynamically import every
 * game bundle at startup and defeat lazy loading.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MechanicPanel } from "@/components/MechanicPanel/MechanicPanel";

const { loadAllMock, loadMock } = vi.hoisted(() => ({
  loadAllMock: vi.fn(),
  loadMock: vi.fn(),
}));

vi.mock("@/mechanics", () => ({
  mechanicRegistry: {
    loadAll: loadAllMock,
    load: loadMock,
  },
  useMechanicContext: () => ({
    mechanic: null,
    state: null,
    activateMechanic: vi.fn(),
    deactivateMechanic: vi.fn(),
  }),
}));

vi.mock("@/context/CollectionDataContext", () => ({
  useCollectionData: () => ({ cards: [] }),
}));

beforeEach(() => {
  loadAllMock.mockReset();
  loadAllMock.mockResolvedValue([]);
  loadMock.mockReset();
});

describe("MechanicPanel lazy loading", () => {
  it("does not load mechanics while the panel is closed", () => {
    render(<MechanicPanel isOpen={false} onClose={vi.fn()} />);

    expect(loadAllMock).not.toHaveBeenCalled();
  });

  it("loads mechanics once when the panel first opens, not again on reopen", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<MechanicPanel isOpen={false} onClose={onClose} />);

    expect(loadAllMock).not.toHaveBeenCalled();

    // Open the panel
    rerender(<MechanicPanel isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(loadAllMock).toHaveBeenCalledTimes(1);
    });

    // Panel content is rendered (the backdrop is aria-hidden, so include
    // hidden elements in the role query)
    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();

    // Close and reopen: mechanics must not be reloaded
    rerender(<MechanicPanel isOpen={false} onClose={onClose} />);
    rerender(<MechanicPanel isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
    });
    expect(loadAllMock).toHaveBeenCalledTimes(1);
  });
});
