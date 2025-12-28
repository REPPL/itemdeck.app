/**
 * YouTube video embed component.
 *
 * Shows a thumbnail preview that loads the video player on click.
 * Respects user interaction - no autoplay on initial view.
 * Falls back to a "Watch on YouTube" link if embedding is unavailable.
 *
 * @module components/ImageGallery/YouTubeEmbed
 */

import { useState, useCallback } from "react";
import { getYouTubeThumbnail, getYouTubeEmbedUrl } from "@/types/media";
import styles from "./YouTubeEmbed.module.css";

/**
 * Play button icon.
 */
function PlayIcon() {
  return (
    <svg
      viewBox="0 0 68 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M66.52 7.74c-.78-2.93-3.07-5.24-5.98-6.03C55.24 0 34 0 34 0S12.76 0 7.46 1.71c-2.91.79-5.2 3.1-5.98 6.03C0 13.08 0 24 0 24s0 10.92 1.48 16.26c.78 2.93 3.07 5.24 5.98 6.03C12.76 48 34 48 34 48s21.24 0 26.54-1.71c2.91-.79 5.2-3.1 5.98-6.03C68 34.92 68 24 68 24s0-10.92-1.48-16.26z"
        fill="red"
      />
      <path d="M45 24l-18 10V14l18 10z" fill="white" />
    </svg>
  );
}

/**
 * External link icon for "Watch on YouTube" fallback.
 */
function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="16"
      height="16"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

interface YouTubeEmbedProps {
  /** YouTube video ID */
  videoId: string;

  /** Title for accessibility */
  title?: string;

  /** Additional class name */
  className?: string;
}

/**
 * YouTube video embed with thumbnail preview.
 *
 * Shows a clickable thumbnail that loads the video player on interaction.
 * Supports keyboard navigation (Enter/Space to play).
 *
 * @example
 * ```tsx
 * <YouTubeEmbed
 *   videoId="dQw4w9WgXcQ"
 *   title="Rick Astley - Never Gonna Give You Up"
 * />
 * ```
 */
export function YouTubeEmbed({
  videoId,
  title = "YouTube video",
  className,
}: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handlePlay();
      }
    },
    [handlePlay]
  );

  const containerClass = [styles.container, className]
    .filter(Boolean)
    .join(" ");

  // Show iframe when playing
  if (isPlaying) {
    return (
      <div className={containerClass}>
        <iframe
          className={styles.iframe}
          src={getYouTubeEmbedUrl(videoId, { autoplay: true })}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Show thumbnail with play button and "Watch on YouTube" link
  return (
    <div className={containerClass}>
      <div
        className={styles.thumbnailWrapper}
        role="button"
        tabIndex={0}
        onClick={handlePlay}
        onKeyDown={handleKeyDown}
        aria-label={`Play video: ${title}`}
      >
        <img
          className={styles.thumbnail}
          src={getYouTubeThumbnail(videoId, "hqdefault")}
          alt={`Thumbnail for ${title}`}
          loading="lazy"
          draggable="false"
        />
        <div className={styles.playButton}>
          <PlayIcon />
        </div>
      </div>
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.watchLink}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <ExternalLinkIcon />
        <span>Watch on YouTube</span>
      </a>
    </div>
  );
}

export default YouTubeEmbed;
