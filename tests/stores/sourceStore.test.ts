/**
 * Tests for source management store.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

// Import after mocking localStorage
import { useSourceStore } from "@/stores/sourceStore";

describe("sourceStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    act(() => {
      useSourceStore.setState({
        sources: [
          {
            id: "local",
            url: "/data",
            name: "Local Collection",
            addedAt: new Date(0),
            isBuiltIn: true,
          },
        ],
        activeSourceId: "local",
        defaultSourceId: "local",
      });
    });
  });

  describe("initial state", () => {
    it("should have local source by default", () => {
      const state = useSourceStore.getState();
      expect(state.sources).toHaveLength(1);
      expect(state.sources[0].id).toBe("local");
      expect(state.sources[0].url).toBe("/data");
      expect(state.sources[0].isBuiltIn).toBe(true);
    });

    it("should have local source as active and default", () => {
      const state = useSourceStore.getState();
      expect(state.activeSourceId).toBe("local");
      expect(state.defaultSourceId).toBe("local");
    });
  });

  describe("addSource", () => {
    it("should add a new source", () => {
      const id = useSourceStore.getState().addSource("https://example.com/data", "Example");

      const state = useSourceStore.getState();
      expect(state.sources).toHaveLength(2);
      expect(state.sources[1].id).toBe(id);
      expect(state.sources[1].url).toBe("https://example.com/data");
      expect(state.sources[1].name).toBe("Example");
    });

    it("should strip trailing slashes from URLs", () => {
      const id = useSourceStore.getState().addSource("https://example.com/data/");

      const state = useSourceStore.getState();
      const source = state.sources.find((s) => s.id === id);
      expect(source?.url).toBe("https://example.com/data");
    });

    it("should set addedAt timestamp", () => {
      const before = Date.now();
      const id = useSourceStore.getState().addSource("https://example.com/data");
      const after = Date.now();

      const state = useSourceStore.getState();
      const source = state.sources.find((s) => s.id === id);
      expect(source?.addedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(source?.addedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it("should generate unique IDs", () => {
      const id1 = useSourceStore.getState().addSource("https://example1.com");
      const id2 = useSourceStore.getState().addSource("https://example2.com");

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^src_/);
      expect(id2).toMatch(/^src_/);
    });
  });

  describe("removeSource", () => {
    it("should remove a source by ID", () => {
      const id = useSourceStore.getState().addSource("https://example.com");

      expect(useSourceStore.getState().sources).toHaveLength(2);

      useSourceStore.getState().removeSource(id);

      expect(useSourceStore.getState().sources).toHaveLength(1);
      expect(useSourceStore.getState().sources[0].id).toBe("local");
    });

    it("should not remove built-in sources", () => {
      useSourceStore.getState().removeSource("local");

      expect(useSourceStore.getState().sources).toHaveLength(1);
      expect(useSourceStore.getState().sources[0].id).toBe("local");
    });

    it("should switch active source when removing active source", () => {
      const id = useSourceStore.getState().addSource("https://example.com");
      useSourceStore.getState().setActiveSource(id);

      expect(useSourceStore.getState().activeSourceId).toBe(id);

      useSourceStore.getState().removeSource(id);

      expect(useSourceStore.getState().activeSourceId).toBe("local");
    });

    it("should update default source when removing default source", () => {
      const id = useSourceStore.getState().addSource("https://example.com");
      useSourceStore.getState().setDefaultSource(id);

      expect(useSourceStore.getState().defaultSourceId).toBe(id);

      useSourceStore.getState().removeSource(id);

      expect(useSourceStore.getState().defaultSourceId).toBe("local");
    });
  });

  describe("updateSource", () => {
    it("should update source name", () => {
      const id = useSourceStore.getState().addSource("https://example.com", "Old Name");

      useSourceStore.getState().updateSource(id, { name: "New Name" });

      const source = useSourceStore.getState().getSource(id);
      expect(source?.name).toBe("New Name");
    });

    it("should update source URL", () => {
      const id = useSourceStore.getState().addSource("https://example.com");

      useSourceStore.getState().updateSource(id, { url: "https://new-url.com" });

      const source = useSourceStore.getState().getSource(id);
      expect(source?.url).toBe("https://new-url.com");
    });

    it("should strip trailing slashes when updating URL", () => {
      const id = useSourceStore.getState().addSource("https://example.com");

      useSourceStore.getState().updateSource(id, { url: "https://new-url.com/" });

      const source = useSourceStore.getState().getSource(id);
      expect(source?.url).toBe("https://new-url.com");
    });
  });

  describe("setActiveSource", () => {
    it("should set the active source", () => {
      const id = useSourceStore.getState().addSource("https://example.com");

      useSourceStore.getState().setActiveSource(id);

      expect(useSourceStore.getState().activeSourceId).toBe(id);
    });

    it("should allow setting active source to null", () => {
      useSourceStore.getState().setActiveSource(null);

      expect(useSourceStore.getState().activeSourceId).toBe(null);
    });
  });

  describe("setDefaultSource", () => {
    it("should set the default source", () => {
      const id = useSourceStore.getState().addSource("https://example.com");

      useSourceStore.getState().setDefaultSource(id);

      expect(useSourceStore.getState().defaultSourceId).toBe(id);
    });
  });

  describe("getActiveSourceUrl", () => {
    it("should return the active source URL", () => {
      const url = useSourceStore.getState().getActiveSourceUrl();
      expect(url).toBe("/data");
    });

    it("should return URL for non-local active source", () => {
      const id = useSourceStore.getState().addSource("https://example.com/data");
      useSourceStore.getState().setActiveSource(id);

      const url = useSourceStore.getState().getActiveSourceUrl();
      expect(url).toBe("https://example.com/data");
    });

    it("should return null when no active source", () => {
      useSourceStore.getState().setActiveSource("non-existent");

      const url = useSourceStore.getState().getActiveSourceUrl();
      expect(url).toBe(null);
    });
  });

  describe("getSource", () => {
    it("should return source by ID", () => {
      const id = useSourceStore.getState().addSource("https://example.com", "Test");

      const source = useSourceStore.getState().getSource(id);
      expect(source).toBeDefined();
      expect(source?.url).toBe("https://example.com");
      expect(source?.name).toBe("Test");
    });

    it("should return undefined for non-existent ID", () => {
      const source = useSourceStore.getState().getSource("non-existent");
      expect(source).toBeUndefined();
    });
  });
});
