/**
 * Collection tracking mechanic.
 *
 * A persistent tracking tool (NOT a game) for marking cards as owned
 * or wishlisted. State persists across sessions.
 */

import { useCollectionStore } from "./store";
import { CollectionCardOverlay } from "./components/CollectionCardOverlay";
import {
  CollectionGridOverlay,
  CollectionKeyboardHandler,
} from "./components/CollectionGridOverlay";
import { CollectionSettingsPanel } from "./Settings";
import { DEFAULT_SETTINGS } from "./types";
import { useSourceStore } from "@/stores/sourceStore";
import type { Mechanic, CardActions } from "../types";
import type { CollectionSettings } from "./types";

/**
 * Collection icon.
 */
function CollectionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Checklist icon */}
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9l2 2 4-4" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

/**
 * Grid overlay wrapper that includes the keyboard handler.
 */
function CollectionGridOverlayWithKeyboard(
  props: Parameters<typeof CollectionGridOverlay>[0]
) {
  return (
    <>
      <CollectionGridOverlay {...props} />
      <CollectionKeyboardHandler />
    </>
  );
}

/**
 * Collection mechanic implementation.
 *
 * Unlike game mechanics (Memory, Snap Ranking), this is a persistent
 * tracking tool. State persists across sessions and each source/collection
 * has its own separate ownership data.
 */
export const collectionMechanic: Mechanic<CollectionSettings> = {
  manifest: {
    id: "collection",
    name: "Collection Tracker",
    description:
      "Track which items you own and which you want to acquire",
    icon: CollectionIcon,
    version: "1.0.0",
    minCards: 1,
  },

  lifecycle: {
    onActivate: () => {
      // Get current source ID and activate
      const sourceId = useSourceStore.getState().activeSourceId ?? "default";
      useCollectionStore.getState().activate(sourceId);
    },
    onDeactivate: () => {
      useCollectionStore.getState().deactivate();
    },
    onReset: () => {
      // Optional: clear current collection
      // Not called automatically - only if user explicitly resets
    },
  },

  getState: () => useCollectionStore.getState(),

  subscribe: (listener) => {
    return useCollectionStore.subscribe((state) => {
      listener(state);
    });
  },

  getCardActions: (): CardActions => ({
    onClick: () => {
      // Collection mechanic: card click opens expanded view
      // (openExpandedOnClick flag tells CardGrid to pass onOpenExpanded to Card)
      // The heart button in the corner toggles ownership (handled by CardOverlay)
    },
    canInteract: () => {
      // Allow card interaction (for opening expanded view)
      return true;
    },
    isHighlighted: () => {
      // Always show front face - all cards appear "flipped"
      return useCollectionStore.getState().isActive;
    },
    openExpandedOnClick: true,
  }),

  CardOverlay: CollectionCardOverlay,
  GridOverlay: CollectionGridOverlayWithKeyboard,
  Settings: CollectionSettingsPanel,

  defaultSettings: DEFAULT_SETTINGS,

  getSettings: () => {
    return useCollectionStore.getState().settings;
  },

  setSettings: (settings) => {
    useCollectionStore.getState().updateSettings(settings);
  },
};

// Export store
export { useCollectionStore };
