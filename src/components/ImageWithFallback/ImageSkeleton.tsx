import styles from "./ImageWithFallback.module.css";

interface ImageSkeletonProps {
  /** CSS class for styling */
  className?: string;
}

/**
 * Loading skeleton for image placeholder.
 * Displays an animated shimmer effect.
 */
export function ImageSkeleton({ className }: ImageSkeletonProps) {
  return (
    <div
      className={[styles.skeleton, className ?? ""].join(" ")}
      role="status"
      aria-label="Loading image"
    >
      <div className={styles.shimmer} />
    </div>
  );
}
