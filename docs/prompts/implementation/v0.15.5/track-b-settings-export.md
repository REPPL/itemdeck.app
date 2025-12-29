# Track B: Settings Export/Import (F-081)

## Features

- F-081: Settings JSON Export/Import

## Implementation Prompt

```
Implement improved Settings JSON Export/Import with Zod validation for itemdeck.

## Context

Basic export/import already exists in SettingsTab.tsx. This enhancement adds:
- Zod schema validation
- Replace/Merge import modes
- Version migration support
- Proper error handling with Toast

## Phase 1: Create Zod Schema

Create src/schemas/settingsExport.schema.ts:

```typescript
/**
 * Zod schema for settings export/import validation.
 */
import { z } from "zod";

// Current settings store version
export const SETTINGS_EXPORT_VERSION = 26;

// Schema for exportable settings (matches settingsStore state)
export const exportableSettingsSchema = z.object({
  layout: z.enum(["grid", "list", "compact", "fit"]).optional(),
  cardSizePreset: z.enum(["small", "medium", "large"]).optional(),
  cardAspectRatio: z.enum(["3:4", "5:7", "1:1"]).optional(),
  maxVisibleCards: z.number().int().min(1).max(10).optional(),
  cardBackDisplay: z.enum(["year", "logo", "both", "none"]).optional(),
  shuffleOnLoad: z.boolean().optional(),
  reduceMotion: z.enum(["system", "on", "off"]).optional(),
  highContrast: z.boolean().optional(),
  titleDisplayMode: z.enum(["truncate", "wrap"]).optional(),
  dragModeEnabled: z.boolean().optional(),
  visualTheme: z.enum(["retro", "modern", "minimal"]).optional(),
  // ... include all exportable settings from settingsStore
  themeCustomisations: z.record(
    z.enum(["retro", "modern", "minimal"]),
    z.object({
      borderRadius: z.enum(["none", "small", "medium", "large"]).optional(),
      borderWidth: z.enum(["none", "small", "medium", "large"]).optional(),
      shadowIntensity: z.enum(["none", "subtle", "medium", "strong"]).optional(),
      animationStyle: z.enum(["none", "subtle", "smooth", "bouncy"]).optional(),
      accentColour: z.string().optional(),
      // ... other theme customisation fields
    })
  ).optional(),
});

export type ExportableSettings = z.infer<typeof exportableSettingsSchema>;

// Full export format
export const settingsExportSchema = z.object({
  version: z.number().int().min(1),
  exportedAt: z.string().datetime(),
  settings: exportableSettingsSchema,
});

export type SettingsExport = z.infer<typeof settingsExportSchema>;

// Validation helpers
export function validateSettingsExport(data: unknown) {
  return settingsExportSchema.safeParse(data);
}

export function formatSettingsValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}
```

## Phase 2: Create Export/Import Utilities

Create src/utils/settingsExport.ts:

```typescript
/**
 * Settings export/import utilities.
 */
import {
  settingsExportSchema,
  SETTINGS_EXPORT_VERSION,
  formatSettingsValidationError,
  type SettingsExport,
  type ExportableSettings,
} from "@/schemas/settingsExport.schema";
import { useSettingsStore } from "@/stores/settingsStore";

export type ImportMode = "replace" | "merge";

/**
 * Export current settings to a downloadable JSON file.
 */
export function exportSettingsToFile(): void {
  const state = useSettingsStore.getState();

  const exportData: SettingsExport = {
    version: SETTINGS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings: extractExportableSettings(state),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `itemdeck-settings-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import settings from a file.
 */
export async function importSettingsFromFile(
  file: File,
  mode: ImportMode
): Promise<{ settingsCount: number; version: number }> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const result = settingsExportSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid settings file:\n${formatSettingsValidationError(result.error)}`);
  }

  const { version, settings } = result.data;
  const migratedSettings = migrateSettings(settings, version);
  applySettings(migratedSettings, mode);

  return {
    settingsCount: Object.keys(migratedSettings).length,
    version,
  };
}

function extractExportableSettings(state: ReturnType<typeof useSettingsStore.getState>): ExportableSettings {
  // Extract only exportable settings (exclude transient state)
  return {
    layout: state.layout,
    cardSizePreset: state.cardSizePreset,
    // ... extract all exportable fields
  };
}

function migrateSettings(settings: ExportableSettings, fromVersion: number): ExportableSettings {
  let migrated = { ...settings };

  // Version migrations
  if (fromVersion < 26) {
    migrated.showViewButton = migrated.showViewButton ?? true;
  }

  return migrated;
}

function applySettings(settings: ExportableSettings, mode: ImportMode): void {
  const store = useSettingsStore.getState();

  if (mode === "replace") {
    store.resetToDefaults();
  }

  // Apply each setting using store setters
  if (settings.layout !== undefined) store.setLayout(settings.layout);
  // ... apply all settings
}
```

## Phase 3: Update SettingsTab UI

Modify src/components/SettingsPanel/DataTab/SettingsTab.tsx:

1. Import the new utilities:
   ```typescript
   import { exportSettingsToFile, importSettingsFromFile, type ImportMode } from "@/utils/settingsExport";
   ```

2. Add import mode state:
   ```typescript
   const [importMode, setImportMode] = useState<ImportMode>("merge");
   const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
   ```

3. Update handlers to use utilities and show Toast

4. Add import mode selector UI (Replace/Merge toggle)

## Phase 4: Add Tests

Create tests/schemas/settingsExport.test.ts:
- Test schema validates correct structure
- Test schema rejects invalid values
- Test optional fields work correctly

Create tests/utils/settingsExport.test.ts:
- Test exportSettingsToFile creates valid JSON
- Test importSettingsFromFile validates input
- Test merge mode preserves existing settings
- Test replace mode resets to defaults first
- Test version migration works

## Files to Create

- src/schemas/settingsExport.schema.ts
- src/utils/settingsExport.ts
- tests/schemas/settingsExport.test.ts
- tests/utils/settingsExport.test.ts

## Files to Modify

- src/components/SettingsPanel/DataTab/SettingsTab.tsx

## Success Criteria

- [ ] Zod schema created for settings export format
- [ ] exportSettingsToFile() creates valid JSON file
- [ ] importSettingsFromFile() validates with Zod
- [ ] Replace mode resets to defaults before applying
- [ ] Merge mode only updates provided values
- [ ] Version migration handles older exports
- [ ] Invalid JSON shows helpful error message
- [ ] UI has Replace/Merge mode selector
- [ ] Toast shows success/error messages
- [ ] All tests passing
```

---

## Related Documentation

- [F-081 Feature Spec](../../../development/roadmap/features/planned/F-081-settings-json-export.md)
- [Settings Store](../../../../src/stores/settingsStore.ts)
- [Existing editExport.ts Pattern](../../../../src/utils/editExport.ts)
