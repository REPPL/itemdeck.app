/**
 * Collection Data Context - Provides loaded collection data and UI labels.
 *
 * This context loads the collection data once and provides it to all consumers,
 * along with collection-specific UI labels. This avoids duplicate fetching
 * and ensures UI labels are available throughout the component tree.
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useDefaultCollection, type DisplayCard, type CollectionResult } from "@/hooks/useCollection";
import { CollectionUIProvider } from "./CollectionUIContext";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEditsStore } from "@/stores/editsStore";
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
  const { data, isLoading, error } = useDefaultCollection();
  const applyCollectionDefaults = useSettingsStore((s) => s.applyCollectionDefaults);
  const hasAppliedDefaults = useSettingsStore((s) => s.hasAppliedCollectionDefaults);
  const edits = useEditsStore((s) => s.edits);

  // Apply collection defaults for new users (only once)
  useEffect(() => {
    if (data?.config && !hasAppliedDefaults) {
      applyCollectionDefaults(data.config);
    }
  }, [data?.config, hasAppliedDefaults, applyCollectionDefaults]);

  // Merge edits with source cards using overlay pattern
  const mergedCards = useMemo(() => {
    if (!data?.cards) return [];

    return data.cards.map((card) => {
      const edit = edits[card.id];
      if (!edit) return card;

      // Merge edit fields over source card
      return {
        ...card,
        ...edit.fields,
        _hasEdits: true,
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
