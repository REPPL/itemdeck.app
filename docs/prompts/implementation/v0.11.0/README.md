# v0.11.0 Implementation Prompt - Settings Restructure & Editing UX

## Overview

Major restructure of Settings panel organisation and improved inline editing UX for entity data.

## Changes Required

### 1. Settings Panel Restructure

#### 1.1 Main Tab Reordering

**Current order:** System | Theme | Config | Cards | Storage | Sources
**New order:** System | Theme | Cards | Config | Storage

- Remove Sources as top-level tab (moves into Storage)

#### 1.2 Storage Tab Restructure

**Current sub-tabs:** Images | Cache | Edits | About
**New sub-tabs:** Sources | Image Cache | Import/Export | About

Changes:
- **Sources tab (new):** Move entire Sources panel content here as first sub-tab
- **Image Cache tab:** Merge current Images + Cache tabs into single tab
  - Show cached images count and storage used
  - Remove "Cache Limit" note to save space
  - Ensure no scrolling required
- **Import/Export tab (new):** Consolidate all import/export functionality
  - Collection Export (CSV/JSON) - from Images tab
  - Collection Import - from Images tab
  - Edits Export - from Edits tab
  - Edits Import - from Edits tab
  - Clear All Edits - from Edits tab
- **About tab:** Keep as-is

#### 1.3 Config Tab Restructure

**Current sub-tabs:** Display | Front Face | Back Face
**New sub-tabs:** Display | Front Face | Back Face | Edit

Changes:
- **Display tab:**
  - Move Random Selection settings to TOP of Display tab
  - Remove Edit Mode toggle (moving to Edit tab)
- **Edit tab (new):**
  - Edit Mode toggle
  - Future: edit-related settings

### 2. Settings Bug Fixes

#### 2.1 System Tab - Fix Non-Functional Toggles

**Issue:** "Show Settings Button" and "Show Help Button" toggles have no effect.

**Fix:** These toggles should hide/show the respective buttons in the header. Verify the settings are being read and applied to the Header component.

#### 2.2 Theme Tab - Fix Border Colour

**Issue:** Border Colour set to #FFFFFF but border isn't white. Currently uses transparency (#ffffff33).

**Fix:** Ensure borderColour setting is applied correctly without hardcoded transparency. The user's chosen colour should be used as-is.

#### 2.3 Theme Tab - Fix Detail View Transparency

**Issue:** Transparency level setting may not be recognised/applied.

**Fix:** Verify detailTransparency setting is correctly applied to the detail view backdrop/panel.

#### 2.4 Theme Tab - Change Default Theme

**Change:** Make "Modern" the default theme instead of "Retro".

**Implementation:**
1. Change DEFAULT_SETTINGS.visualTheme from "retro" to "modern"
2. Increment store version and add migration

### 3. Editing UX Overhaul

#### 3.1 Remove Global Edit Mode

Remove the concept of a global "edit mode" toggle. Instead, editing should be contextual and discoverable.

#### 3.2 Inline Edit Icons in Detail View

Add small pencil icons next to each editable text field in the expanded card detail view:

**Editable fields:**
- Title
- Year
- Summary
- My Verdict (in verdict overlay)
- My Rank
- Any other text fields from entity data

**UX Flow:**
1. User sees small pencil icon next to editable text
2. Clicking pencil converts text to inline input field
3. User edits text
4. Pressing Enter or clicking away saves the change
5. Pressing Escape cancels the edit

**Visual design:**
- Pencil icon: small, subtle, appears on hover or always visible
- When editing: text becomes input with same styling
- Save feedback: brief checkmark or highlight

#### 3.3 Fix Edit Form Z-Index

**Issue:** Edit form modal is overlaid by the detail view.

**Fix:** Ensure EditForm portal renders above CardExpanded. Check z-index values:
- CardExpanded backdrop: z-index 1000
- EditForm overlay: z-index should be higher (1100+)

#### 3.4 Edit Mode Indicator

**Change:** Replace current edit mode indicator with yellow banner when any edits exist.

**Implementation:**
- Show yellow banner at top of screen: "You have unsaved local edits"
- Banner shows edit count
- Links to Export in Settings

### 4. Card Back Face - Dynamic Logo Option

#### 4.1 Add App Logo Option

**Current:** Card back shows platform/category logo
**New:** Option to show App Logo instead

Settings location: Cards > Back Face

Options:
- Platform/Category Logo (current behaviour)
- App Logo (new - from app assets)
- None

#### 4.2 Dynamic Terminology

**Issue:** "Platform" terminology is specific to games. Other collections might use "Interpreter" (music), "Actor" (movies), etc.

**Implementation:**
- Read terminology from collection.json displayConfig
- Field: `displayConfig.terminology.categoryLabel` (default: "Platform")
- Use this label in UI instead of hardcoded "Platform"

### 5. Card Flip Bug Fixes

#### 5.1 Cascade Flip Bug

**Issue:** When all cards show front, flipping one card to back, then flipping it back to front causes ALL other cards to flip to back.

**Steps to reproduce:**
1. Set all cards to show front (face up)
2. Flip one card to show its back
3. Flip that same card back to front
4. Bug: All other cards flip to back

**Root cause investigation needed:** Check card flip state management, particularly how maxVisibleCards and flip state interact.

#### 5.2 Shadow Persistence on Flip

**Issue:** Card shadow remains visible during flip animation, should disappear before flip starts.

**Fix:** Hide shadow during flip transition. Options:
- Set shadow opacity to 0 during animation
- Use animation timing to fade shadow before flip

### 6. Image Source Overlay Height

**Issue:** Attribution overlay button doesn't cover full text area.

**Fix:** Increase overlay height to:
- Cover from divider line (below title) to near bottom of detail view
- Maintain consistent padding above and below

## File Changes Expected

### Settings Components
- `src/components/SettingsPanel/SettingsPanel.tsx` - Tab reordering
- `src/components/SettingsPanel/StorageSettingsTabs.tsx` - Major restructure
- `src/components/SettingsPanel/ConfigSettingsTabs.tsx` - Add Edit tab, move Random Selection
- `src/components/SettingsPanel/SystemSettings.tsx` - Fix toggle functionality
- `src/components/SettingsPanel/ThemeSettings.tsx` - Fix border colour application

### Settings Store
- `src/stores/settingsStore.ts` - Change default theme, add migrations

### Card Components
- `src/components/CardExpanded/CardExpanded.tsx` - Inline editing, overlay height
- `src/components/CardExpanded/CardExpanded.module.css` - Styling updates
- `src/components/Card/Card.tsx` - Fix flip bugs
- `src/components/Card/Card.module.css` - Shadow animation fix

### Edit Components
- `src/components/EditForm/EditForm.tsx` - Z-index fix or removal
- New: `src/components/InlineEdit/InlineEdit.tsx` - Inline edit field component

### Header
- `src/components/Header/Header.tsx` - Apply show/hide button settings

## Testing Checklist

- [ ] Settings tabs appear in correct order: System | Theme | Cards | Config | Storage
- [ ] Storage sub-tabs: Sources | Image Cache | Import/Export | About
- [ ] Sources tab shows collection sources (moved from top-level)
- [ ] Image Cache shows stats without scrolling
- [ ] Import/Export has all collection and edit import/export options
- [ ] Config sub-tabs: Display | Front Face | Back Face | Edit
- [ ] Random Selection at top of Display tab
- [ ] Edit tab contains Edit Mode toggle
- [ ] Show Settings Button toggle hides/shows gear icon
- [ ] Show Help Button toggle hides/shows help icon
- [ ] Border Colour setting applies correctly (no forced transparency)
- [ ] Detail View Transparency setting applies correctly
- [ ] Default theme is Modern for new users
- [ ] Inline edit icons appear next to editable text in detail view
- [ ] Clicking edit icon enables inline editing
- [ ] Enter saves, Escape cancels inline edit
- [ ] Card flip doesn't cascade to other cards
- [ ] Card shadow disappears during flip animation
- [ ] Attribution overlay covers text area appropriately

## Dependencies

- v0.10.0 (Data Editing foundation)

## Notes

- This is a significant UX overhaul - consider user testing
- Inline editing should feel native and responsive
- Settings restructure improves discoverability
- Bug fixes improve overall polish
