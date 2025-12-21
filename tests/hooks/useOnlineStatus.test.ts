/**
 * Tests for useOnlineStatus hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus, useOnlineStatusLegacy } from "@/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(window, "navigator", {
      value: { ...originalNavigator, onLine: true },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("returns true when online", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      writable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false when offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      writable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("updates when going offline", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window.navigator, "onLine", {
        value: false,
        writable: true,
      });
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("updates when coming online", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      writable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window.navigator, "onLine", {
        value: true,
        writable: true,
      });
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });
});

describe("useOnlineStatusLegacy", () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    Object.defineProperty(window, "navigator", {
      value: { ...originalNavigator, onLine: true },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("returns initial online status", () => {
    const { result } = renderHook(() => useOnlineStatusLegacy());
    expect(result.current).toBe(true);
  });

  it("responds to offline event", () => {
    const { result } = renderHook(() => useOnlineStatusLegacy());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("responds to online event", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      writable: true,
    });

    const { result } = renderHook(() => useOnlineStatusLegacy());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useOnlineStatusLegacy());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
