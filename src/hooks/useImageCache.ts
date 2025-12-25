/**
 * React hooks for image caching.
 *
 * Provides hooks for loading cached images, preloading collections,
 * and accessing cache statistics.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  imageCache,
  fetchAndCacheImage,
  preloadImages,
  type CacheStats,
  DEFAULT_MAX_CACHE_SIZE,
} from "@/services/imageCache";

/**
 * Query keys for image cache operations.
 */
export const imageCacheKeys = {
  all: ["image-cache"] as const,
  stats: () => [...imageCacheKeys.all, "stats"] as const,
  image: (url: string) => [...imageCacheKeys.all, "image", url] as const,
};

/**
 * Hook to get cache statistics.
 *
 * @param maxSize - Maximum cache size for percentage calculation
 * @returns Cache statistics query result
 */
export function useCacheStats(maxSize: number = DEFAULT_MAX_CACHE_SIZE) {
  return useQuery({
    queryKey: imageCacheKeys.stats(),
    queryFn: () => imageCache.getStats(maxSize),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to get a cached image as an object URL.
 *
 * Creates a blob URL that must be revoked when component unmounts.
 *
 * @param url - Image URL
 * @param enabled - Whether to fetch the image
 * @returns Object with objectURL, isLoading, and error
 */
export function useCachedImage(url: string | undefined, enabled = true) {
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url || !enabled) {
      setObjectURL(null);
      return;
    }

    let cancelled = false;
    let currentObjectURL: string | null = null;

    const imageUrl = url;

    async function loadImage() {
      setIsLoading(true);
      setError(null);

      try {
        // Try to get from cache first
        const cached = await imageCache.get(imageUrl);
        if (cached && !cancelled) {
          currentObjectURL = URL.createObjectURL(cached.blob);
          setObjectURL(currentObjectURL);
          setIsLoading(false);
          return;
        }

        // Fetch and cache
        const blob = await fetchAndCacheImage(imageUrl);
        if (!cancelled && blob) {
          currentObjectURL = URL.createObjectURL(blob);
          setObjectURL(currentObjectURL);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
      if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
      }
    };
  }, [url, enabled]);

  return { objectURL, isLoading, error };
}

/**
 * Hook for preloading images with progress tracking.
 *
 * @returns Object with preload function, progress, and status
 */
export function useImagePreloader() {
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [isPreloading, setIsPreloading] = useState(false);
  const queryClient = useQueryClient();

  const preload = useCallback(
    async (urls: string[], onComplete?: () => void) => {
      if (urls.length === 0) {
        return 0;
      }

      setIsPreloading(true);
      setProgress({ completed: 0, total: urls.length });

      try {
        const successful = await preloadImages(urls, {}, (completed, total) => {
          setProgress({ completed, total });
        });

        // Invalidate stats query to refresh cache info
        await queryClient.invalidateQueries({ queryKey: imageCacheKeys.stats() });

        if (onComplete) {
          onComplete();
        }

        return successful;
      } finally {
        setIsPreloading(false);
      }
    },
    [queryClient]
  );

  const progressPercent =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return {
    preload,
    isPreloading,
    progress,
    progressPercent,
  };
}

/**
 * Hook for cache management operations.
 *
 * @returns Object with cache management functions
 */
export function useCacheManagement() {
  const queryClient = useQueryClient();

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      await imageCache.clear();
    },
    onSuccess: () => {
      // Invalidate all cache-related queries
      void queryClient.invalidateQueries({ queryKey: imageCacheKeys.all });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (url: string) => {
      await imageCache.delete(url);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: imageCacheKeys.stats() });
    },
  });

  const getCacheStats = useCallback(async (): Promise<CacheStats> => {
    return imageCache.getStats();
  }, []);

  const getAllCachedURLs = useCallback(async (): Promise<string[]> => {
    return imageCache.getAllURLs();
  }, []);

  return {
    clearCache: clearCacheMutation.mutate,
    isClearing: clearCacheMutation.isPending,
    deleteImage: deleteImageMutation.mutate,
    isDeleting: deleteImageMutation.isPending,
    getCacheStats,
    getAllCachedURLs,
  };
}

/**
 * Format bytes to human-readable string.
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const unit = units[i] ?? "B";

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${unit}`;
}
