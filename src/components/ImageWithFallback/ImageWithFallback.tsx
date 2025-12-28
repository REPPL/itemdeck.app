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
  /** Whether this is a placeholder URL (skip loading if placeholders disabled) */
  isPlaceholderUrl?: boolean;
}

/**
 * Image component with coloured placeholder.
 *
 * Shows a coloured background as the base layer.
 * The image is overlaid on top and fades in when loaded.
 * If the image fails to load or is skipped, the coloured background remains visible.
 * Title text is NOT shown (card overlay already displays the title).
 */
export function ImageWithFallback({
  src,
  alt,
  title,
  fallbackSrc,
  className,
  loading = "lazy",
  isPlaceholderUrl = false,
}: ImageWithFallbackProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [currentSrc, setCurrentSrc] = useState(src);

  // If this is a placeholder URL and we want to skip it, show coloured background only
  const skipImage = isPlaceholderUrl;

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
      // Image failed - coloured background will remain visible
      setLoadState("error");
    }
  }, [loadState, fallbackSrc, currentSrc]);

  return (
    <div className={styles.container}>
      {/* Base layer: coloured background (title shown in card overlay, not here) */}
      <div
        className={styles.placeholder}
        style={{ backgroundColor: bgColour }}
      />

      {/* Overlay: actual image (fades in when loaded) */}
      {!skipImage && loadState !== "error" && (
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
          draggable="false"
        />
      )}
    </div>
  );
}

// Re-export subcomponents
export { SVGPlaceholder } from "./SVGPlaceholder";
export { ImageSkeleton } from "./ImageSkeleton";
