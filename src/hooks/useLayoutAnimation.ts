/**
 * Layout animation is now handled purely via CSS.
 * This hook is kept for API compatibility but does nothing.
 *
 * The animation works by using absolute positioning within a
 * relative container, with CSS transitions on left/top properties.
 */
export function useLayoutAnimation(
  _containerRef: React.RefObject<HTMLElement | null>,
  _itemSelector: string,
  _duration = 300
) {
  // Animation now handled by CSS and AbsoluteGrid component
}
