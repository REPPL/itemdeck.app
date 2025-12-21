/**
 * Online status detection hook.
 *
 * Tracks the browser's online/offline state and provides
 * reactive updates when connectivity changes.
 */

import { useState, useEffect, useSyncExternalStore } from "react";

/**
 * Subscribe to online/offline events.
 *
 * @param callback - Function to call when status changes
 * @returns Cleanup function
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * Get current online status.
 *
 * @returns Current navigator.onLine value
 */
function getSnapshot(): boolean {
  return navigator.onLine;
}

/**
 * Server snapshot for SSR.
 * Always returns true on server (assume online).
 *
 * @returns true
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Hook to track online/offline status.
 *
 * Uses useSyncExternalStore for optimal React 18 compatibility.
 * Automatically updates when the browser goes online or offline.
 *
 * @returns Current online status (true = online, false = offline)
 *
 * @example
 * ```tsx
 * function App() {
 *   const isOnline = useOnlineStatus();
 *
 *   return (
 *     <div>
 *       {!isOnline && <OfflineBanner />}
 *       <Content />
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Legacy hook implementation using useState/useEffect.
 *
 * Provided for environments where useSyncExternalStore
 * might not be available.
 *
 * @returns Current online status
 */
export function useOnlineStatusLegacy(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
