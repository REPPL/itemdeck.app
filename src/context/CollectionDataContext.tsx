/**
 * Collection Data Context - Provides loaded collection data and UI labels.
 *
 * This context loads the collection data once and provides it to all consumers,
 * along with collection-specific UI labels. This avoids duplicate fetching
 * and ensures UI labels are available throughout the component tree.
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocalCollection, type DisplayCard, type CollectionResult } from "@/hooks/useCollection";
import { CollectionUIProvider } from "./CollectionUIContext";
import { useSettingsStore, computeSmartSelectionDefault } from "@/stores/settingsStore";
import { useEditsStore } from "@/stores/editsStore";
import { useActiveSourceUrl } from "@/stores/sourceStore";
import type { DisplayConfig } from "@/types/display";
import type { CollectionConfig } from "@/types/schema";

/**
 * Collection data exposed to consumers.
 */
interface CollectionData {
  /** Cards ready for display */
  cards: DisplayCard[];

  /** Display configuration from collection */
  displayConfig?: DisplayConfig;

  /** Collection configuration for defaults */
  config?: CollectionConfig;

  /** Raw collection data (for export) */
  collection?: CollectionResult["collection"];

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;
}

const CollectionDataContext = createContext<CollectionData | null>(null);

interface CollectionDataProviderProps {
  children: ReactNode;
}

/**
 * Provider that loads collection data and provides UI labels context.
 *
 * This should wrap the main application content to ensure:
 * 1. Collection data is loaded once and shared
 * 2. UI labels from the collection are available via useUILabels()
 *
 * @example
 * ```tsx
 * <CollectionDataProvider>
 *   <CardGrid />
 * </CollectionDataProvider>
 * ```
 */
export function CollectionDataProvider({ children }: CollectionDataProviderProps) {
  // Get the active source URL from the source store
  const sourceUrl = useActiveSourceUrl();

  // Load collection from the active source
  const { data, isLoading, error } = useLocalCollection({ basePath: sourceUrl });
  const applyCollectionDefaults = useSettingsStore((s) => s.applyCollectionDefaults);
  const applyCollectionSettings = useSettingsStore((s) => s.applyCollectionSettings);
  const setRandomSelectionCount = useSettingsStore((s) => s.setRandomSelectionCount);
  const hasAppliedDefaults = useSettingsStore((s) => s.hasAppliedCollectionDefaults);
  const edits = useEditsStore((s) => s.edits);

  // Apply collection defaults for new users (only once)
  useEffect(() => {
    if (data?.config && !hasAppliedDefaults) {
      applyCollectionDefaults(data.config);
    }
  }, [data?.config, hasAppliedDefaults, applyCollectionDefaults]);

  // Apply collection-specific settings from settings.json (every load)
  // Uses sourceUrl as the sourceId for tracking which collection's defaults have been applied
  useEffect(() => {
    if (data?.settings && sourceUrl) {
      applyCollectionSettings(sourceUrl, data.settings);
    }
  }, [data?.settings, sourceUrl, applyCollectionSettings]);

  // Apply smart default for random selection count based on collection size
  useEffect(() => {
    if (data?.cards && data.cards.length > 0) {
      const smartDefault = computeSmartSelectionDefault(data.cards.length);
      setRandomSelectionCount(smartDefault);
    }
  }, [data?.cards?.length, setRandomSelectionCount]);

  // Merge edits with source cards using overlay pattern
  const mergedCards = useMemo(() => {
    if (!data?.cards) return [];

    return data.cards.map((card) => {
      const edit = edits[card.id];
      if (!edit) return card;

      // Merge edit fields over source card
      // _editedAt serves as both "has edits" indicator and timestamp
      return {
        ...card,
        ...edit.fields,
        _editedAt: edit.editedAt,
      } as DisplayCard;
    });
  }, [data?.cards, edits]);

  const collectionData: CollectionData = {
    cards: mergedCards,
    displayConfig: data?.displayConfig,
    config: data?.config,
    collection: data?.collection,
    isLoading,
    error: error ?? null,
  };

  return (
    <CollectionDataContext.Provider value={collectionData}>
      <CollectionUIProvider labels={data?.uiLabels}>
        {children}
      </CollectionUIProvider>
    </CollectionDataContext.Provider>
  );
}

/**
 * Hook to access collection data.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { cards, isLoading, error } = useCollectionData();
 *   if (isLoading) return <Loading />;
 *   return <CardList cards={cards} />;
 * }
 * ```
 */
export function useCollectionData(): CollectionData {
  const context = useContext(CollectionDataContext);
  if (!context) {
    throw new Error("useCollectionData must be used within CollectionDataProvider");
  }
  return context;
}

export type { CollectionData, CollectionResult };
