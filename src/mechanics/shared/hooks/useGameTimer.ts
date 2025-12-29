/**
 * Hook for managing game timer state.
 *
 * Provides elapsed time calculation and formatting for timed game mechanics.
 */

import { useState, useEffect } from "react";
import { formatTime } from "../utils";

/**
 * Options for the useGameTimer hook.
 */
export interface UseGameTimerOptions {
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Game start timestamp in milliseconds (null if not started) */
  startTime: number | null;
  /** Game end timestamp in milliseconds (null if still running) */
  endTime?: number | null;
}

/**
 * Result type for useGameTimer hook.
 */
export interface UseGameTimerResult {
  /** Elapsed time in milliseconds */
  elapsedMs: number;
  /** Formatted time string (MM:SS) */
  formattedTime: string;
}

/**
 * Hook for managing game timer state.
 *
 * Updates every second while running, calculates final time when stopped.
 *
 * @param options - Timer configuration
 * @returns Object with elapsedMs and formattedTime
 *
 * @example
 * const { elapsedMs, formattedTime } = useGameTimer({
 *   isRunning: !isComplete,
 *   startTime: gameStartTime,
 *   endTime: isComplete ? gameEndTime : null,
 * });
 */
export function useGameTimer({
  isRunning,
  startTime,
  endTime,
}: UseGameTimerOptions): UseGameTimerResult {
  // Force re-render every second to update timer display
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, startTime]);

  // Calculate elapsed time - use endTime if provided (game complete), otherwise current time
  const endTimestamp = endTime ?? Date.now();
  const elapsedMs = startTime ? endTimestamp - startTime : 0;
  const formattedTime = formatTime(elapsedMs);

  return { elapsedMs, formattedTime };
}
