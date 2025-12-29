# Edit Mode

Learn how to modify card data within itemdeck.

## What is Edit Mode?

Edit Mode allows you to modify card data directly in the browser. Changes are stored locally and can be exported as JSON.

**Key points:**
- Edits are stored in your browser's localStorage
- Original collection data remains unchanged
- Edits can be exported and shared
- Edits persist across browser sessions

## Entering Edit Mode

### Via Keyboard

Press `E` to toggle Edit Mode on or off.

### Via Settings

1. Press `S` to open Settings
2. Go to **System** tab
3. Select **Developer** sub-tab
4. Toggle "Edit Mode" on

### Visual Indicator

When Edit Mode is active, an indicator appears in the interface showing you're in editing mode.

## Editing Card Data

### Step 1: Open Card Detail

1. Double-click any card to open the detail view
2. Or select a card and press `Enter`

### Step 2: Edit Fields

In Edit Mode, editable fields display with input controls:

- Text fields show as editable text boxes
- Numbers show as number inputs
- Some fields may be read-only

### Step 3: Save Changes

Changes save automatically as you type. There's no explicit save button.

### What Can Be Edited

| Field Type | Editable | Notes |
|------------|----------|-------|
| Title | Yes | Card display name |
| Summary | Yes | Brief description |
| Verdict | Yes | Longer opinion/review |
| Year | Yes | Numeric field |
| Custom fields | Varies | Depends on schema |
| Images | No | URLs only (not uploads) |
| ID | No | System identifier |

## Viewing Your Edits

### Edit Count

The Settings panel shows how many cards have been edited.

### Finding Edited Cards

Edited cards may display differently in the grid (implementation varies).

### Reviewing Changes

Open any card's detail view to see current values, which include your edits merged with original data.

## Exporting Edited Data

### Export All Edits

1. Go to Settings > **Data** tab
2. Find the Export section
3. Click "Export Edits"
4. A JSON file downloads with all your changes

### Export Format

The export contains:

```json
{
  "version": 1,
  "exportedAt": "2024-01-15T10:30:00Z",
  "collectionId": "my-collection",
  "editCount": 5,
  "edits": {
    "item-id-1": {
      "fields": {
        "title": "Updated Title",
        "verdict": "New verdict text"
      },
      "editedAt": 1705312200000
    }
  }
}
```

### Import Edits

To restore exported edits:

1. Go to Settings > **Data** tab
2. Click "Import Edits"
3. Select your exported JSON file
4. Choose merge or replace mode

| Mode | Behaviour |
|------|-----------|
| Merge | Combines with existing edits, keeping conflicts |
| Replace | Overwrites all existing edits |

## Reverting Changes

### Revert Single Field

In the edit form, look for a revert button next to each field.

### Revert Single Card

In the card detail view, find the revert option to clear all edits for that card.

### Revert All Edits

1. Go to Settings > **Data** tab
2. Click "Revert All Edits"
3. Confirm the action

**Warning**: This permanently deletes all your edits.

## How Edits Work

### Overlay Pattern

Edits use an "overlay" pattern:

1. Original collection data loads from source
2. Your edits are stored separately in localStorage
3. At display time, edits are merged over original data
4. Original data is never modified

### Data Persistence

| Data Type | Storage | Persistence |
|-----------|---------|-------------|
| Original collection | Remote/local source | Reloaded each session |
| Your edits | localStorage | Persists in browser |
| Exported edits | JSON file | Portable, shareable |

### Limitations

- Edits are per-browser (not synced)
- Clearing browser data deletes edits
- Maximum storage limited by browser (~5MB typically)
- No cloud backup (export manually)

---

## Related Documentation

- [Exporting Data](exporting-data.md) - All export options
- [Settings Reference](../reference/settings.md) - Edit mode settings
- [Your First Collection](../tutorials/first-collection.md) - Collection structure
