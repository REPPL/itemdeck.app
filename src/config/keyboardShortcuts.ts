/**
 * Centralised keyboard shortcuts configuration.
 *
 * Single source of truth for all keyboard shortcuts in the application.
 * All components should import shortcuts from here rather than hardcoding.
 *
 * @see F-110: Keyboard Shortcuts Review
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Keyboard shortcut definition with optional modifiers.
 */
export interface KeyboardShortcut {
  /** Key code (e.g., "KeyA", "Escape", "ArrowLeft") */
  key: string;
  /** Whether Ctrl/Cmd is required */
  ctrl?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt is required */
  alt?: boolean;
  /** Human-readable description of the shortcut */
  description: string;
  /** Keys to display in UI (e.g., ["Ctrl", "S"]) */
  displayKeys: string[];
}

/**
 * Shortcut category for grouping in help modal.
 */
export interface ShortcutCategory {
  /** Category label */
  label: string;
  /** Shortcuts in this category */
  shortcuts: KeyboardShortcut[];
}

// ============================================================================
// Navigation Keys (single keys, no modifiers)
// ============================================================================

/**
 * Navigation key codes (arrows and vim-style).
 * Used for grid navigation and list scrolling.
 */
export const NAVIGATION_KEYS = {
  /** Move left: Arrow Left or H (vim) */
  left: ["ArrowLeft", "KeyH"],
  /** Move right: Arrow Right or L (vim) */
  right: ["ArrowRight", "KeyL"],
  /** Move up: Arrow Up or K (vim) */
  up: ["ArrowUp", "KeyK"],
  /** Move down: Arrow Down or J (vim) */
  down: ["ArrowDown", "KeyJ"],
  /** Select/activate: Enter or Space */
  select: ["Enter", "Space"],
  /** Go back/close: Escape or Backspace */
  back: ["Escape", "Backspace"],
  /** Focus search: Slash */
  search: ["Slash"],
} as const;

// ============================================================================
// Action Shortcuts (with modifiers)
// ============================================================================

/**
 * Action shortcuts that require modifier keys.
 * These perform app-wide actions and use Ctrl/Cmd modifiers.
 */
export const ACTION_SHORTCUTS = {
  settings: {
    key: "KeyS",
    ctrl: true,
    description: "Open settings",
    displayKeys: ["Ctrl", "S"],
  } as KeyboardShortcut,
  shuffle: {
    key: "KeyR",
    ctrl: true,
    description: "Shuffle cards",
    displayKeys: ["Ctrl", "R"],
  } as KeyboardShortcut,
  editMode: {
    key: "KeyE",
    ctrl: true,
    description: "Toggle edit mode",
    displayKeys: ["Ctrl", "E"],
  } as KeyboardShortcut,
  help: {
    key: "Slash",
    shift: true,
    description: "Show help (?)",
    displayKeys: ["?"],
  } as KeyboardShortcut,
  adminMode: {
    key: "KeyA",
    ctrl: true,
    description: "Toggle admin/settings panel",
    displayKeys: ["Ctrl", "A"],
  } as KeyboardShortcut,
} as const;

// ============================================================================
// Navigation Shortcuts (single keys)
// ============================================================================

/**
 * Navigation shortcuts for card grid and UI.
 * Single keys without modifiers for quick navigation.
 */
export const NAVIGATION_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "ArrowLeft",
    description: "Navigate left / Previous card",
    displayKeys: ["\u2190"],
  },
  {
    key: "ArrowRight",
    description: "Navigate right / Next card",
    displayKeys: ["\u2192"],
  },
  {
    key: "ArrowUp",
    description: "Navigate up / Previous row",
    displayKeys: ["\u2191"],
  },
  {
    key: "ArrowDown",
    description: "Navigate down / Next row",
    displayKeys: ["\u2193"],
  },
  {
    key: "KeyH",
    description: "Navigate left (vim)",
    displayKeys: ["H"],
  },
  {
    key: "KeyJ",
    description: "Navigate down (vim)",
    displayKeys: ["J"],
  },
  {
    key: "KeyK",
    description: "Navigate up (vim)",
    displayKeys: ["K"],
  },
  {
    key: "KeyL",
    description: "Navigate right (vim)",
    displayKeys: ["L"],
  },
];

/**
 * Card interaction shortcuts.
 */
export const CARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "Enter",
    description: "Flip/select focused card",
    displayKeys: ["Enter"],
  },
  {
    key: "Space",
    description: "Flip/select focused card",
    displayKeys: ["Space"],
  },
  {
    key: "Escape",
    description: "Close expanded card / overlay",
    displayKeys: ["Esc"],
  },
  {
    key: "Home",
    description: "Go to first card",
    displayKeys: ["Home"],
  },
  {
    key: "End",
    description: "Go to last card",
    displayKeys: ["End"],
  },
];

// ============================================================================
// Shortcut Categories (for Help Modal)
// ============================================================================

/**
 * All shortcuts organised by category for display in help modal.
 */
export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    label: "Navigation",
    shortcuts: [
      {
        key: "ArrowLeft",
        description: "Navigate between cards",
        displayKeys: ["\u2190", "\u2192"],
      },
      {
        key: "ArrowUp",
        description: "Navigate grid rows",
        displayKeys: ["\u2191", "\u2193"],
      },
      {
        key: "KeyH",
        description: "Vim navigation (h/j/k/l)",
        displayKeys: ["H", "J", "K", "L"],
      },
      {
        key: "Home",
        description: "Go to first/last card",
        displayKeys: ["Home", "End"],
      },
    ],
  },
  {
    label: "Card Interaction",
    shortcuts: [
      {
        key: "Enter",
        description: "Flip focused card",
        displayKeys: ["Enter", "Space"],
      },
      {
        key: "Escape",
        description: "Close expanded card / overlay",
        displayKeys: ["Esc"],
      },
    ],
  },
  {
    label: "Actions",
    shortcuts: [
      ACTION_SHORTCUTS.help,
      ACTION_SHORTCUTS.settings,
      ACTION_SHORTCUTS.shuffle,
      ACTION_SHORTCUTS.editMode,
      ACTION_SHORTCUTS.adminMode,
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a key matches any of the navigation key codes.
 */
export function isNavigationKey(
  code: string,
  direction: keyof typeof NAVIGATION_KEYS
): boolean {
  const keys = NAVIGATION_KEYS[direction] as readonly string[];
  return keys.includes(code);
}

/**
 * Format shortcut for display in UI.
 * @param shortcut - The shortcut to format
 * @returns Array of key strings to display
 */
export function formatShortcutKeys(shortcut: KeyboardShortcut): string[] {
  const keys: string[] = [];

  if (shortcut.ctrl) {
    keys.push("Ctrl");
  }
  if (shortcut.shift) {
    keys.push("Shift");
  }
  if (shortcut.alt) {
    keys.push("Alt");
  }

  // Add the main key(s)
  keys.push(...shortcut.displayKeys.filter((k) => !["Ctrl", "Shift", "Alt"].includes(k)));

  return keys;
}
