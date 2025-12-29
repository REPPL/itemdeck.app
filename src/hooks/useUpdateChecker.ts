/**
 * Hook to check for remote source updates.
 *
 * Runs background checks every 15 minutes to detect when
 * a remote source has been updated.
 */

import { useState, useEffect, useCallback } from "react";
import { useSourceStore, type Source } from "@/stores/sourceStore";
import { checkForUpdates, type UpdateCheckResult } from "@/services/updateChecker";
import { getCacheMetadata } from "@/lib/cardCache";

/**
 * Update check interval (15 minutes in milliseconds).
 */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Update checker state.
 */
export interface UpdateCheckerState {
  /** Whether an update is available */
  hasUpdate: boolean;

  /** When the last check was performed */
  lastChecked?: Date;

  /** Whether a check is currently in progress */
  isChecking: boolean;

  /** Error message if last check failed */
  error?: string;

  /** Manually trigger an update check */
  checkNow: () => Promise<void>;
}

/**
 * Hook to check for updates on a specific source.
 *
 * @param sourceId - Source ID to check for updates
 * @returns Update checker state with hasUpdate, lastChecked, and checkNow function
 *
 * @example
 * ```tsx
 * const { hasUpdate, checkNow, isChecking } = useUpdateChecker(sourceId);
 *
 * if (hasUpdate) {
 *   // Show update badge
 * }
 * ```
 */
export function useUpdateChecker(sourceId: string): UpdateCheckerState {
  const source = useSourceStore((state) =>
    state.sources.find((s) => s.id === sourceId)
  );
  const setSourceUpdateCheck = useSourceStore((state) => state.setSourceUpdateCheck);

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const performCheck = useCallback(async () => {
    if (!source) {
      return;
    }

    setIsChecking(true);
    setError(undefined);

    try {
      // Get the local cache timestamp
      const cacheMetadata = await getCacheMetadata(sourceId);
      const localTimestamp = cacheMetadata.cachedAt?.getTime();

      // Check for updates
      const result: UpdateCheckResult = await checkForUpdates(source, localTimestamp);

      // Update the store with the result
      setSourceUpdateCheck(
        sourceId,
        result.hasUpdate,
        result.remoteTimestamp
      );

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Check failed";
      setError(errorMessage);
    } finally {
      setIsChecking(false);
    }
  }, [source, sourceId, setSourceUpdateCheck]);

  // Run initial check and set up interval
  useEffect(() => {
    if (!sourceId || !source) {
      return;
    }

    // Run initial check
    void performCheck();

    // Set up periodic checks
    const intervalId = setInterval(() => {
      void performCheck();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [sourceId, source, performCheck]);

  return {
    hasUpdate: source?.hasUpdate ?? false,
    lastChecked: source?.lastRemoteCheck,
    isChecking,
    error,
    checkNow: performCheck,
  };
}

/**
 * Hook to check for updates on all configured sources.
 *
 * @returns Object with sourcesWithUpdates array and checkAllNow function
 *
 * @example
 * ```tsx
 * const { sourcesWithUpdates, checkAllNow } = useUpdateCheckerAll();
 *
 * if (sourcesWithUpdates.length > 0) {
 *   // Show notification
 * }
 * ```
 */
export function useUpdateCheckerAll(): {
  sourcesWithUpdates: Source[];
  isChecking: boolean;
  checkAllNow: () => Promise<void>;
} {
  const sources = useSourceStore((state) => state.sources);
  const setSourceUpdateCheck = useSourceStore((state) => state.setSourceUpdateCheck);

  const [isChecking, setIsChecking] = useState(false);

  const checkAllNow = useCallback(async () => {
    setIsChecking(true);

    try {
      const checks = sources.map(async (source) => {
        const cacheMetadata = await getCacheMetadata(source.id);
        const localTimestamp = cacheMetadata.cachedAt?.getTime();
        const result = await checkForUpdates(source, localTimestamp);

        setSourceUpdateCheck(
          source.id,
          result.hasUpdate,
          result.remoteTimestamp
        );
      });

      await Promise.all(checks);
    } finally {
      setIsChecking(false);
    }
  }, [sources, setSourceUpdateCheck]);

  // Run initial check and set up interval
  useEffect(() => {
    if (sources.length === 0) {
      return;
    }

    // Run initial check
    void checkAllNow();

    // Set up periodic checks
    const intervalId = setInterval(() => {
      void checkAllNow();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [sources.length, checkAllNow]);

  const sourcesWithUpdates = sources.filter((s) => s.hasUpdate);

  return {
    sourcesWithUpdates,
    isChecking,
    checkAllNow,
  };
}
