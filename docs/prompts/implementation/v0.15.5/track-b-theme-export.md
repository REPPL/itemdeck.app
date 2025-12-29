# Track B: Theme Export/Import (F-082)

## Features

- F-082: Theme JSON Export/Import

## Implementation Prompt

```
Implement improved Theme Customisation Export/Import for itemdeck.

## Context

Basic theme export/import exists in ThemesTab.tsx. This enhancement adds:
- Export only customisation overrides (not full theme)
- Zod validation on import
- Option to switch to base theme on import
- Named theme exports

## Phase 1: Create Zod Schema

Create src/schemas/themeExport.schema.ts:

```typescript
/**
 * Zod schema for theme customisation export/import.
 */
import { z } from "zod";

export const THEME_EXPORT_VERSION = 1;

// Hex colour validation
const hexColourSchema = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);

const themeCustomisationSchema = z.object({
  borderRadius: z.enum(["none", "small", "medium", "large"]).optional(),
  borderWidth: z.enum(["none", "small", "medium", "large"]).optional(),
  shadowIntensity: z.enum(["none", "subtle", "medium", "strong"]).optional(),
  animationStyle: z.enum(["none", "subtle", "smooth", "bouncy"]).optional(),
  accentColour: hexColourSchema.optional(),
  hoverColour: hexColourSchema.optional(),
  cardBackgroundColour: hexColourSchema.optional(),
  borderColour: hexColourSchema.optional(),
  textColour: hexColourSchema.optional(),
  detailTransparency: z.enum(["none", "25", "50", "75"]).optional(),
  overlayStyle: z.enum(["dark", "light"]).optional(),
  moreButtonLabel: z.string().optional(),
  autoExpandMore: z.boolean().optional(),
  zoomImage: z.boolean().optional(),
  flipAnimation: z.boolean().optional(),
  detailAnimation: z.boolean().optional(),
  overlayAnimation: z.boolean().optional(),
  verdictAnimationStyle: z.enum(["slide", "flip"]).optional(),
  fontFamily: z.string().optional(),
  fontUrl: z.string().url().optional(),
  cardBackBackgroundImage: z.string().url().optional(),
  cardBackBackgroundMode: z.enum(["full", "tiled", "none"]).optional(),
});

export type ThemeCustomisationExport = z.infer<typeof themeCustomisationSchema>;

export const themeExportSchema = z.object({
  version: z.literal(THEME_EXPORT_VERSION),
  exportedAt: z.string().datetime(),
  baseTheme: z.enum(["retro", "modern", "minimal"]),
  name: z.string().min(1).optional(),
  customisation: themeCustomisationSchema,
});

export type ThemeExport = z.infer<typeof themeExportSchema>;

export function validateThemeExport(data: unknown) {
  return themeExportSchema.safeParse(data);
}

export function formatThemeValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}
```

## Phase 2: Create Export/Import Utilities

Create src/utils/themeExport.ts:

```typescript
/**
 * Theme customisation export/import utilities.
 */
import {
  themeExportSchema,
  THEME_EXPORT_VERSION,
  formatThemeValidationError,
  type ThemeExport,
  type ThemeCustomisationExport,
} from "@/schemas/themeExport.schema";
import {
  useSettingsStore,
  DEFAULT_THEME_CUSTOMISATIONS,
  type VisualTheme,
  type ThemeCustomisation,
} from "@/stores/settingsStore";

/**
 * Export current theme customisation (only overrides from defaults).
 */
export function exportThemeToFile(theme: VisualTheme, customName?: string): void {
  const state = useSettingsStore.getState();
  const currentCustomisation = state.themeCustomisations[theme];
  const defaults = DEFAULT_THEME_CUSTOMISATIONS[theme];

  // Extract only the overrides
  const overrides = extractOverrides(currentCustomisation, defaults);

  const exportData: ThemeExport = {
    version: THEME_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    baseTheme: theme,
    name: customName,
    customisation: overrides,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `itemdeck-theme-${theme}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Extract only the customisation values that differ from defaults.
 */
function extractOverrides(
  current: ThemeCustomisation,
  defaults: ThemeCustomisation
): ThemeCustomisationExport {
  const overrides: ThemeCustomisationExport = {};

  for (const key of Object.keys(current) as (keyof ThemeCustomisation)[]) {
    if (current[key] !== defaults[key]) {
      (overrides as Record<string, unknown>)[key] = current[key];
    }
  }

  return overrides;
}

/**
 * Import theme customisation from file.
 */
export async function importThemeFromFile(
  file: File,
  switchToBaseTheme: boolean = true
): Promise<{ baseTheme: VisualTheme; overrideCount: number }> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const result = themeExportSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid theme file:\n${formatThemeValidationError(result.error)}`);
  }

  const { baseTheme, customisation } = result.data;
  const store = useSettingsStore.getState();

  // Switch to base theme if requested
  if (switchToBaseTheme && store.visualTheme !== baseTheme) {
    store.setVisualTheme(baseTheme);
  }

  // Apply customisation to the base theme
  store.setThemeCustomisation(baseTheme, customisation);

  return {
    baseTheme,
    overrideCount: Object.keys(customisation).length,
  };
}

/**
 * Check if current theme has customisations (differs from defaults).
 */
export function hasThemeCustomisations(theme: VisualTheme): boolean {
  const state = useSettingsStore.getState();
  const current = state.themeCustomisations[theme];
  const defaults = DEFAULT_THEME_CUSTOMISATIONS[theme];
  return JSON.stringify(current) !== JSON.stringify(defaults);
}
```

## Phase 3: Update ThemesTab UI

Modify src/components/SettingsPanel/DataTab/ThemesTab.tsx:

1. Import new utilities
2. Replace inline export/import with utility functions
3. Add "Switch to theme" checkbox option for import
4. Add optional custom name input for export
5. Show count of overrides being exported
6. Use Toast for feedback instead of alert()

## Phase 4: Add Tests

Create tests/schemas/themeExport.test.ts:
- Test schema validates correct structure
- Test hex colour validation
- Test version literal check

Create tests/utils/themeExport.test.ts:
- Test exports only overrides (not defaults)
- Test import applies customisation correctly
- Test switchToBaseTheme option
- Test hasThemeCustomisations detection

## Files to Create

- src/schemas/themeExport.schema.ts
- src/utils/themeExport.ts
- tests/schemas/themeExport.test.ts
- tests/utils/themeExport.test.ts

## Files to Modify

- src/components/SettingsPanel/DataTab/ThemesTab.tsx

## Success Criteria

- [ ] Zod schema created for theme export format
- [ ] exportThemeToFile() exports only overrides
- [ ] importThemeFromFile() validates with Zod
- [ ] Import optionally switches to base theme
- [ ] hasThemeCustomisations() detects modifications
- [ ] Invalid JSON shows helpful error message
- [ ] Hex colour validation works
- [ ] Toast shows success/error messages
- [ ] All tests passing
```

---

## Related Documentation

- [F-082 Feature Spec](../../../development/roadmap/features/planned/F-082-theme-json-export.md)
- [F-081 Settings Export](./track-b-settings-export.md)
- [Theme Customisation Types](../../../../src/stores/settingsStore.ts)
