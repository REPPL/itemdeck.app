import { useState, useCallback } from "react";
import { SVGPlaceholder } from "./SVGPlaceholder";
import { ImageSkeleton } from "./ImageSkeleton";
import styles from "./ImageWithFallback.module.css";

type LoadState = "loading" | "loaded" | "fallback" | "placeholder";

interface ImageWithFallbackProps {
  /** Primary image URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Title for SVG placeholder initials */
  title: string;
  /** Optional fallback image URL */
  fallbackSrc?: string;
  /** CSS class for the image */
  className?: string;
  /** Loading attribute for lazy loading */
  loading?: "lazy" | "eager";
}

/**
 * Image component with fallback chain.
 *
 * Load order:
 * 1. Primary src (loading skeleton shown)
 * 2. Fallback src (if provided and primary fails)
 * 3. SVG placeholder with initials (if all fail)
 */
export function ImageWithFallback({
  src,
  alt,
  title,
  fallbackSrc,
  className,
  loading = "lazy",
}: ImageWithFallbackProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setLoadState("loaded");
  }, []);

  const handleError = useCallback(() => {
    if (loadState === "loading" && fallbackSrc && currentSrc !== fallbackSrc) {
      // Try fallback image
      setCurrentSrc(fallbackSrc);
      setLoadState("fallback");
    } else {
      // Show placeholder
      setLoadState("placeholder");
    }
  }, [loadState, fallbackSrc, currentSrc]);

  // Show placeholder for final fallback state
  if (loadState === "placeholder") {
    return (
      <SVGPlaceholder
        title={title}
        className={[styles.image, className ?? ""].join(" ")}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Show skeleton while loading */}
      {loadState === "loading" && (
        <ImageSkeleton className={styles.skeleton} />
      )}

      <img
        src={currentSrc}
        alt={alt}
        className={[styles.image, className ?? "", loadState === "loading" ? styles.hidden : ""].join(" ")}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Re-export subcomponents
export { SVGPlaceholder } from "./SVGPlaceholder";
export { ImageSkeleton } from "./ImageSkeleton";
