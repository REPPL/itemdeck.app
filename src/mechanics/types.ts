/**
 * Mechanic type definitions.
 *
 * Defines the interfaces for the gaming mechanics plugin system.
 */

import type { ComponentType } from "react";

/**
 * Mechanic manifest (metadata).
 */
export interface MechanicManifest {
  /** Unique mechanic identifier (kebab-case) */
  id: string;
  /** Display name */
  name: string;
  /** Description of the mechanic */
  description: string;
  /** Icon component */
  icon: ComponentType<{ className?: string }>;
  /** Semantic version */
  version: string;
  /** Required card fields for this mechanic to work */
  requiredFields?: string[];
  /** Minimum number of cards required */
  minCards?: number;
}

/**
 * Mechanic lifecycle hooks.
 */
export interface MechanicLifecycle {
  /** Called when mechanic is activated */
  onActivate?: () => void | Promise<void>;
  /** Called when mechanic is deactivated */
  onDeactivate?: () => void;
  /** Called when mechanic state is reset */
  onReset?: () => void;
}

/**
 * Base mechanic state.
 */
export interface MechanicState {
  /** Whether the mechanic is currently active */
  isActive: boolean;
  /** Additional state properties */
  [key: string]: unknown;
}

/**
 * Card actions provided by a mechanic.
 */
export interface CardActions {
  /** Handle card click */
  onClick?: (cardId: string) => void;
  /** Handle card flip */
  onFlip?: (cardId: string) => void;
  /** Check if card can be interacted with */
  canInteract?: (cardId: string) => boolean;
  /** Check if card should show special styling */
  isHighlighted?: (cardId: string) => boolean;
}

/**
 * Props for card overlay component.
 */
export interface CardOverlayProps {
  /** Card ID */
  cardId: string;
  /** Card data (optional - component can use its own store) */
  cardData?: Record<string, unknown>;
  /** Current mechanic state (optional - component can use its own store) */
  mechanicState?: MechanicState;
}

/**
 * Props for grid overlay component.
 */
export interface GridOverlayProps {
  /** Position of the overlay */
  position: "top" | "bottom";
  /** Current mechanic state (optional - component can use its own store) */
  mechanicState?: MechanicState;
}

/**
 * Full mechanic interface.
 */
export interface Mechanic {
  /** Mechanic metadata */
  manifest: MechanicManifest;
  /** Lifecycle hooks */
  lifecycle: MechanicLifecycle;
  /** Get current state */
  getState: () => MechanicState;
  /** Subscribe to state changes */
  subscribe: (listener: (state: MechanicState) => void) => () => void;
  /** Get card actions */
  getCardActions: () => CardActions;
  /** Optional card overlay component */
  CardOverlay?: ComponentType<CardOverlayProps>;
  /** Optional grid overlay component */
  GridOverlay?: ComponentType<GridOverlayProps>;
  /** Optional settings component */
  Settings?: ComponentType;
}

/**
 * Factory function for lazy loading mechanics.
 */
export type MechanicFactory = () => Promise<Mechanic>;
