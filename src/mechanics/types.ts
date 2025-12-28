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
 * Props for mechanic settings component.
 * @see ADR-020 for settings isolation pattern
 */
export interface MechanicSettingsProps<TSettings = unknown> {
  /** Current settings values */
  settings: TSettings;
  /** Callback to update settings */
  onChange: (settings: Partial<TSettings>) => void;
  /** Whether settings are disabled (e.g., during active game) */
  disabled?: boolean;
}

/**
 * Full mechanic interface.
 * @template TSettings - Type of mechanic-specific settings
 */
export interface Mechanic<TSettings = unknown> {
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
  /** Optional settings component with props */
  Settings?: ComponentType<MechanicSettingsProps<TSettings>>;
  /** Get current mechanic settings (ADR-020) */
  getSettings?: () => TSettings;
  /** Update mechanic settings (ADR-020) */
  setSettings?: (settings: Partial<TSettings>) => void;
  /** Default settings values */
  defaultSettings?: TSettings;
}

/**
 * Factory function for lazy loading mechanics.
 * Uses explicit any for Settings component to allow typed mechanics.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MechanicFactory = () => Promise<Mechanic<any>>;
