/**
 * Lazy loading image component with shimmer placeholder.
 *
 * Uses Intersection Observer to defer image loading until the element
 * approaches the viewport. Shows a shimmer animation placeholder while loading.
 */

import { useState, useCallback, useRef, useEffect, type ImgHTMLAttributes } from "react";
import styles from "./LazyImage.module.css";

/**
 * Load state for the image.
 */
type LoadState = "idle" | "loading" | "loaded" | "error";

/**
 * Props for LazyImage component.
 */
interface LazyImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Image source URL */
  src: string;
  /** Fallback URL if primary fails */
  fallbackSrc?: string;
  /** Background colour for placeholder */
  placeholderColour?: string;
  /** Whether to blur during loading (progressive reveal) */
  blur?: boolean;
  /** Additional class for container */
  containerClassName?: string;
  /** Show loading spinner overlay (default: false) */
  showSpinner?: boolean;
}

/**
 * Lazy image component with shimmer loading effect.
 *
 * Features:
 * - Intersection Observer for viewport-based loading
 * - Enhanced shimmer animation placeholder (slower, more visible)
 * - Optional loading spinner overlay
 * - Smooth fade-in on load
 * - Error state with fallback
 * - Respects prefers-reduced-motion
 * - aria-busy attribute during loading for accessibility
 *
 * @example
 * ```tsx
 * <LazyImage
 *   src="/images/card.jpg"
 *   alt="Card image"
 *   fallbackSrc="/images/placeholder.jpg"
 *   showSpinner
 * />
 * ```
 */
export function LazyImage({
  src,
  fallbackSrc,
  alt = "",
  placeholderColour = "var(--colour-surface-elevated)",
  blur = true,
  className,
  containerClassName,
  showSpinner = false,
  ...props
}: LazyImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );

    observer.observe(element);
    return () => { observer.disconnect(); };
  }, []);

  const handleLoad = useCallback(() => {
    setLoadState("loaded");
  }, []);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setLoadState("loading");
    } else {
      setLoadState("error");
    }
  }, [fallbackSrc, currentSrc]);

  // Start loading when visible
  useEffect(() => {
    if (isVisible && loadState === "idle") {
      setLoadState("loading");
      setCurrentSrc(src);
    }
  }, [isVisible, loadState, src]);

  const isLoading = loadState === "loading" || loadState === "idle";
  const showPlaceholder = loadState !== "loaded" && loadState !== "error";

  const containerClasses = [styles.container, containerClassName]
    .filter(Boolean)
    .join(" ");

  const imageClasses = [
    styles.image,
    loadState === "loaded" ? styles.visible : styles.hidden,
    blur && loadState === "loading" ? styles.blur : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={{ backgroundColor: placeholderColour }}
      aria-busy={isLoading}
    >
      {/* Placeholder shimmer */}
      {showPlaceholder && (
        <div
          className={styles.placeholder}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Loading spinner overlay */}
      {showSpinner && loadState === "loading" && (
        <div className={styles.spinnerOverlay} aria-hidden="true">
          <div className={styles.spinner} />
        </div>
      )}

      {/* Actual image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={imageClasses}
          loading="lazy"
          decoding="async"
          draggable="false"
          {...props}
        />
      )}

      {/* Error state */}
      {loadState === "error" && (
        <div className={styles.errorState} role="img" aria-label={alt}>
          <ImageOffIcon />
        </div>
      )}
    </div>
  );
}

/**
 * Simple image-off icon for error state.
 */
function ImageOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.errorIcon}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default LazyImage;
