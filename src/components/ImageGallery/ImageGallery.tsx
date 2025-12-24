/**
 * Image gallery component with swipe support.
 *
 * Displays multiple images with navigation arrows (desktop) and
 * swipe gestures (touch devices).
 */

import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTouchGestures } from "@/hooks/useTouchGestures";
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
 *
 * @example
 * ```tsx
 * <ImageGallery
 *   images={card.imageUrls}
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
  className,
}: ImageGalleryProps) {
  // Internal state for uncontrolled mode
  const [internalIndex, setInternalIndex] = useState(0);

  // Build display images array:
  // Index 0: first image (zoomed/cover)
  // Index 1: first image again (original size/contain)
  // Index 2+: remaining images (original size/contain)
  const displayImages = images.length > 0
    ? [images[0], ...images]
    : images;

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

  // Use displayImages for navigation (includes duplicated first image)
  const totalImages = displayImages.length;
  const hasMultipleImages = totalImages > 1;

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    if (!hasMultipleImages) return;
    setDirection(-1);
    setCurrentIndex((currentIndex - 1 + totalImages) % totalImages);
  }, [currentIndex, totalImages, hasMultipleImages, setCurrentIndex]);

  // Navigate to next image
  const goToNext = useCallback(() => {
    if (!hasMultipleImages) return;
    setDirection(1);
    setCurrentIndex((currentIndex + 1) % totalImages);
  }, [currentIndex, totalImages, hasMultipleImages, setCurrentIndex]);

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
    enabled: hasMultipleImages,
    swipeThreshold: 50,
    onSwipe: (direction) => {
      if (direction === "left") {
        goToNext();
      } else if (direction === "right") {
        goToPrevious();
      }
    },
  });

  // Keyboard navigation
  useEffect(() => {
    if (!hasMultipleImages) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [hasMultipleImages, goToPrevious, goToNext]);

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

  return (
    <div
      className={containerClass}
      role="region"
      aria-label="Image gallery"
      aria-roledescription="carousel"
    >
      <div className={styles.imageContainer} {...touchHandlers}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={currentIndex}
            src={displayImages[currentIndex]}
            alt={`${alt} (${String(currentIndex + 1)} of ${String(totalImages)})`}
            className={[
              styles.image,
              currentIndex === 0 ? styles.imageCover : styles.imageContain,
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
        </AnimatePresence>
      </div>

      {/* Navigation arrows (desktop) */}
      {showArrows && hasMultipleImages && (
        <>
          <button
            type="button"
            className={[styles.navButton, styles.navButtonPrev].filter(Boolean).join(" ")}
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={[styles.navButton, styles.navButtonNext].filter(Boolean).join(" ")}
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRightIcon />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && hasMultipleImages && (
        <div className={styles.dots} role="tablist" aria-label="Gallery images">
          {displayImages.map((_, index) => (
            <button
              key={index}
              type="button"
              className={[styles.dot, index === currentIndex ? styles.dotActive : ""].filter(Boolean).join(" ")}
              onClick={() => {
                goToIndex(index);
              }}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to image ${String(index + 1)}`}
            />
          ))}
        </div>
      )}

    </div>
  );
}

export default ImageGallery;
