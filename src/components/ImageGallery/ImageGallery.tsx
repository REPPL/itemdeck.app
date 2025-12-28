/**
 * Image gallery component with swipe support.
 *
 * Displays multiple images and YouTube videos with navigation arrows (desktop)
 * and swipe gestures (touch devices).
 */

import { useCallback, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTouchGestures } from "@/hooks/useTouchGestures";
import { useValidatedImages } from "@/hooks/useImageValidation";
import { parseMediaUrls, type MediaItem } from "@/types/media";
import { YouTubeEmbed } from "./YouTubeEmbed";
import styles from "./ImageGallery.module.css";

/**
 * Left arrow icon.
 */
function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/**
 * Right arrow icon.
 */
function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface ImageGalleryProps {
  /** Array of image URLs */
  images: string[];

  /** Alt text for images */
  alt?: string;

  /** Currently selected image index (controlled) */
  currentIndex?: number;

  /** Callback when image changes */
  onChange?: (index: number) => void;

  /** Whether to show navigation arrows */
  showArrows?: boolean;

  /** Whether to show dot indicators */
  showDots?: boolean;

  /** Whether to zoom first image to fill (cover) or show at original size (contain) */
  zoomImage?: boolean;

  /** Whether to validate images before displaying (filters out unreachable URLs) */
  validateImages?: boolean;

  /** Additional class name for the container */
  className?: string;
}

/**
 * Image gallery with swipe and arrow navigation.
 *
 * Features:
 * - Left/right arrow buttons on desktop
 * - Swipe gestures on touch devices
 * - Dot indicators at bottom
 * - Smooth CSS transitions between images
 * - Keyboard navigation (left/right arrows)
 * - YouTube video support (auto-detected from URL)
 *
 * @example
 * ```tsx
 * <ImageGallery
 *   images={[
 *     "https://example.com/cover.jpg",
 *     "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
 *     "https://example.com/screenshot.jpg"
 *   ]}
 *   alt={card.title}
 *   showArrows
 *   showDots
 * />
 * ```
 */
export function ImageGallery({
  images,
  alt = "Gallery image",
  currentIndex: controlledIndex,
  onChange,
  showArrows = true,
  showDots = true,
  zoomImage = true,
  validateImages = false,
  className,
}: ImageGalleryProps) {
  // Validate images if enabled (filters out unreachable URLs)
  const {
    validImages,
    isLoading: isValidating,
    invalidCount,
  } = useValidatedImages(images, { enabled: validateImages });

  // Use validated images if validation is enabled, otherwise use raw images
  const activeImages = validateImages ? validImages : images;

  // Parse URLs into media items (detect YouTube vs images)
  const mediaItems = useMemo(
    () => parseMediaUrls(activeImages),
    [activeImages]
  );

  // Internal state for uncontrolled mode
  const [internalIndex, setInternalIndex] = useState(0);

  // Build display items array:
  // For images: duplicate first item (zoomed/cover at index 0, original at index 1+)
  // For videos: no duplication (videos don't benefit from zoom)
  const displayItems = useMemo((): MediaItem[] => {
    if (mediaItems.length === 0) return [];
    const firstItem = mediaItems[0];
    if (!firstItem) return [];

    // Only duplicate first item if it's an image (zoom feature)
    // Videos should not be duplicated
    if (firstItem.type === "image") {
      return [firstItem, ...mediaItems];
    }

    // For videos (YouTube etc.), just return items as-is
    return mediaItems;
  }, [mediaItems]);

  // Use controlled or internal index
  const currentIndex = controlledIndex ?? internalIndex;
  const setCurrentIndex = useCallback(
    (index: number) => {
      if (onChange) {
        onChange(index);
      } else {
        setInternalIndex(index);
      }
    },
    [onChange]
  );

  // Navigation direction for animation
  const [direction, setDirection] = useState(0);

  // Use displayItems for navigation (includes duplicated first item)
  const totalItems = displayItems.length;
  const hasMultipleItems = totalItems > 1;

  // Check if at boundaries (no wrap-around)
  const isAtFirst = currentIndex === 0;
  const isAtLast = currentIndex === totalItems - 1;

  // Navigate to previous item (no wrap-around)
  const goToPrevious = useCallback(() => {
    if (!hasMultipleItems || isAtFirst) return;
    setDirection(-1);
    setCurrentIndex(currentIndex - 1);
  }, [currentIndex, hasMultipleItems, isAtFirst, setCurrentIndex]);

  // Navigate to next item (no wrap-around)
  const goToNext = useCallback(() => {
    if (!hasMultipleItems || isAtLast) return;
    setDirection(1);
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, hasMultipleItems, isAtLast, setCurrentIndex]);

  // Navigate to specific index
  const goToIndex = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex, setCurrentIndex]
  );

  // Touch gestures for swipe navigation
  const { handlers: touchHandlers } = useTouchGestures({
    enabled: hasMultipleItems,
    swipeThreshold: 50,
    onSwipe: (swipeDir) => {
      if (swipeDir === "left") {
        goToNext();
      } else if (swipeDir === "right") {
        goToPrevious();
      }
    },
  });

  // Keyboard navigation
  useEffect(() => {
    if (!hasMultipleItems) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in an input element
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleItems, goToPrevious, goToNext]);

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      zIndex: 0,
    }),
  };

  const containerClass = [styles.gallery, className].filter(Boolean).join(" ");

  // Show loading state while validating images
  if (validateImages && isValidating) {
    return (
      <div className={containerClass} role="region" aria-label="Image gallery">
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <span className={styles.loadingText}>Validating images...</span>
        </div>
      </div>
    );
  }

  // Show empty state if no valid media
  if (mediaItems.length === 0) {
    return (
      <div className={containerClass} role="region" aria-label="Media gallery">
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">🖼️</span>
          <span className={styles.emptyText}>
            {validateImages && invalidCount > 0
              ? `${String(invalidCount)} image${invalidCount === 1 ? "" : "s"} unavailable`
              : "No media to display"}
          </span>
        </div>
      </div>
    );
  }

  // Get current media item (guaranteed to exist due to mediaItems.length check above)
  const currentItem = displayItems[currentIndex];
  if (!currentItem) {
    return null;
  }

  return (
    <div
      className={containerClass}
      role="region"
      aria-label="Media gallery"
      aria-roledescription="carousel"
    >
      <div className={styles.imageContainer} {...touchHandlers}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {currentItem.type === "youtube" && currentItem.videoId ? (
            <motion.div
              key={`video-${String(currentIndex)}`}
              className={styles.videoContainer}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <YouTubeEmbed
                videoId={currentItem.videoId}
                title={`${alt} video (${String(currentIndex + 1)} of ${String(totalItems)})`}
              />
            </motion.div>
          ) : (
            <motion.img
              key={`image-${String(currentIndex)}`}
              src={currentItem.url}
              alt={`${alt} (${String(currentIndex + 1)} of ${String(totalItems)})`}
              className={[
                styles.image,
                // First item: use cover if zoomImage is true and it's an image
                // Other items: always use contain
                currentIndex === 0 && zoomImage ? styles.imageCover : styles.imageContain,
              ].join(" ")}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              draggable={false}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation arrows (desktop) */}
      {showArrows && hasMultipleItems && (
        <>
          <button
            type="button"
            className={[
              styles.navButton,
              styles.navButtonPrev,
              isAtFirst ? styles.navButtonDisabled : "",
            ].filter(Boolean).join(" ")}
            onClick={goToPrevious}
            disabled={isAtFirst}
            aria-label="Previous image"
            aria-disabled={isAtFirst}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={[
              styles.navButton,
              styles.navButtonNext,
              isAtLast ? styles.navButtonDisabled : "",
            ].filter(Boolean).join(" ")}
            onClick={goToNext}
            disabled={isAtLast}
            aria-label="Next image"
            aria-disabled={isAtLast}
          >
            <ChevronRightIcon />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && hasMultipleItems && (
        <div className={styles.dots} role="tablist" aria-label="Gallery media">
          {displayItems.map((item, index) => (
            <button
              key={index}
              type="button"
              className={[
                styles.dot,
                index === currentIndex ? styles.dotActive : "",
                item.type === "youtube" ? styles.dotVideo : "",
              ].filter(Boolean).join(" ")}
              onClick={() => {
                goToIndex(index);
              }}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to ${item.type === "youtube" ? "video" : "image"} ${String(index + 1)}`}
            />
          ))}
        </div>
      )}

    </div>
  );
}

export default ImageGallery;
