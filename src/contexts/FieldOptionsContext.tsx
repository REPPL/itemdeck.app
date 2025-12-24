/**
 * Field options context.
 *
 * Provides dynamic field options discovered from the current collection schema.
 * Components can use the useFieldOptions hook to access field options
 * instead of relying on hardcoded options.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CollectionDefinition } from "@/types/schema";
import type { FieldOption } from "@/utils/fieldPathResolver";
import {
  discoverAllFields,
  type FieldContext,
} from "@/services/fieldDiscovery";

// Fallback options when no collection is loaded
import {
  TITLE_FIELD_OPTIONS,
  SUBTITLE_FIELD_OPTIONS,
  FOOTER_BADGE_FIELD_OPTIONS,
  LOGO_FIELD_OPTIONS,
  SORT_FIELD_OPTIONS,
} from "@/utils/fieldPathResolver";

/**
 * Field options for all contexts.
 */
interface FieldOptions {
  title: FieldOption[];
  subtitle: FieldOption[];
  badge: FieldOption[];
  footer: FieldOption[];
  logo: FieldOption[];
  sort: FieldOption[];
  image: FieldOption[];
}

/**
 * Context value interface.
 */
interface FieldOptionsContextValue {
  /** Field options discovered from the current collection */
  options: FieldOptions;
  /** Get options for a specific context */
  getOptions: (context: FieldContext) => FieldOption[];
  /** Whether options are from a loaded collection (vs fallback) */
  isLoaded: boolean;
}

/**
 * Default fallback options (from hardcoded lists).
 */
const FALLBACK_OPTIONS: FieldOptions = {
  title: TITLE_FIELD_OPTIONS,
  subtitle: SUBTITLE_FIELD_OPTIONS,
  badge: FOOTER_BADGE_FIELD_OPTIONS,
  footer: FOOTER_BADGE_FIELD_OPTIONS,
  logo: LOGO_FIELD_OPTIONS,
  sort: SORT_FIELD_OPTIONS,
  image: [],
};

/**
 * Context for field options.
 */
const FieldOptionsContext = createContext<FieldOptionsContextValue>({
  options: FALLBACK_OPTIONS,
  getOptions: (context) => FALLBACK_OPTIONS[context],
  isLoaded: false,
});

/**
 * Provider props.
 */
interface FieldOptionsProviderProps {
  /** Collection definition to discover fields from */
  definition?: CollectionDefinition;
  /** Primary entity type name */
  primaryType?: string;
  /** Children to render */
  children: ReactNode;
}

/**
 * Provider component for field options.
 *
 * Wraps the app to provide dynamically discovered field options
 * based on the current collection schema.
 *
 * @example
 * ```tsx
 * <FieldOptionsProvider definition={collection.definition} primaryType="game">
 *   <SettingsPanel />
 * </FieldOptionsProvider>
 * ```
 */
export function FieldOptionsProvider({
  definition,
  primaryType,
  children,
}: FieldOptionsProviderProps) {
  const value = useMemo<FieldOptionsContextValue>(() => {
    if (!definition || !primaryType) {
      return {
        options: FALLBACK_OPTIONS,
        getOptions: (context) => FALLBACK_OPTIONS[context],
        isLoaded: false,
      };
    }

    const discovered = discoverAllFields(definition, primaryType);

    // Merge discovered with fallbacks (fallback if discovered is empty)
    const options: FieldOptions = {
      title: discovered.title.length > 0 ? discovered.title : FALLBACK_OPTIONS.title,
      subtitle: discovered.subtitle.length > 0 ? discovered.subtitle : FALLBACK_OPTIONS.subtitle,
      badge: discovered.badge.length > 0 ? discovered.badge : FALLBACK_OPTIONS.badge,
      footer: discovered.footer.length > 0 ? discovered.footer : FALLBACK_OPTIONS.footer,
      logo: discovered.logo.length > 0 ? discovered.logo : FALLBACK_OPTIONS.logo,
      sort: discovered.sort.length > 0 ? discovered.sort : FALLBACK_OPTIONS.sort,
      image: discovered.image,
    };

    return {
      options,
      getOptions: (context) => options[context],
      isLoaded: true,
    };
  }, [definition, primaryType]);

  return (
    <FieldOptionsContext.Provider value={value}>
      {children}
    </FieldOptionsContext.Provider>
  );
}

/**
 * Hook to access field options.
 *
 * @returns Field options context value
 *
 * @example
 * ```tsx
 * function SettingsDropdown() {
 *   const { getOptions } = useFieldOptions();
 *   const subtitleOptions = getOptions("subtitle");
 *
 *   return (
 *     <Select options={subtitleOptions} />
 *   );
 * }
 * ```
 */
export function useFieldOptions(): FieldOptionsContextValue {
  return useContext(FieldOptionsContext);
}

/**
 * Hook to get options for a specific context.
 *
 * @param context - Field context
 * @returns Array of field options
 *
 * @example
 * ```tsx
 * function SortDropdown() {
 *   const sortOptions = useFieldOptionsFor("sort");
 *   return <Select options={sortOptions} />;
 * }
 * ```
 */
export function useFieldOptionsFor(context: FieldContext): FieldOption[] {
  const { getOptions } = useFieldOptions();
  return getOptions(context);
}
