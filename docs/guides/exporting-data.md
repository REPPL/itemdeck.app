# Exporting Data

Learn how to export your edits, settings, and customisations from itemdeck.

## What Can Be Exported?

Itemdeck supports exporting several types of data:

| Data Type | Format | Contents |
|-----------|--------|----------|
| Card Edits | JSON | Modified field values |
| Application Settings | JSON | All preferences |
| Theme Customisations | JSON | Colour and style settings |
| Collection Data | JSON | Filtered/selected cards |

## Export Formats

All exports use JSON format for portability and readability. Files can be:

- Imported back into itemdeck
- Edited in any text editor
- Processed by other tools
- Shared with other users

## Accessing Export Options

### Via Settings

1. Press `S` to open Settings
2. Go to the **Data** tab
3. Find the export options

### Via Collection Tracker

When using the Collection Tracker mechanic:
1. Activate Collection Tracker
2. Find the export button in the mechanic overlay

## Exporting Card Edits

### What's Included

- All cards with local modifications
- Field names and new values
- Timestamps of changes
- Collection identifier

### How to Export

1. Settings > Data > Export Edits
2. Click "Download"
3. Save the `.json` file

### Export Structure

```json
{
  "version": 1,
  "exportedAt": "2024-01-15T10:30:00Z",
  "collectionId": "my-collection",
  "editCount": 5,
  "edits": {
    "card-001": {
      "fields": {
        "title": "Updated Title",
        "verdict": "New review"
      },
      "editedAt": 1705312200000
    }
  }
}
```

## Exporting Settings

### What's Included

- Layout preferences
- Card display settings
- Theme selection and customisations
- Accessibility preferences
- Search and filter defaults

### How to Export

1. Settings > Data > Settings tab
2. Click "Export Settings"
3. Save the `.json` file

### Sharing Settings

Export files can be shared to:
- Set up identical configurations on another device
- Share recommended settings with others
- Back up before major changes

## Exporting Theme Customisations

### What's Included

Theme exports contain customisation for all themes:

- Border radius and width
- Shadow intensity
- Animation styles
- Custom colours (accent, hover, background, etc.)
- Overlay preferences

### How to Export

1. Settings > Appearance > Theme tab
2. Find "Export Theme"
3. Save the file

## Exporting Collection Data

When using certain mechanics, you can export subsets of your collection:

### Collection Tracker Export

Export your ownership/wishlist data:

1. Activate Collection Tracker
2. Click the export button
3. Choose format options
4. Download the file

### Filtered Export

Export only currently visible cards:

1. Apply search/filters to narrow cards
2. Use the export function
3. Only filtered cards are included

## Using Exported Data

### Importing Back to Itemdeck

1. Go to the relevant import section
2. Click "Import" and select your file
3. Choose merge or replace mode:

| Mode | Behaviour |
|------|-----------|
| Merge | Combines with existing data |
| Replace | Overwrites existing data |

### External Processing

Exported JSON can be:
- Opened in text editors (VS Code, Notepad++)
- Processed with scripts (Python, Node.js)
- Converted to other formats (CSV, spreadsheet)
- Analysed with data tools

### Data Portability

Exports work across:
- Different browsers (same device)
- Different devices (with file transfer)
- Different itemdeck deployments

## Best Practices

### Regular Backups

Export your edits regularly if you've made significant changes. Browser data can be lost when:
- Clearing browsing data
- Reinstalling browser
- Using private/incognito mode

### Version Control

Include dates in export filenames:
```
my-edits-2024-01-15.json
my-settings-backup.json
```

### Before Major Changes

Always export before:
- Resetting settings
- Switching collections
- Browser maintenance

---

## Related Documentation

- [Edit Mode](edit-mode.md) - Making edits
- [Settings Reference](../reference/settings.md) - All settings explained
- [Adding Remote Source](adding-remote-source.md) - Loading collections
