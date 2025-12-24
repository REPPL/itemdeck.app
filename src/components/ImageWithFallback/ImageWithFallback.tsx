import { useState, useCallback, useMemo } from "react";
import { generateColour } from "./placeholderUtils";
import styles from "./ImageWithFallback.module.css";

type LoadState = "loading" | "loaded" | "error";

interface ImageWithFallbackProps {
  /** Primary image URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Title for placeholder display */
  title: string;
  /** Optional fallback image URL */
  fallbackSrc?: string;
  /** CSS class for the image */
  className?: string;
  /** Loading attribute for lazy loading */
  loading?: "lazy" | "eager";
}

/**
 * Image component with title placeholder underneath.
 *
 * Shows a coloured background with bold title text as the base layer.
 * The image is overlaid on top and fades in when loaded.
 * If the image fails to load, the title placeholder remains visible.
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

  // Generate consistent background colour from title
  const bgColour = useMemo(() => generateColour(title), [title]);

  const handleLoad = useCallback(() => {
    setLoadState("loaded");
  }, []);

  const handleError = useCallback(() => {
    if (loadState === "loading" && fallbackSrc && currentSrc !== fallbackSrc) {
      // Try fallback image
      setCurrentSrc(fallbackSrc);
    } else {
      // Image failed - placeholder will remain visible
      setLoadState("error");
    }
  }, [loadState, fallbackSrc, currentSrc]);

  return (
    <div className={styles.container}>
      {/* Base layer: coloured background with title */}
      <div
        className={styles.placeholder}
        style={{ backgroundColor: bgColour }}
      >
        <span className={styles.placeholderTitle}>{title}</span>
      </div>

      {/* Overlay: actual image (fades in when loaded) */}
      {loadState !== "error" && (
        <img
          src={currentSrc}
          alt={alt}
          className={[
            styles.image,
            className ?? "",
            loadState === "loaded" ? styles.imageLoaded : styles.imageLoading,
          ].join(" ")}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

// Re-export subcomponents
export { SVGPlaceholder } from "./SVGPlaceholder";
export { ImageSkeleton } from "./ImageSkeleton";
