/**
 * Error boundary for TanStack Query errors.
 *
 * Provides a reset mechanism that clears query errors and allows retry.
 */

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";
import styles from "./QueryErrorBoundary.module.css";

interface QueryErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;

  /** Optional custom error message */
  errorMessage?: string;
}

/**
 * Error fallback component displayed when a query error occurs.
 */
function ErrorFallback({
  error,
  resetErrorBoundary,
  errorMessage,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  errorMessage?: string;
}) {
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
      <button
        type="button"
        onClick={resetErrorBoundary}
        className={styles.retryButton}
      >
        Try again
      </button>
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
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
