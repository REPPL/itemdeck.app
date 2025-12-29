/**
 * Error boundary for TanStack Query errors.
 *
 * Provides a reset mechanism that clears query errors and allows retry.
 * Also handles the case when no collection is selected.
 */

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";
import { useSourceStore } from "@/stores/sourceStore";
import styles from "./QueryErrorBoundary.module.css";

interface QueryErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;

  /** Optional custom error message */
  errorMessage?: string;
}

/**
 * Check if error is related to missing collection/source.
 */
function isNoCollectionError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("no collection") ||
    message.includes("undefined") ||
    message.includes("null") ||
    message.includes("basepath") ||
    message.includes("404")
  );
}

/**
 * No collection fallback - shown when no source is selected.
 */
function NoCollectionFallback({
  onSelectCollection,
}: {
  onSelectCollection: () => void;
}) {
  return (
    <div role="alert" className={styles.errorContainer}>
      <h2 className={styles.noCollectionTitle}>No Collection Selected</h2>
      <p className={styles.errorMessage}>
        You haven't selected a collection yet. Choose a collection from REPPL
        to get started.
      </p>
      <button
        type="button"
        onClick={onSelectCollection}
        className={styles.retryButton}
      >
        Select Collection
      </button>
    </div>
  );
}

/**
 * Error fallback component displayed when a query error occurs.
 */
function ErrorFallback({
  error,
  resetErrorBoundary,
  errorMessage,
  onSelectCollection,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  errorMessage?: string;
  onSelectCollection: () => void;
}) {
  // Check if this is a "no collection" error
  if (isNoCollectionError(error)) {
    return <NoCollectionFallback onSelectCollection={onSelectCollection} />;
  }

  return (
    <div role="alert" className={styles.errorContainer}>
      <h2 className={styles.errorTitle}>Something went wrong</h2>
      <p className={styles.errorMessage}>
        {errorMessage ?? "Failed to load data. Please try again."}
      </p>
      <details className={styles.errorDetails}>
        <summary>Technical details</summary>
        <pre className={styles.errorPre}>{error.message}</pre>
      </details>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className={styles.retryButton}
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onSelectCollection}
          className={styles.secondaryButton}
        >
          Select different collection
        </button>
      </div>
    </div>
  );
}

/**
 * Error boundary that integrates with TanStack Query.
 *
 * When an error occurs:
 * 1. Displays a user-friendly error message
 * 2. Shows technical details in a collapsible section
 * 3. Provides a retry button that resets both the error boundary and query state
 * 4. Offers option to select a different collection
 *
 * @example
 * ```tsx
 * <QueryErrorBoundary>
 *   <CardGrid />
 * </QueryErrorBoundary>
 * ```
 */
export function QueryErrorBoundary({
  children,
  errorMessage,
}: QueryErrorBoundaryProps) {
  const setActiveSource = useSourceStore((s) => s.setActiveSource);

  const handleSelectCollection = () => {
    // Clear the active source to trigger the collection picker
    setActiveSource(null);
    // Reload the page to reset all state cleanly
    window.location.href = "/";
  };

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorFallback
              error={error as Error}
              resetErrorBoundary={resetErrorBoundary}
              errorMessage={errorMessage}
              onSelectCollection={handleSelectCollection}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
