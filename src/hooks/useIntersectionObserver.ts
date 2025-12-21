/**
 * Intersection Observer hook for lazy loading.
 *
 * Provides a ref and visibility state based on Intersection Observer API.
 * Used for lazy loading images, virtualisation, and scroll-based effects.
 */

import { useEffect, useRef, useState, useCallback, type RefObject } from "react";

/**
 * Options for the intersection observer.
 */
interface UseIntersectionObserverOptions {
  /** Intersection threshold (0-1), default 0 */
  threshold?: number;
  /** Root margin for triggering early/late, default "200px" */
  rootMargin?: string;
  /** Only trigger once (for lazy loading), default true */
  triggerOnce?: boolean;
  /** Whether the observer is enabled, default true */
  enabled?: boolean;
}

/**
 * Hook that tracks element visibility using Intersection Observer.
 *
 * @param options - Configuration options
 * @returns Tuple of [ref to attach, isVisible boolean]
 *
 * @example
 * ```tsx
 * function LazyComponent() {
 *   const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
 *     rootMargin: "100px",
 *     triggerOnce: true,
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       {isVisible ? <ExpensiveContent /> : <Placeholder />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, boolean] {
  const {
    threshold = 0,
    rootMargin = "200px",
    triggerOnce = true,
    enabled = true,
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    // If already visible and triggerOnce, no need to observe
    if (isVisible && triggerOnce) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, enabled, isVisible]);

  return [ref, isVisible];
}

/**
 * Hook for multiple elements using a single observer.
 *
 * More efficient for large lists where many elements need observation.
 *
 * @param callback - Called when visibility changes for an element
 * @param options - Observer options
 * @returns Function to get a ref callback for each element
 */
export function useIntersectionObserverCallback(
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0, rootMargin = "200px", enabled = true } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<Element>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          callback(entry);
        });
      },
      { threshold, rootMargin }
    );

    // Observe all registered elements
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback, threshold, rootMargin, enabled]);

  // Return a callback to attach to elements
  const observe = useCallback((element: Element | null) => {
    if (!element) return;

    elementsRef.current.add(element);
    observerRef.current?.observe(element);
  }, []);

  const unobserve = useCallback((element: Element | null) => {
    if (!element) return;

    elementsRef.current.delete(element);
    observerRef.current?.unobserve(element);
  }, []);

  return { observe, unobserve };
}
