/**
 * Tests for useGridNavigation hook.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGridNavigation } from "@/hooks/useGridNavigation";

describe("useGridNavigation", () => {
  const defaultProps = {
    totalItems: 9, // 3x3 grid
    columns: 3,
    onSelect: vi.fn(),
  };

  it("initializes with focusedIndex of 0", () => {
    const { result } = renderHook(() => useGridNavigation(defaultProps));

    expect(result.current.focusedIndex).toBe(0);
  });

  it("returns tabIndex 0 for focused item, -1 for others", () => {
    const { result } = renderHook(() => useGridNavigation(defaultProps));

    expect(result.current.getTabIndex(0)).toBe(0);
    expect(result.current.getTabIndex(1)).toBe(-1);
    expect(result.current.getTabIndex(2)).toBe(-1);
  });

  it("allows setting focusedIndex programmatically", () => {
    const { result } = renderHook(() => useGridNavigation(defaultProps));

    act(() => {
      result.current.setFocusedIndex(5);
    });

    expect(result.current.focusedIndex).toBe(5);
    expect(result.current.getTabIndex(5)).toBe(0);
    expect(result.current.getTabIndex(0)).toBe(-1);
  });

  describe("keyboard navigation", () => {
    it("moves right on ArrowRight", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowRight",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(1);
    });

    it("does not move right at last column", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.setFocusedIndex(8); // Last item
      });

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowRight",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(8);
    });

    it("moves left on ArrowLeft", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.setFocusedIndex(5);
      });

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowLeft",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(4);
    });

    it("does not move left at first item", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowLeft",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });

    it("moves down on ArrowDown", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowDown",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(3); // Next row
    });

    it("does not move down at last row", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.setFocusedIndex(7); // Second to last row, middle
      });

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowDown",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      // Should stay at 7 since moving down would go past totalItems
      expect(result.current.focusedIndex).toBe(7);
    });

    it("moves up on ArrowUp", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.setFocusedIndex(5);
      });

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowUp",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(2); // Previous row
    });

    it("does not move up at first row", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowUp",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });

    it("moves to first item on Home", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.setFocusedIndex(7);
      });

      act(() => {
        result.current.handleKeyDown({
          key: "Home",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });

    it("moves to last item on End", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: "End",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(8);
    });

    it("calls onSelect with focusedIndex on Enter", () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useGridNavigation({ ...defaultProps, onSelect })
      );

      act(() => {
        result.current.setFocusedIndex(4);
      });

      act(() => {
        result.current.handleKeyDown({
          key: "Enter",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onSelect).toHaveBeenCalledWith(4);
    });

    it("calls onSelect with focusedIndex on Space", () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useGridNavigation({ ...defaultProps, onSelect })
      );

      act(() => {
        result.current.setFocusedIndex(2);
      });

      act(() => {
        result.current.handleKeyDown({
          key: " ",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onSelect).toHaveBeenCalledWith(2);
    });

    it("prevents default for handled keys", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));
      const preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowRight",
          preventDefault,
        } as unknown as React.KeyboardEvent);
      });

      expect(preventDefault).toHaveBeenCalled();
    });

    it("does not prevent default for unhandled keys", () => {
      const { result } = renderHook(() => useGridNavigation(defaultProps));
      const preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown({
          key: "a",
          preventDefault,
        } as unknown as React.KeyboardEvent);
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("enabled state", () => {
    it("returns -1 for all tabIndex when disabled", () => {
      const { result } = renderHook(() =>
        useGridNavigation({ ...defaultProps, enabled: false })
      );

      expect(result.current.getTabIndex(0)).toBe(-1);
      expect(result.current.getTabIndex(1)).toBe(-1);
    });

    it("does not handle keys when disabled", () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useGridNavigation({ ...defaultProps, onSelect, enabled: false })
      );

      act(() => {
        result.current.handleKeyDown({
          key: "Enter",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles empty grid", () => {
      const { result } = renderHook(() =>
        useGridNavigation({ ...defaultProps, totalItems: 0 })
      );

      expect(result.current.focusedIndex).toBe(0);

      act(() => {
        result.current.handleKeyDown({
          key: "ArrowRight",
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });

    it("clamps focusedIndex when totalItems decreases", () => {
      const { result, rerender } = renderHook(
        ({ totalItems }) => useGridNavigation({ ...defaultProps, totalItems }),
        { initialProps: { totalItems: 9 } }
      );

      act(() => {
        result.current.setFocusedIndex(8);
      });

      expect(result.current.focusedIndex).toBe(8);

      rerender({ totalItems: 5 });

      expect(result.current.focusedIndex).toBe(4); // Clamped to new max
    });
  });
});
