/**
 * Tests for the mechanic registry activation lifecycle.
 *
 * Guards against a failed activation deactivating the current mechanic:
 * the previous mechanic must stay active and consistent when loading or
 * activating the new mechanic throws.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { mechanicRegistry } from "@/mechanics/registry";
import type { Mechanic, MechanicLifecycle } from "@/mechanics/types";

function makeMechanic(id: string, lifecycle: MechanicLifecycle = {}): Mechanic {
  return {
    manifest: {
      id,
      name: id,
      description: `Test mechanic ${id}`,
      icon: () => null,
      version: "1.0.0",
    },
    lifecycle,
    getState: () => ({ isActive: true }),
    subscribe: () => () => {},
    getCardActions: () => ({}),
  };
}

const TEST_IDS = ["mech-a", "mech-b"];

afterEach(() => {
  for (const id of TEST_IDS) {
    if (mechanicRegistry.has(id)) {
      mechanicRegistry.unregister(id);
    }
  }
});

describe("mechanicRegistry.activate", () => {
  it("keeps the previous mechanic active when the new mechanic's factory throws", async () => {
    const onDeactivateA = vi.fn();
    const mechA = makeMechanic("mech-a", { onDeactivate: onDeactivateA });
    mechanicRegistry.register("mech-a", () => Promise.resolve(mechA));
    mechanicRegistry.register("mech-b", () => {
      throw new Error("factory failed");
    });

    await mechanicRegistry.activate("mech-a");

    await expect(mechanicRegistry.activate("mech-b")).rejects.toThrow(
      "factory failed"
    );

    expect(mechanicRegistry.getActiveId()).toBe("mech-a");
    expect(mechanicRegistry.getActive()).toBe(mechA);
    expect(onDeactivateA).not.toHaveBeenCalled();
  });

  it("keeps the previous mechanic active when the new mechanic's onActivate throws", async () => {
    const onDeactivateA = vi.fn();
    const mechA = makeMechanic("mech-a", { onDeactivate: onDeactivateA });
    const mechB = makeMechanic("mech-b", {
      onActivate: () => {
        throw new Error("activation failed");
      },
    });
    mechanicRegistry.register("mech-a", () => Promise.resolve(mechA));
    mechanicRegistry.register("mech-b", () => Promise.resolve(mechB));

    await mechanicRegistry.activate("mech-a");

    await expect(mechanicRegistry.activate("mech-b")).rejects.toThrow(
      "activation failed"
    );

    expect(mechanicRegistry.getActiveId()).toBe("mech-a");
    expect(mechanicRegistry.getActive()).toBe(mechA);
    expect(onDeactivateA).not.toHaveBeenCalled();
  });

  it("deactivates the previous mechanic once the new one activates successfully", async () => {
    const onDeactivateA = vi.fn();
    const mechA = makeMechanic("mech-a", { onDeactivate: onDeactivateA });
    const mechB = makeMechanic("mech-b");
    mechanicRegistry.register("mech-a", () => Promise.resolve(mechA));
    mechanicRegistry.register("mech-b", () => Promise.resolve(mechB));

    await mechanicRegistry.activate("mech-a");
    await mechanicRegistry.activate("mech-b");

    expect(onDeactivateA).toHaveBeenCalledTimes(1);
    expect(mechanicRegistry.getActiveId()).toBe("mech-b");
  });
});
