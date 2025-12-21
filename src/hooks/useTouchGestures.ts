/**
 * Touch gesture hooks for mobile interactions.
 *
 * Provides swipe, long-press, and tap detection with visual feedback.
 */

import { useCallback, useRef, useState, useEffect } from "react";

/**
 * Swipe direction.
 */
export type SwipeDirection = "left" | "right" | "up" | "down" | null;

/**
 * Touch gesture state.
 */
interface TouchState {
  /** Whether a touch is in progress */
  isTouching: boolean;
  /** Whether a long press is detected */
  isLongPress: boolean;
  /** Swipe direction (null if not swiping) */
  swipeDirection: SwipeDirection;
  /** Current touch position delta from start */
  delta: { x: number; y: number };
}

/**
 * Options for touch gesture detection.
 */
interface UseTouchGesturesOptions {
  /** Minimum distance for swipe detection (px) */
  swipeThreshold?: number;
  /** Duration for long press detection (ms) */
  longPressDelay?: number;
  /** Whether gestures are enabled */
  enabled?: boolean;
  /** Callback on tap (short press) */
  onTap?: () => void;
  /** Callback on long press */
  onLongPress?: () => void;
  /** Callback on swipe */
  onSwipe?: (direction: SwipeDirection) => void;
}

/**
 * Hook for detecting touch gestures.
 *
 * @param options - Configuration options
 * @returns Touch handlers and state
 *
 * @example
 * ```tsx
 * const { handlers, state } = useTouchGestures({
 *   onTap: () => flipCard(),
 *   onLongPress: () => selectCard(),
 *   onSwipe: (dir) => navigate(dir),
 * });
 *
 * return (
 *   <div {...handlers}>
 *     {state.isLongPress && <SelectionIndicator />}
 *   </div>
 * );
 * ```
 */
export function useTouchGestures(options: UseTouchGesturesOptions = {}) {
  const {
    swipeThreshold = 50,
    longPressDelay = 300,
    enabled = true,
    onTap,
    onLongPress,
    onSwipe,
  } = options;

  const [state, setState] = useState<TouchState>({
    isTouching: false,
    isLongPress: false,
    swipeDirection: null,
    delta: { x: 0, y: 0 },
  });

  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Provide haptic feedback if available
  const triggerHaptic = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;

      const touch = event.touches[0];
      if (!touch) return;

      startRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      movedRef.current = false;

      setState({
        isTouching: true,
        isLongPress: false,
        swipeDirection: null,
        delta: { x: 0, y: 0 },
      });

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (!movedRef.current) {
          setState((prev) => ({ ...prev, isLongPress: true }));
          triggerHaptic();
          onLongPress?.();
        }
      }, longPressDelay);
    },
    [enabled, longPressDelay, onLongPress, triggerHaptic]
  );

  // Touch move handler
  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;

      // Mark as moved if threshold exceeded
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        movedRef.current = true;
        clearLongPressTimer();
      }

      // Determine swipe direction
      let direction: SwipeDirection = null;
      if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? "right" : "left";
        } else {
          direction = deltaY > 0 ? "down" : "up";
        }
      }

      setState((prev) => ({
        ...prev,
        delta: { x: deltaX, y: deltaY },
        swipeDirection: direction,
      }));
    },
    [enabled, swipeThreshold, clearLongPressTimer]
  );

  // Touch end handler
  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current) return;

      clearLongPressTimer();

      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;
      const duration = Date.now() - startRef.current.time;

      // Determine final action
      if (!movedRef.current && duration < longPressDelay) {
        // Short tap
        onTap?.();
      } else if (
        Math.abs(deltaX) > swipeThreshold ||
        Math.abs(deltaY) > swipeThreshold
      ) {
        // Swipe
        let direction: SwipeDirection = null;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? "right" : "left";
        } else {
          direction = deltaY > 0 ? "down" : "up";
        }
        onSwipe?.(direction);
      }

      startRef.current = null;
      setState({
        isTouching: false,
        isLongPress: false,
        swipeDirection: null,
        delta: { x: 0, y: 0 },
      });
    },
    [enabled, swipeThreshold, longPressDelay, onTap, onSwipe, clearLongPressTimer]
  );

  // Touch cancel handler
  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    startRef.current = null;
    setState({
      isTouching: false,
      isLongPress: false,
      swipeDirection: null,
      delta: { x: 0, y: 0 },
    });
  }, [clearLongPressTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };

  return { handlers, state };
}

/**
 * Hook for pinch-to-zoom gesture detection.
 */
interface PinchState {
  /** Whether a pinch gesture is in progress */
  isPinching: boolean;
  /** Current scale factor */
  scale: number;
  /** Center point of the pinch */
  center: { x: number; y: number };
}

interface UsePinchGestureOptions {
  /** Minimum scale change to trigger */
  threshold?: number;
  /** Whether pinch detection is enabled */
  enabled?: boolean;
  /** Callback when pinch scale changes */
  onPinch?: (scale: number) => void;
  /** Callback when pinch ends */
  onPinchEnd?: (finalScale: number) => void;
}

/**
 * Hook for detecting pinch-to-zoom gestures.
 */
export function usePinchGesture(options: UsePinchGestureOptions = {}) {
  const { threshold = 0.1, enabled = true, onPinch, onPinchEnd } = options;

  const [state, setState] = useState<PinchState>({
    isPinching: false,
    scale: 1,
    center: { x: 0, y: 0 },
  });

  const initialDistanceRef = useRef<number | null>(null);

  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const t1 = touches[0];
    const t2 = touches[1];
    if (!t1 || !t2) return 0;
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const t1 = touches[0];
    const t2 = touches[1];
    if (!t1 || !t2) return { x: 0, y: 0 };
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || event.touches.length !== 2) return;

      initialDistanceRef.current = getDistance(event.touches);
      setState({
        isPinching: true,
        scale: 1,
        center: getCenter(event.touches),
      });
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !initialDistanceRef.current || event.touches.length !== 2)
        return;

      const currentDistance = getDistance(event.touches);
      const scale = currentDistance / initialDistanceRef.current;

      if (Math.abs(scale - 1) > threshold) {
        setState({
          isPinching: true,
          scale,
          center: getCenter(event.touches),
        });
        onPinch?.(scale);
      }
    },
    [enabled, threshold, onPinch]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !state.isPinching) return;

      if (event.touches.length < 2) {
        onPinchEnd?.(state.scale);
        initialDistanceRef.current = null;
        setState({
          isPinching: false,
          scale: 1,
          center: { x: 0, y: 0 },
        });
      }
    },
    [enabled, state.isPinching, state.scale, onPinchEnd]
  );

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return { handlers, state };
}
