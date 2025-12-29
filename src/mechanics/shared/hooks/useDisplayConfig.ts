/**
 * Hook for accessing display configuration.
 *
 * Provides responsive card size and display settings based on
 * viewport width and shared configuration defaults.
 */

import { useState, useEffect, useMemo } from "react";

/**
 * Breakpoint definition.
 */
export interface Breakpoint {
  name: string;
  maxWidth: number;
}

/**
 * Card size configuration.
 */
export interface CardSizeConfig {
  minWidth: number;
  maxWidth: number;
  aspectRatio: number;
  gap: number;
}

/**
 * Timer display configuration.
 */
export interface TimerConfig {
  showByDefault: boolean;
  warningThresholdMs: number;
  dangerThresholdMs: number;
}

/**
 * Animation configuration.
 */
export interface AnimationConfig {
  enableByDefault: boolean;
  durationMs: number;
  respectReducedMotion: boolean;
}

/**
 * Display configuration.
 */
export interface DisplayConfig {
  breakpoints: Breakpoint[];
  cardSizes: Record<string, CardSizeConfig>;
  defaultCardSize: CardSizeConfig;
  timer: TimerConfig;
  animations: AnimationConfig;
}

/**
 * Default breakpoints.
 */
const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: "mobile", maxWidth: 480 },
  { name: "tablet", maxWidth: 768 },
  { name: "desktop", maxWidth: 1024 },
  { name: "wide", maxWidth: 1440 },
];

/**
 * Default card sizes per breakpoint.
 */
const DEFAULT_CARD_SIZES: Record<string, CardSizeConfig> = {
  mobile: { minWidth: 80, maxWidth: 120, aspectRatio: 0.67, gap: 8 },
  tablet: { minWidth: 100, maxWidth: 150, aspectRatio: 0.67, gap: 12 },
  desktop: { minWidth: 120, maxWidth: 180, aspectRatio: 0.67, gap: 16 },
  wide: { minWidth: 140, maxWidth: 200, aspectRatio: 0.67, gap: 20 },
};

/**
 * Default card size.
 */
const DEFAULT_CARD_SIZE: CardSizeConfig = {
  minWidth: 120,
  maxWidth: 180,
  aspectRatio: 0.67,
  gap: 16,
};

/**
 * Default timer configuration.
 */
const DEFAULT_TIMER_CONFIG: TimerConfig = {
  showByDefault: true,
  warningThresholdMs: 30000,
  dangerThresholdMs: 10000,
};

/**
 * Default animation configuration.
 */
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  enableByDefault: true,
  durationMs: 200,
  respectReducedMotion: true,
};

/**
 * Default display configuration.
 */
const DEFAULT_CONFIG: DisplayConfig = {
  breakpoints: DEFAULT_BREAKPOINTS,
  cardSizes: DEFAULT_CARD_SIZES,
  defaultCardSize: DEFAULT_CARD_SIZE,
  timer: DEFAULT_TIMER_CONFIG,
  animations: DEFAULT_ANIMATION_CONFIG,
};

/**
 * Get the current breakpoint name based on window width.
 */
function getCurrentBreakpoint(width: number, breakpoints: Breakpoint[]): string {
  for (const bp of breakpoints) {
    if (width <= bp.maxWidth) {
      return bp.name;
    }
  }
  return "wide"; // Default to wide if beyond all breakpoints
}

/**
 * Check if user prefers reduced motion.
 */
function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hook result.
 */
export interface UseDisplayConfigResult {
  /** Current breakpoint name */
  breakpoint: string;
  /** Current card size configuration */
  cardSize: CardSizeConfig;
  /** Timer configuration */
  timer: TimerConfig;
  /** Animation configuration */
  animations: AnimationConfig;
  /** Whether animations should be enabled (respects reduced motion) */
  animationsEnabled: boolean;
  /** Full configuration */
  config: DisplayConfig;
}

/**
 * Hook options.
 */
export interface UseDisplayConfigOptions {
  /** Override configuration */
  config?: Partial<DisplayConfig>;
}

/**
 * Hook for accessing responsive display configuration.
 *
 * @param options - Configuration options
 * @returns Display configuration based on current viewport
 */
export function useDisplayConfig(
  options: UseDisplayConfigOptions = {}
): UseDisplayConfigResult {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getPrefersReducedMotion()
  );

  // Merge provided config with defaults
  const config = useMemo<DisplayConfig>(() => {
    const userConfig = options.config ?? {};
    return {
      breakpoints: userConfig.breakpoints ?? DEFAULT_CONFIG.breakpoints,
      cardSizes: userConfig.cardSizes ?? DEFAULT_CONFIG.cardSizes,
      defaultCardSize: userConfig.defaultCardSize ?? DEFAULT_CONFIG.defaultCardSize,
      timer: { ...DEFAULT_CONFIG.timer, ...userConfig.timer },
      animations: { ...DEFAULT_CONFIG.animations, ...userConfig.animations },
    };
  }, [options.config]);

  // Track window resize
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Track reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Get current breakpoint
  const breakpoint = useMemo(
    () => getCurrentBreakpoint(windowWidth, config.breakpoints),
    [windowWidth, config.breakpoints]
  );

  // Get card size for current breakpoint
  const cardSize = useMemo(
    () => config.cardSizes[breakpoint] ?? config.defaultCardSize,
    [breakpoint, config.cardSizes, config.defaultCardSize]
  );

  // Determine if animations should be enabled
  const animationsEnabled = useMemo(() => {
    if (config.animations.respectReducedMotion && prefersReducedMotion) {
      return false;
    }
    return config.animations.enableByDefault;
  }, [config.animations, prefersReducedMotion]);

  return {
    breakpoint,
    cardSize,
    timer: config.timer,
    animations: config.animations,
    animationsEnabled,
    config,
  };
}
