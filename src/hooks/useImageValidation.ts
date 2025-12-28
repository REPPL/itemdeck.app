/**
 * Image validation hook.
 *
 * Validates image URLs before display, filtering out unretrievable images.
 * Caches validation results in IndexedDB to persist across sessions.
 *
 * @module hooks/useImageValidation
 * @see F-079: Image validation IndexedDB persistence
 */

import { useState, useEffect, useRef } from "react";
import { imageCache } from "@/services/imageCache";
import { getDB, type ValidationEntry } from "@/db";

/**
 * Validation result for a single URL.
 */
interface ValidationResult {
  url: string;
  valid: boolean;
  error?: string;
}

/**
 * In-memory validation cache for fast synchronous lookups.
 * Backed by IndexedDB for persistence across sessions.
 */
const validationCache = new Map<string, boolean>();

/**
 * Whether the IndexedDB cache has been loaded into memory.
 */
let cacheLoaded = false;

/**
 * Maximum age for cached validation results (7 days in milliseconds).
 */
const VALIDATION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Load validation cache from IndexedDB into memory.
 */
async function loadValidationCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    const db = await getDB();
    const now = Date.now();
    const validations = await db.getAll("validations");

    for (const entry of validations) {
      // Skip expired entries
      if (now - entry.validatedAt > VALIDATION_MAX_AGE) {
        // Delete expired entry in background
        void db.delete("validations", entry.url);
        continue;
      }
      validationCache.set(entry.url, entry.valid);
    }

    cacheLoaded = true;
  } catch (error) {
    console.warn("[imageValidation] Failed to load cache from IndexedDB:", error);
    cacheLoaded = true; // Mark as loaded to avoid repeated failures
  }
}

/**
 * Save a validation result to IndexedDB.
 */
async function saveValidationResult(
  url: string,
  valid: boolean,
  error?: string
): Promise<void> {
  try {
    const db = await getDB();
    const entry: ValidationEntry = {
      url,
      valid,
      validatedAt: Date.now(),
      error,
    };
    await db.put("validations", entry);
  } catch (err) {
    console.warn("[imageValidation] Failed to save to IndexedDB:", err);
  }
}

/**
 * Check if a URL is a YouTube video URL.
 */
function isYouTubeUrl(url: string): boolean {
  const patterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//,
  ];
  return patterns.some((pattern) => pattern.test(url));
}

/**
 * Validate a single image URL.
 *
 * @param url - Image URL to validate
 * @returns Validation result
 */
async function validateImageUrl(url: string): Promise<ValidationResult> {
  // Check in-memory cache first
  const cachedResult = validationCache.get(url);
  if (cachedResult !== undefined) {
    return { url, valid: cachedResult };
  }

  // YouTube URLs are validated differently (assume valid)
  if (isYouTubeUrl(url)) {
    validationCache.set(url, true);
    void saveValidationResult(url, true);
    return { url, valid: true };
  }

  // Check if already in image cache (means it was successfully fetched before)
  try {
    const cached = await imageCache.has(url);
    if (cached) {
      validationCache.set(url, true);
      void saveValidationResult(url, true);
      return { url, valid: true };
    }
  } catch {
    // Ignore cache check errors
  }

  // Perform HEAD request to validate
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, 5000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      // Use no-cors mode for cross-origin images - we can still check if request succeeds
      mode: "cors",
    });

    clearTimeout(timeoutId);

    // Check if response is OK and content type is an image
    const contentType = response.headers.get("content-type") ?? "";
    const isImage = contentType.startsWith("image/");
    const valid = response.ok && isImage;

    validationCache.set(url, valid);
    const errorMsg = valid ? undefined : `Invalid response: ${String(response.status)} ${contentType}`;
    void saveValidationResult(url, valid, errorMsg);
    return {
      url,
      valid,
      error: errorMsg,
    };
  } catch (error) {
    // If HEAD fails, try a GET request with range header (some servers don't support HEAD)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort(); }, 5000);

      const response = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        signal: controller.signal,
        mode: "cors",
      });

      clearTimeout(timeoutId);

      // Check if response is OK (200 or 206 for partial content)
      const valid = response.ok || response.status === 206;

      if (valid) {
        const contentType = response.headers.get("content-type") ?? "";
        const isImage = contentType.startsWith("image/");
        validationCache.set(url, isImage);
        void saveValidationResult(url, isImage, isImage ? undefined : "Not an image");
        return { url, valid: isImage };
      }

      const errorMsg = `Request failed: ${String(response.status)}`;
      validationCache.set(url, false);
      void saveValidationResult(url, false, errorMsg);
      return {
        url,
        valid: false,
        error: errorMsg,
      };
    } catch (innerError) {
      // Both HEAD and GET failed
      const errorMsg = innerError instanceof Error ? innerError.message : "Unknown error";
      validationCache.set(url, false);
      void saveValidationResult(url, false, errorMsg);
      return {
        url,
        valid: false,
        error: errorMsg,
      };
    }
  }
}

/**
 * Hook result for validated images.
 */
interface UseValidatedImagesResult {
  /** Array of valid image URLs */
  validImages: string[];
  /** Whether validation is in progress */
  isLoading: boolean;
  /** Number of invalid images filtered out */
  invalidCount: number;
  /** Error message if all validation failed */
  error: string | null;
}

/**
 * Hook to validate and filter image URLs.
 *
 * Performs validation on mount and when URLs change.
 * Invalid images are filtered from the result.
 *
 * @param urls - Array of image URLs to validate
 * @param options - Validation options
 * @returns Validated images and loading state
 *
 * @example
 * ```tsx
 * const { validImages, isLoading, invalidCount } = useValidatedImages(imageUrls);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (validImages.length === 0) return <NoImagesMessage />;
 *
 * return <ImageGallery images={validImages} />;
 * ```
 */
export function useValidatedImages(
  urls: string[],
  options: { enabled?: boolean } = {}
): UseValidatedImagesResult {
  const { enabled = true } = options;

  const [validImages, setValidImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invalidCount, setInvalidCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Track current validation to handle race conditions
  const validationRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if disabled or no URLs
    if (!enabled || urls.length === 0) {
      setValidImages([]);
      setIsLoading(false);
      setInvalidCount(0);
      setError(null);
      return;
    }

    // Create a unique key for this validation run
    const validationKey = urls.join("|");

    // Skip if already validated these exact URLs
    if (validationRef.current === validationKey && !isLoading) {
      return;
    }

    validationRef.current = validationKey;
    setIsLoading(true);
    setError(null);

    async function validateAll() {
      try {
        // Load persisted cache from IndexedDB first
        await loadValidationCache();

        // Validate all URLs in parallel
        const results = await Promise.all(
          urls.map((url) => validateImageUrl(url))
        );

        // Check if this validation is still current
        if (validationRef.current !== validationKey) {
          return; // Stale validation, ignore results
        }

        // Filter valid URLs, preserving order
        const valid = results
          .filter((r) => r.valid)
          .map((r) => r.url);

        const invalid = results.filter((r) => !r.valid);

        setValidImages(valid);
        setInvalidCount(invalid.length);
        setIsLoading(false);

        if (valid.length === 0 && urls.length > 0) {
          setError("No valid images found");
        }
      } catch (err) {
        // Check if this validation is still current
        if (validationRef.current !== validationKey) {
          return;
        }

        setValidImages([]);
        setInvalidCount(urls.length);
        setIsLoading(false);
        setError(err instanceof Error ? err.message : "Validation failed");
      }
    }

    void validateAll();
  }, [urls, enabled, isLoading]);

  return { validImages, isLoading, invalidCount, error };
}

/**
 * Clear the validation cache (both in-memory and IndexedDB).
 * Useful when images might have changed on the server.
 */
export async function clearValidationCache(): Promise<void> {
  validationCache.clear();
  cacheLoaded = false;

  try {
    const db = await getDB();
    await db.clear("validations");
  } catch (error) {
    console.warn("[imageValidation] Failed to clear IndexedDB cache:", error);
  }
}

/**
 * Remove a specific URL from the validation cache.
 *
 * @param url - URL to remove from cache
 */
export async function invalidateUrl(url: string): Promise<void> {
  validationCache.delete(url);

  try {
    const db = await getDB();
    await db.delete("validations", url);
  } catch (error) {
    console.warn("[imageValidation] Failed to delete from IndexedDB:", error);
  }
}
