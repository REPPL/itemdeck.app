/**
 * Settings search hook with fuzzy matching.
 *
 * Provides search functionality for the settings panel,
 * allowing users to filter settings by keyword.
 *
 * @module hooks/useSettingsSearch
 */

import { useState, useMemo, useCallback } from "react";

/**
 * Searchable setting definition.
 */
export interface SearchableSetting {
  /** Unique setting identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Tab containing this setting */
  tab: "quick" | "system" | "appearance" | "data";
  /** Sub-tab within the parent tab (optional) */
  subTab?: string;
  /** Additional search keywords */
  keywords: string[];
}

/**
 * Search result with match score.
 */
export interface SettingSearchResult extends SearchableSetting {
  /** Match score (higher = better match) */
  score: number;
}

/**
 * All searchable settings in the application.
 */
export const SEARCHABLE_SETTINGS: SearchableSetting[] = [
  // Quick Settings
  { id: "visual-theme", label: "Theme", description: "Visual theme preset", tab: "quick", keywords: ["retro", "modern", "minimal", "style"] },
  { id: "card-size", label: "Card Size", tab: "quick", keywords: ["small", "medium", "large", "layout"] },
  { id: "view-mode", label: "View Mode", tab: "quick", keywords: ["grid", "list", "compact", "layout"] },
  { id: "shuffle", label: "Shuffle on Load", tab: "quick", keywords: ["random", "order", "sort"] },
  { id: "random-selection", label: "Random Selection", tab: "quick", keywords: ["subset", "filter", "count"] },
  { id: "statistics", label: "Statistics Bar", tab: "quick", keywords: ["stats", "count", "info"] },
  { id: "mechanics", label: "Mechanics", description: "Game mechanics overlay", tab: "quick", keywords: ["game", "memory", "play"] },
  { id: "refresh", label: "Refresh Data", tab: "quick", keywords: ["reload", "update", "sync"] },

  // System Settings
  { id: "dark-mode", label: "Dark Mode", tab: "system", keywords: ["theme", "light", "night", "colour"] },
  { id: "reduce-motion", label: "Reduce Motion", tab: "system", keywords: ["animation", "accessibility", "a11y"] },
  { id: "high-contrast", label: "High Contrast", tab: "system", keywords: ["accessibility", "a11y", "visibility"] },
  { id: "show-help", label: "Show Help Button", tab: "system", keywords: ["ui", "visibility"] },
  { id: "show-settings", label: "Show Settings Button", tab: "system", keywords: ["ui", "visibility"] },
  { id: "show-search", label: "Show Search Bar", tab: "system", keywords: ["ui", "visibility"] },
  { id: "devtools", label: "TanStack DevTools", tab: "system", keywords: ["developer", "debug"] },

  // Appearance > Theme
  { id: "border-radius", label: "Border Radius", tab: "appearance", subTab: "theme", keywords: ["corners", "rounded", "square"] },
  { id: "border-width", label: "Border Width", tab: "appearance", subTab: "theme", keywords: ["outline", "stroke"] },
  { id: "shadow", label: "Shadow", tab: "appearance", subTab: "theme", keywords: ["depth", "elevation"] },
  { id: "card-background", label: "Card Background", tab: "appearance", subTab: "theme", keywords: ["colour", "color"] },
  { id: "accent-colour", label: "Accent Colour", tab: "appearance", subTab: "theme", keywords: ["highlight", "color"] },
  { id: "hover-colour", label: "Hover Colour", tab: "appearance", subTab: "theme", keywords: ["interactive", "color"] },
  { id: "border-colour", label: "Border Colour", tab: "appearance", subTab: "theme", keywords: ["outline", "color"] },
  { id: "text-colour", label: "Text Colour", tab: "appearance", subTab: "theme", keywords: ["font", "color"] },
  { id: "transparency", label: "Overlay Transparency", tab: "appearance", subTab: "theme", keywords: ["opacity", "blur"] },
  { id: "footer-style", label: "Footer Style", tab: "appearance", subTab: "theme", keywords: ["dark", "light", "overlay"] },
  { id: "more-button", label: "More Button Label", tab: "appearance", subTab: "theme", keywords: ["verdict", "details"] },
  { id: "auto-expand", label: "Auto-expand More", tab: "appearance", subTab: "theme", keywords: ["overlay", "automatic"] },
  { id: "zoom-image", label: "Zoom Image", tab: "appearance", subTab: "theme", keywords: ["fill", "scale"] },
  { id: "animation-style", label: "Animation Style", tab: "appearance", subTab: "theme", keywords: ["motion", "smooth", "bouncy"] },
  { id: "flip-animation", label: "Card Flip", tab: "appearance", subTab: "theme", keywords: ["animation", "turn"] },
  { id: "detail-animation", label: "Detail View Animation", tab: "appearance", subTab: "theme", keywords: ["motion", "open"] },
  { id: "overlay-animation", label: "Overlay Animation", tab: "appearance", subTab: "theme", keywords: ["motion", "fade"] },
  { id: "browse-themes", label: "Browse Themes", tab: "appearance", subTab: "theme", keywords: ["external", "community"] },

  // Appearance > Cards
  { id: "card-aspect", label: "Aspect Ratio", tab: "appearance", subTab: "cards", keywords: ["shape", "proportion"] },
  { id: "title-display", label: "Title Display", tab: "appearance", subTab: "cards", keywords: ["truncate", "wrap", "text"] },
  { id: "rank-badge", label: "Show Rank Badge", tab: "appearance", subTab: "cards", keywords: ["number", "position"] },
  { id: "device-badge", label: "Show Device Badge", tab: "appearance", subTab: "cards", keywords: ["platform"] },
  { id: "footer-badge", label: "Footer Badge Field", tab: "appearance", subTab: "cards", keywords: ["platform", "field"] },
  { id: "unranked-text", label: "Unranked Placeholder", tab: "appearance", subTab: "cards", keywords: ["missing", "text"] },
  { id: "card-back-display", label: "Card Back Display", tab: "appearance", subTab: "cards", keywords: ["year", "logo"] },
  { id: "subtitle-field", label: "Subtitle Field", tab: "appearance", subTab: "cards", keywords: ["front", "year", "text"] },
  { id: "logo-field", label: "Logo Field", tab: "appearance", subTab: "cards", keywords: ["image", "back"] },

  // Appearance > Fields (Config)
  { id: "title-field", label: "Title Field", tab: "appearance", subTab: "fields", keywords: ["mapping", "data"] },
  { id: "sort-field", label: "Sort Field", tab: "appearance", subTab: "fields", keywords: ["order", "mapping"] },
  { id: "sort-direction", label: "Sort Direction", tab: "appearance", subTab: "fields", keywords: ["ascending", "descending"] },

  // Appearance > Interactions
  { id: "drag-mode", label: "Drag Mode", tab: "appearance", subTab: "interactions", keywords: ["interaction", "reorder"] },
  { id: "show-drag-icon", label: "Show Drag Icon", tab: "appearance", subTab: "interactions", keywords: ["ui", "grip"] },
  { id: "edit-mode", label: "Edit Mode", tab: "appearance", subTab: "interactions", keywords: ["modify", "change"] },
  { id: "default-card-face", label: "Default Card Face", tab: "appearance", subTab: "interactions", keywords: ["front", "back", "start"] },

  // Data > Sources
  { id: "sources", label: "Data Sources", tab: "data", subTab: "sources", keywords: ["remote", "url", "collection"] },
  { id: "add-source", label: "Add MyPlausibleMe Collection", tab: "data", subTab: "sources", keywords: ["github", "remote"] },

  // Data > Cache
  { id: "cache-stats", label: "Cache Statistics", tab: "data", subTab: "cache", keywords: ["storage", "size", "images"] },
  { id: "clear-cache", label: "Clear Cache", tab: "data", subTab: "cache", keywords: ["delete", "remove", "storage"] },
  { id: "recache", label: "Re-cache Images", tab: "data", subTab: "cache", keywords: ["download", "refresh"] },

  // Data > Import/Export
  { id: "export-collection", label: "Export Collection", tab: "data", subTab: "import-export", keywords: ["download", "json", "csv", "backup"] },
  { id: "import-collection", label: "Import Collection", tab: "data", subTab: "import-export", keywords: ["upload", "json", "restore"] },
  { id: "export-edits", label: "Export Edits", tab: "data", subTab: "import-export", keywords: ["download", "changes", "backup"] },
  { id: "import-edits", label: "Import Edits", tab: "data", subTab: "import-export", keywords: ["upload", "changes", "restore"] },
  { id: "revert-edits", label: "Revert All Edits", tab: "data", subTab: "import-export", keywords: ["undo", "reset", "discard"] },
];

/**
 * Calculate match score between query and text.
 * Higher score = better match.
 */
function calculateMatchScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact match
  if (t === q) return 100;

  // Starts with query
  if (t.startsWith(q)) return 80;

  // Contains query as substring
  if (t.includes(q)) return 60;

  // Word boundary match (query matches start of a word)
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) return 70;
  }

  // Character sequence match (fuzzy)
  // e.g., "drk" matches "Dark Mode"
  let qIdx = 0;
  let consecutiveBonus = 0;
  let lastMatchIdx = -1;

  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      // Bonus for consecutive matches
      if (i === lastMatchIdx + 1) {
        consecutiveBonus += 5;
      }
      lastMatchIdx = i;
      qIdx++;
    }
  }

  if (qIdx === q.length) {
    // All characters matched
    const baseScore = 30;
    const lengthPenalty = Math.max(0, (t.length - q.length) * 0.5);
    return Math.max(10, baseScore + consecutiveBonus - lengthPenalty);
  }

  return 0;
}

/**
 * Search settings and return matches sorted by relevance.
 */
function searchSettings(query: string, settings: SearchableSetting[]): SettingSearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const results: SettingSearchResult[] = [];

  for (const setting of settings) {
    let bestScore = 0;

    // Check label
    const labelScore = calculateMatchScore(query, setting.label);
    bestScore = Math.max(bestScore, labelScore);

    // Check description
    if (setting.description) {
      const descScore = calculateMatchScore(query, setting.description) * 0.8;
      bestScore = Math.max(bestScore, descScore);
    }

    // Check keywords
    for (const keyword of setting.keywords) {
      const keywordScore = calculateMatchScore(query, keyword) * 0.7;
      bestScore = Math.max(bestScore, keywordScore);
    }

    // Check tab/subTab
    const tabScore = calculateMatchScore(query, setting.tab) * 0.5;
    bestScore = Math.max(bestScore, tabScore);

    if (setting.subTab) {
      const subTabScore = calculateMatchScore(query, setting.subTab) * 0.5;
      bestScore = Math.max(bestScore, subTabScore);
    }

    if (bestScore > 0) {
      results.push({ ...setting, score: bestScore });
    }
  }

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Hook result type.
 */
export interface UseSettingsSearchResult {
  /** Current search query */
  query: string;
  /** Update search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SettingSearchResult[];
  /** Whether search is active (has query) */
  isSearching: boolean;
  /** Clear search */
  clearSearch: () => void;
}

/**
 * Hook for searching settings.
 */
export function useSettingsSearch(): UseSettingsSearchResult {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    return searchSettings(query, SEARCHABLE_SETTINGS);
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching: query.trim().length > 0,
    clearSearch,
  };
}

/**
 * Get tab display name.
 */
export function getTabDisplayName(tab: SearchableSetting["tab"]): string {
  switch (tab) {
    case "quick":
      return "Quick";
    case "system":
      return "System";
    case "appearance":
      return "Appearance";
    case "data":
      return "Data";
  }
}

/**
 * Get sub-tab display name.
 */
export function getSubTabDisplayName(subTab: string | undefined): string {
  if (!subTab) return "";

  const names: Record<string, string> = {
    theme: "Theme",
    cards: "Cards",
    fields: "Fields",
    interactions: "Interactions",
    sources: "Sources",
    cache: "Cache",
    "import-export": "Import/Export",
  };

  return names[subTab] ?? subTab;
}
