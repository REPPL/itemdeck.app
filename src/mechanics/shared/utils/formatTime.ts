/**
 * Time formatting utility.
 *
 * Standardised time display format for all game mechanics.
 */

/**
 * Format milliseconds as MM:SS.
 *
 * @param ms - Time in milliseconds
 * @returns Formatted string in MM:SS format
 *
 * @example
 * formatTime(0)       // "00:00"
 * formatTime(65000)   // "01:05"
 * formatTime(3600000) // "60:00"
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
