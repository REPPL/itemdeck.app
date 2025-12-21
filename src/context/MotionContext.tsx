/**
 * Motion context provider.
 *
 * Wraps the app with Framer Motion's MotionConfig to respect
 * the user's reduced motion preference.
 */

import { type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Provider that configures Framer Motion to respect reduced motion preferences.
 *
 * When the user prefers reduced motion:
 * - Animations are skipped (duration reduced to near-zero)
 * - Transitions complete instantly
 */
export function MotionProvider({ children }: MotionProviderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
