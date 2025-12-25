/**
 * Loading screen component with progress indication.
 *
 * Displays a themed loading screen during collection loading
 * and optional image preloading phases.
 */

import { useEffect, useState, useMemo } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useImagePreloader } from "@/hooks/useImageCache";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./LoadingScreen.module.css";

/**
 * Loading phases.
 */
type LoadingPhase = "collection" | "images" | "complete";

/**
 * Loading screen props.
 */
interface LoadingScreenProps {
  /** Called when loading is complete */
  onComplete?: () => void;

  /** Whether to preload images (default: true) */
  preloadImages?: boolean;

  /** Minimum display time in ms (prevents flash) */
  minDisplayTime?: number;
}

/**
 * Loading screen with collection and image loading progress.
 */
export function LoadingScreen({
  onComplete,
  preloadImages: shouldPreloadImages = true,
  minDisplayTime = 500,
}: LoadingScreenProps) {
  const { cards, isLoading: isLoadingCollection, error } = useCollectionData();
  const { preload, isPreloading, progressPercent } = useImagePreloader();
  const visualTheme = useSettingsStore((s) => s.visualTheme);

  const [phase, setPhase] = useState<LoadingPhase>("collection");
  const [startTime] = useState(() => Date.now());
  const [isVisible, setIsVisible] = useState(true);

  // Get all image URLs from cards
  const imageUrls = useMemo(() => {
    if (cards.length === 0) return [];
    return cards.flatMap((card) => card.imageUrls).filter(Boolean);
  }, [cards]);

  // Handle collection loading complete
  useEffect(() => {
    if (!isLoadingCollection && cards.length > 0 && phase === "collection") {
      if (shouldPreloadImages && imageUrls.length > 0) {
        setPhase("images");
        void preload(imageUrls);
      } else {
        setPhase("complete");
      }
    }
  }, [isLoadingCollection, cards.length, phase, shouldPreloadImages, imageUrls, preload]);

  // Handle image preloading complete
  useEffect(() => {
    if (phase === "images" && !isPreloading && progressPercent === 100) {
      setPhase("complete");
    }
  }, [phase, isPreloading, progressPercent]);

  // Handle completion with minimum display time
  useEffect(() => {
    if (phase !== "complete") {
      return;
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, remaining);

    return () => { clearTimeout(timer); };
  }, [phase, startTime, minDisplayTime, onComplete]);

  // Handle error
  if (error) {
    const containerClass = [styles.container, styles[visualTheme as keyof typeof styles]].filter(Boolean).join(" ");
    return (
      <div className={containerClass}>
        <div className={styles.content}>
          <div className={styles.error}>
            <h2>Failed to load collection</h2>
            <p>{error.message}</p>
            <button onClick={() => { window.location.reload(); }}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  // Calculate overall progress
  const overallProgress = phase === "collection"
    ? 0
    : phase === "images"
    ? progressPercent * 0.9 // Images are 90% of perceived loading
    : 100;

  const statusText = phase === "collection"
    ? "Loading collection..."
    : phase === "images"
    ? `Caching images... ${String(Math.round(progressPercent))}%`
    : "Ready!";

  const mainContainerClass = [styles.container, styles[visualTheme as keyof typeof styles]].filter(Boolean).join(" ");

  return (
    <div className={mainContainerClass}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <svg viewBox="0 0 48 48" className={styles.logoIcon}>
            {/* Simple deck of cards icon */}
            <rect x="8" y="12" width="24" height="32" rx="2" className={styles.card1} />
            <rect x="12" y="8" width="24" height="32" rx="2" className={styles.card2} />
            <rect x="16" y="4" width="24" height="32" rx="2" className={styles.card3} />
          </svg>
        </div>

        <h1 className={styles.title}>itemdeck</h1>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${String(overallProgress)}%` }}
            />
          </div>
          <p className={styles.status}>{statusText}</p>
        </div>

        {phase === "images" && (
          <p className={styles.hint}>
            First load may take a moment while images are cached.
          </p>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;
