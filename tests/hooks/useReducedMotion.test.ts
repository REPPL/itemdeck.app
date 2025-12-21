/**
 * Tests for useReducedMotion hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

describe("useReducedMotion", () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

  beforeEach(() => {
    changeHandler = null;

    mockMatchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, handler: EventListener) => {
        if (event === "change") {
          changeHandler = handler as (event: MediaQueryListEvent) => void;
        }
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when reduced motion is not preferred", () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it("returns true when reduced motion is preferred", () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it("updates when preference changes", () => {
    const addEventListener = vi.fn((event: string, handler: EventListener) => {
      if (event === "change") {
        changeHandler = handler as (event: MediaQueryListEvent) => void;
      }
    });

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener,
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Simulate preference change
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it("cleans up event listener on unmount", () => {
    const removeEventListener = vi.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener,
    });

    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("queries the correct media query", () => {
    renderHook(() => useReducedMotion());

    expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });
});
