/**
 * Animation presets for card and UI animations.
 *
 * Centralised spring physics configuration for consistent motion throughout
 * the application. Uses Framer Motion spring parameters.
 *
 * @see F-041: Card Animation Polish
 */

// ============================================================================
// Spring Presets
// ============================================================================

/**
 * Spring animation presets with varying feel.
 *
 * All presets use Framer Motion's spring physics:
 * - stiffness: How rigid the spring is (higher = faster)
 * - damping: How much the spring resists motion (higher = less bounce)
 * - mass: Optional mass factor (default 1)
 */
export const springPresets = {
  /** Gentle, slow animations - good for subtle UI changes */
  gentle: { stiffness: 120, damping: 14 },

  /** Snappy, responsive animations - good for interactions */
  snappy: { stiffness: 300, damping: 20 },

  /** Bouncy animations with overshoot - good for playful effects */
  bouncy: { stiffness: 400, damping: 10 },

  /** Smooth, eased animations - good for transitions */
  smooth: { stiffness: 100, damping: 20 },

  /** Card flip animation - balanced for 3D rotation */
  cardFlip: { stiffness: 200, damping: 18 },

  /** Card hover - quick, subtle response */
  cardHover: { stiffness: 400, damping: 25 },

  /** Grid entrance - staggered item appearance */
  gridEntrance: { stiffness: 260, damping: 20 },
} as const;

// ============================================================================
// Stagger Configuration
// ============================================================================

/**
 * Stagger timing presets for sequential animations.
 * Values in seconds.
 */
export const staggerPresets = {
  /** Fast stagger for small groups (< 10 items) */
  fast: 0.03,

  /** Medium stagger for grids (10-50 items) */
  medium: 0.05,

  /** Slow stagger for emphasis (few items) */
  slow: 0.08,

  /** Subtle stagger barely noticeable but adds polish */
  subtle: 0.02,
} as const;

// ============================================================================
// Animation Variants
// ============================================================================

/**
 * Card grid item animation variants.
 * Used with AnimatePresence and motion components.
 */
export const cardGridVariants = {
  /** Container variant - enables staggered children */
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerPresets.subtle,
        delayChildren: 0.05,
      },
    },
  },

  /** Individual card item variant */
  item: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        ...springPresets.gridEntrance,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.15,
      },
    },
  },
} as const;

/**
 * Card hover/tap animation configuration.
 */
export const cardInteractionConfig = {
  /** Hover lift effect */
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      ...springPresets.cardHover,
    },
  },

  /** Press/tap effect */
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      ...springPresets.snappy,
    },
  },
} as const;

/**
 * Card flip animation configuration.
 * Returns spring transition for flip rotation.
 */
export const cardFlipConfig = {
  transition: {
    type: "spring",
    ...springPresets.cardFlip,
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get stagger delay based on item count.
 * Uses faster stagger for larger grids to keep animation snappy.
 *
 * @param itemCount - Total number of items in the grid
 * @returns Stagger delay in seconds
 */
export function getStaggerDelay(itemCount: number): number {
  if (itemCount <= 8) {
    return staggerPresets.medium;
  }
  if (itemCount <= 24) {
    return staggerPresets.fast;
  }
  // Large grids use subtle stagger to avoid long animation
  return staggerPresets.subtle;
}

/**
 * Calculate animation delay for a specific item index.
 * Useful for manual staggering without Framer Motion variants.
 *
 * @param index - Item index (0-based)
 * @param staggerDelay - Delay between items in seconds
 * @param maxDelay - Maximum total delay to cap animation time
 * @returns Delay in seconds for this item
 */
export function getItemDelay(
  index: number,
  staggerDelay = staggerPresets.subtle,
  maxDelay = 0.5
): number {
  const delay = index * staggerDelay;
  return Math.min(delay, maxDelay);
}

// ============================================================================
// Type Exports
// ============================================================================

export type SpringPreset = keyof typeof springPresets;
export type StaggerPreset = keyof typeof staggerPresets;
