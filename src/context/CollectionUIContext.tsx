/**
 * Collection UI Context - Provides configurable UI labels per collection.
 *
 * Allows collection.json to specify custom labels for buttons, placeholders,
 * and other UI text. Labels merge with defaults, supporting partial overrides.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * UI labels that can be customised per collection.
 */
export interface UILabels {
  /** Label for the "More" button in detail view (e.g., "More", "Details") */
  moreButton: string;
  /** Label for platform/device category (e.g., "Platform", "System") */
  platformLabel: string;
  /** Label for acknowledgement button (e.g., "Acknowledgement", "Credits") */
  acknowledgementButton: string;
  /** Label for image source link (e.g., "Image Source", "Photo Credit") */
  imageSourceLabel: string;
  /** Default label for source links (e.g., "Source", "Learn More") */
  sourceButtonDefault: string;
  /** Placeholder text for unranked items (e.g., "The one that got away!") */
  rankPlaceholder: string;
  /** Label for Wikipedia link */
  wikipediaLabel: string;
  /** Label for "Close" buttons */
  closeLabel: string;
}

/**
 * Default UI labels used when collection doesn't specify custom values.
 */
export const DEFAULT_UI_LABELS: UILabels = {
  moreButton: "More",
  platformLabel: "Platform",
  acknowledgementButton: "Acknowledgement",
  imageSourceLabel: "Image Source",
  sourceButtonDefault: "Source",
  rankPlaceholder: "The one that got away!",
  wikipediaLabel: "Wikipedia",
  closeLabel: "Close",
};

const CollectionUIContext = createContext<UILabels>(DEFAULT_UI_LABELS);

interface CollectionUIProviderProps {
  /** Partial label overrides from collection */
  labels?: Partial<UILabels>;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider for collection-specific UI labels.
 *
 * @example
 * ```tsx
 * <CollectionUIProvider labels={{ moreButton: "Details" }}>
 *   <App />
 * </CollectionUIProvider>
 * ```
 */
export function CollectionUIProvider({
  labels,
  children,
}: CollectionUIProviderProps) {
  const mergedLabels = useMemo(
    () => ({ ...DEFAULT_UI_LABELS, ...labels }),
    [labels]
  );

  return (
    <CollectionUIContext.Provider value={mergedLabels}>
      {children}
    </CollectionUIContext.Provider>
  );
}

/**
 * Hook to access UI labels.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const labels = useUILabels();
 *   return <button>{labels.moreButton}</button>;
 * }
 * ```
 */
export function useUILabels(): UILabels {
  return useContext(CollectionUIContext);
}
