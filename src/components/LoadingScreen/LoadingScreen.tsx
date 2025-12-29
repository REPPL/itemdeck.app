/**
 * Loading screen component with progress indication.
 *
 * Displays a themed loading screen during collection loading
 * and optional image preloading phases. Shows GitHub context
 * (avatar and username) when loading from MyPlausibleMe sources.
 *
 * @see F-078: GitHub-aware loading screen with avatar
 * @see F-080: Per-collection cache consent dialog
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useImagePreloader } from "@/hooks/useImageCache";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSourceStore } from "@/stores/sourceStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isCollectionCached, listCachedCollections, type CacheInfo } from "@/lib/cardCache";
import { CacheConsentDialog } from "@/components/CacheConsentDialog";
import styles from "./LoadingScreen.module.css";

/**
 * Format cache age as human-readable string.
 */
function formatCacheAge(ageMs: number): string {
  const hours = Math.floor(ageMs / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour ago";
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${String(hours)} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${String(days)} days ago`;
}

/**
 * Loading phases.
 * - collection: Loading collection data
 * - consent: Waiting for cache consent (F-080)
 * - images: Preloading images
 * - complete: All done
 */
type LoadingPhase = "collection" | "consent" | "images" | "complete";

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

  // Cache consent state (F-080)
  const cacheConsentPreference = useSettingsStore((s) => s.cacheConsentPreference);
  const hasCacheConsent = useSettingsStore((s) => s.hasCacheConsent);

  // Get active source for GitHub context
  const activeSourceId = useSourceStore((s) => s.activeSourceId);
  const sources = useSourceStore((s) => s.sources);
  const activeSource = sources.find((s) => s.id === activeSourceId);

  // Extract GitHub username from MyPlausibleMe source
  const githubUsername = useMemo(() => {
    if (!activeSource) return null;

    // Direct MyPlausibleMe source with stored username
    if (activeSource.sourceType === "myplausibleme" && activeSource.mpmUsername) {
      return activeSource.mpmUsername;
    }

    // Parse from URL for legacy sources
    const url = activeSource.url;
    // Match jsdelivr format: /gh/{username}/MyPlausibleMe@...
    const jsdelivrMatch = /\/gh\/([^/]+)\/MyPlausibleMe@/.exec(url);
    if (jsdelivrMatch?.[1]) {
      return jsdelivrMatch[1];
    }

    // Match raw GitHub format: /{username}/MyPlausibleMe/...
    const rawMatch = /raw\.githubusercontent\.com\/([^/]+)\/MyPlausibleMe\//.exec(url);
    if (rawMatch?.[1]) {
      return rawMatch[1];
    }

    return null;
  }, [activeSource]);

  // GitHub avatar URL (uses GitHub's public avatar endpoint)
  const githubAvatarUrl = githubUsername
    ? `https://github.com/${githubUsername}.png?size=128`
    : null;

  // Collection name from source
  const collectionName = activeSource?.name ?? activeSource?.mpmFolder ?? null;

  const [phase, setPhase] = useState<LoadingPhase>("collection");
  const [startTime] = useState(() => Date.now());
  const [isVisible, setIsVisible] = useState(true);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);

  // Offline detection
  const isOnline = useOnlineStatus();
  const [hasCachedData, setHasCachedData] = useState<boolean | null>(null);
  const [cachedCollections, setCachedCollections] = useState<CacheInfo[]>([]);

  // Check for cached data when offline
  useEffect(() => {
    if (!isOnline && activeSourceId) {
      // Check if current source has cache
      void isCollectionCached(activeSourceId).then(setHasCachedData);
      // List all available cached collections
      void listCachedCollections().then(setCachedCollections);
    }
  }, [isOnline, activeSourceId]);

  // Get all image URLs from cards
  const imageUrls = useMemo(() => {
    if (cards.length === 0) return [];
    return cards.flatMap((card) => card.imageUrls).filter(Boolean);
  }, [cards]);

  // Check if consent is needed for the current source
  const needsCacheConsent = useMemo(() => {
    if (!activeSourceId) return false;
    // Built-in sources don't need consent
    if (activeSource?.isBuiltIn) return false;
    // Check preference
    if (cacheConsentPreference === "always") return false;
    if (cacheConsentPreference === "never") return false;
    // "ask" mode: check if we already have consent for this source
    return !hasCacheConsent(activeSourceId);
  }, [activeSourceId, activeSource?.isBuiltIn, cacheConsentPreference, hasCacheConsent]);

  // Handle consent dialog responses
  const handleConsentAllow = useCallback(() => {
    setConsentDialogOpen(false);
    // Proceed to image preloading
    if (shouldPreloadImages && imageUrls.length > 0) {
      setPhase("images");
      void preload(imageUrls);
    } else {
      setPhase("complete");
    }
  }, [shouldPreloadImages, imageUrls, preload]);

  const handleConsentDeny = useCallback(() => {
    setConsentDialogOpen(false);
    // Skip image preloading, go directly to complete
    setPhase("complete");
  }, []);

  // Handle collection loading complete
  useEffect(() => {
    if (!isLoadingCollection && cards.length > 0 && phase === "collection") {
      // Check if we need consent before caching images
      if (needsCacheConsent && shouldPreloadImages && imageUrls.length > 0) {
        setPhase("consent");
        setConsentDialogOpen(true);
      } else if (shouldPreloadImages && imageUrls.length > 0) {
        setPhase("images");
        void preload(imageUrls);
      } else {
        setPhase("complete");
      }
    }
  }, [isLoadingCollection, cards.length, phase, shouldPreloadImages, imageUrls, preload, needsCacheConsent]);

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

  // Calculate overall progress (must be before early returns to maintain hook order)
  const overallProgress = phase === "collection"
    ? 0
    : phase === "consent"
    ? 10 // Show some progress during consent
    : phase === "images"
    ? 10 + progressPercent * 0.8 // Images are 80% of perceived loading after consent
    : 100;

  // Build contextual status text (must be before early returns to maintain hook order)
  const statusText = useMemo(() => {
    // Add collection name context when available
    if (phase === "collection") {
      if (githubUsername) {
        return `Loading from ${githubUsername}'s collection...`;
      }
      return "Loading collection...";
    }

    if (phase === "consent") {
      return "Waiting for permission...";
    }

    if (phase === "images") {
      const displayName = collectionName ?? "images";
      return `Caching ${displayName}... ${String(Math.round(progressPercent))}%`;
    }

    return "Ready!";
  }, [phase, progressPercent, githubUsername, collectionName]);

  const mainContainerClass = [styles.container, styles[visualTheme as keyof typeof styles]].filter(Boolean).join(" ");

  // Handle offline state with error
  if (!isOnline && (error || isLoadingCollection)) {
    const containerClass = [styles.container, styles[visualTheme as keyof typeof styles]].filter(Boolean).join(" ");

    // Show cached option if available
    if (hasCachedData === true) {
      // We have cache for current source - proceed normally (cache will be used)
      // Don't show error, let the loading continue
    } else {
      // No cache available - show offline message
      return (
        <div className={containerClass}>
          <div className={styles.content}>
            <div className={styles.offlineIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            </div>
            <h2 className={styles.offlineTitle}>You appear to be offline</h2>
            <p className={styles.offlineMessage}>
              Cannot reach the collection source. Check your internet connection and try again.
            </p>

            {cachedCollections.length > 0 && (
              <div className={styles.cachedCollections}>
                <p className={styles.cachedLabel}>Previously viewed collections:</p>
                <ul className={styles.cachedList}>
                  {cachedCollections.slice(0, 5).map((cache) => (
                    <li key={cache.sourceId} className={styles.cachedItem}>
                      <span className={styles.cachedName}>{cache.sourceId}</span>
                      <span className={styles.cachedAge}>
                        {formatCacheAge(cache.ageMs)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className={styles.retryButton}
              onClick={() => { window.location.reload(); }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
  }

  // Handle error (when online)
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

  return (
    <div className={mainContainerClass}>
      <div className={styles.content}>
        {/* GitHub avatar when loading from MyPlausibleMe */}
        {githubAvatarUrl ? (
          <div className={styles.githubContext}>
            <img
              src={githubAvatarUrl}
              alt={`${githubUsername ?? "User"}'s GitHub avatar`}
              className={styles.githubAvatar}
              loading="eager"
              draggable="false"
            />
            <span className={styles.githubUsername}>{githubUsername ?? ""}</span>
            {collectionName && (
              <span className={styles.collectionName}>{collectionName}</span>
            )}
          </div>
        ) : (
          <div className={styles.logo}>
            <svg viewBox="0 0 48 48" className={styles.logoIcon}>
              {/* Simple deck of cards icon */}
              <rect x="8" y="12" width="24" height="32" rx="2" className={styles.card1} />
              <rect x="12" y="8" width="24" height="32" rx="2" className={styles.card2} />
              <rect x="16" y="4" width="24" height="32" rx="2" className={styles.card3} />
            </svg>
          </div>
        )}

        <h1 className={styles.title}>itemdeck</h1>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${String(overallProgress)}%` }}
            />
          </div>
          {/* ARIA live region for screen readers */}
          <p
            className={styles.status}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {statusText}
          </p>
        </div>

        {phase === "images" && (
          <p className={styles.hint}>
            First load may take a moment while images are cached.
          </p>
        )}
      </div>

      {/* Cache consent dialog (F-080) */}
      {activeSourceId && (
        <CacheConsentDialog
          isOpen={consentDialogOpen}
          sourceId={activeSourceId}
          collectionName={collectionName ?? "External Collection"}
          onAllow={handleConsentAllow}
          onDeny={handleConsentDeny}
        />
      )}
    </div>
  );
}

export default LoadingScreen;
