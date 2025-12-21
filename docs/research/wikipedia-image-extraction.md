# Wikipedia Image Extraction Research

Research into extracting images and attribution from Wikipedia and other sources for itemdeck cards.

---

## Current State

Items in our collection have a `detailUrl` field pointing to external sources:

```json
{
  "id": "pitfall-vcs2600",
  "title": "Pitfall",
  "detailUrl": "https://en.wikipedia.org/wiki/Pitfall!",
  "year": "1982",
  "summary": "Iconic jungle platformer..."
}
```

We need to:
1. Extract a representative image from the URL
2. Capture attribution/license information
3. Display credits appropriately

---

## Wikipedia/Wikimedia APIs

### Method 1: PageImages API (Recommended for Article Images)

The [PageImages extension](https://www.mediawiki.org/wiki/Extension:PageImages) returns the single most appropriate thumbnail for an article.

**API Endpoint:**
```
https://en.wikipedia.org/w/api.php?action=query
  &titles=Pitfall!
  &prop=pageimages
  &pithumbsize=400
  &format=json
  &origin=*
```

**Response:**
```json
{
  "query": {
    "pages": {
      "12345": {
        "pageid": 12345,
        "title": "Pitfall!",
        "thumbnail": {
          "source": "https://upload.wikimedia.org/.../400px-Pitfall!_Coverart.png",
          "width": 400,
          "height": 300
        },
        "pageimage": "Pitfall!_Coverart.png"
      }
    }
  }
}
```

**Parameters:**
| Parameter | Description |
|-----------|-------------|
| `pithumbsize` | Thumbnail width in pixels |
| `piprop` | `thumbnail`, `name`, `original` |
| `pilicense` | `free` (only free images) or `any` |

### Method 2: ImageInfo with ExtMetadata (For Attribution)

The [CommonsMetadata extension](https://www.mediawiki.org/wiki/Extension:CommonsMetadata) provides license and attribution data via the `extmetadata` field.

**API Endpoint:**
```
https://commons.wikimedia.org/w/api.php?action=query
  &titles=File:Pitfall!_Coverart.png
  &prop=imageinfo
  &iiprop=url|extmetadata
  &iiurlwidth=400
  &format=json
```

**Response with Attribution:**
```json
{
  "query": {
    "pages": {
      "-1": {
        "title": "File:Pitfall!_Coverart.png",
        "imageinfo": [{
          "url": "https://upload.wikimedia.org/.../Pitfall!_Coverart.png",
          "thumburl": "https://upload.wikimedia.org/.../400px-Pitfall!_Coverart.png",
          "extmetadata": {
            "Artist": {
              "value": "Activision",
              "source": "commons-desc-page"
            },
            "LicenseShortName": {
              "value": "Fair use",
              "source": "commons-desc-page"
            },
            "LicenseUrl": {
              "value": "https://en.wikipedia.org/wiki/Fair_use"
            },
            "AttributionRequired": {
              "value": "true",
              "source": "commons-desc-page"
            },
            "Credit": {
              "value": "Box art scan",
              "source": "commons-desc-page"
            },
            "UsageTerms": {
              "value": "Fair use for identification"
            }
          }
        }]
      }
    }
  }
}
```

**Key ExtMetadata Fields:**
| Field | Description |
|-------|-------------|
| `Artist` | Creator/author name |
| `Credit` | Credit line to use |
| `Attribution` | Custom attribution (replaces Artist + Credit) |
| `AttributionRequired` | Boolean - legal requirement to attribute |
| `LicenseShortName` | e.g., "CC BY-SA 4.0", "Public domain" |
| `LicenseUrl` | Link to license text |
| `UsageTerms` | Full license description |
| `ObjectName` | Title of the work |
| `DateTimeOriginal` | Original creation date |

### Method 3: Combined Query (Image + Metadata in One Call)

For Wikipedia articles, combine pageimages with additional props:

```
https://en.wikipedia.org/w/api.php?action=query
  &titles=Pitfall!
  &prop=pageimages|info
  &pithumbsize=400
  &inprop=url
  &format=json
  &origin=*
```

Then use the `pageimage` filename to query Commons for attribution.

---

## Two-Step Extraction Process

### Step 1: Get Image from Article

```typescript
async function getArticleImage(articleUrl: string): Promise<ImageData | null> {
  const title = extractTitleFromUrl(articleUrl);
  const apiUrl = `https://en.wikipedia.org/w/api.php?` +
    `action=query&titles=${encodeURIComponent(title)}` +
    `&prop=pageimages&pithumbsize=400&piprop=thumbnail|name` +
    `&format=json&origin=*`;

  const response = await fetch(apiUrl);
  const data = await response.json();
  const page = Object.values(data.query.pages)[0];

  if (!page.thumbnail) return null;

  return {
    thumbnailUrl: page.thumbnail.source,
    filename: page.pageimage,
    width: page.thumbnail.width,
    height: page.thumbnail.height,
  };
}
```

### Step 2: Get Attribution from Commons

```typescript
async function getImageAttribution(filename: string): Promise<Attribution | null> {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?` +
    `action=query&titles=File:${encodeURIComponent(filename)}` +
    `&prop=imageinfo&iiprop=url|extmetadata` +
    `&format=json&origin=*`;

  const response = await fetch(apiUrl);
  const data = await response.json();
  const page = Object.values(data.query.pages)[0];

  if (!page.imageinfo?.[0]?.extmetadata) return null;

  const meta = page.imageinfo[0].extmetadata;

  return {
    artist: meta.Artist?.value ?? 'Unknown',
    license: meta.LicenseShortName?.value ?? 'Unknown',
    licenseUrl: meta.LicenseUrl?.value,
    credit: meta.Credit?.value,
    attributionRequired: meta.AttributionRequired?.value === 'true',
    usageTerms: meta.UsageTerms?.value,
  };
}
```

---

## Schema Changes Required

### Option A: Minimal - Add imageUrl Only

```json
{
  "id": "pitfall-vcs2600",
  "title": "Pitfall",
  "imageUrl": "https://upload.wikimedia.org/.../400px-Pitfall!_Coverart.png",
  "detailUrl": "https://en.wikipedia.org/wiki/Pitfall!"
}
```

**Pros:** Simple, works with current architecture
**Cons:** No attribution tracking, manual image selection

### Option B: Full Attribution (Recommended)

```json
{
  "id": "pitfall-vcs2600",
  "title": "Pitfall",
  "image": {
    "url": "https://upload.wikimedia.org/.../400px-Pitfall!_Coverart.png",
    "thumbnailUrl": "https://upload.wikimedia.org/.../200px-Pitfall!_Coverart.png",
    "filename": "Pitfall!_Coverart.png",
    "attribution": {
      "artist": "Activision",
      "license": "Fair use",
      "licenseUrl": "https://en.wikipedia.org/wiki/Fair_use",
      "credit": "Box art scan",
      "source": "Wikimedia Commons",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pitfall!_Coverart.png"
    }
  },
  "detailUrl": "https://en.wikipedia.org/wiki/Pitfall!"
}
```

**Pros:** Full attribution, supports acknowledgement page
**Cons:** More complex schema, larger JSON files

### Option C: Hybrid - Separate Attribution Index

Keep items simple, maintain attribution in separate file:

**items.json:**
```json
{
  "id": "pitfall-vcs2600",
  "imageUrl": "https://upload.wikimedia.org/.../400px-Pitfall!_Coverart.png"
}
```

**attributions.json:**
```json
{
  "Pitfall!_Coverart.png": {
    "artist": "Activision",
    "license": "Fair use",
    "licenseUrl": "https://en.wikipedia.org/wiki/Fair_use",
    "credit": "Box art scan",
    "source": "Wikimedia Commons"
  }
}
```

**Pros:** Clean separation, single source of truth for attributions
**Cons:** Two files to maintain, need to cross-reference

---

## Acknowledgement Page/Overlay Design

### Aggregated Credits View

```markdown
## Image Credits

All images are used under their respective licenses.

### Creative Commons Attribution
| Image | Artist | License |
|-------|--------|---------|
| Pitfall! | Activision | Fair use |
| Street Fighter II | Capcom | CC BY-SA 4.0 |
| Lemmings | DMA Design | Public domain |

### Fair Use
Images used under fair use for identification and commentary purposes.

### External Sources
- Wikipedia/Wikimedia Commons
- MobyGames (where applicable)
```

### Per-Card Attribution

On card detail view or info overlay:

```
📷 Image: Activision
📄 License: Fair use
🔗 Source: Wikimedia Commons
```

---

## Non-Wikipedia Sources

### MobyGames

Some items link to MobyGames (e.g., `https://www.myabandonware.com/`). These require different handling:

- No standardised API for image extraction
- May need manual image URLs
- Different attribution requirements

### Recommended Approach

1. **Wikipedia URLs**: Use PageImages API + CommonsMetadata
2. **Other URLs**: Manual `imageUrl` field required
3. **No URL**: Use SVG placeholder (already implemented)

---

## Implementation Recommendations

### Phase 1: Schema Extension

1. Add optional `image` object to card schema
2. Support both `imageUrl` (simple) and `image.url` (full)
3. Add `attribution` sub-object for credits

### Phase 2: Extraction Utility

1. Create `extractWikipediaImage(articleUrl)` utility
2. Batch process existing items with Wikipedia URLs
3. Save results to items.json

### Phase 3: Attribution Display

1. Add "Credits" link in footer/settings
2. Create AcknowledgementsPage component
3. Show per-card attribution in CardDetailModal

### Phase 4: Build-Time Processing (Optional)

1. Create build script to fetch/update images
2. Cache attribution data locally
3. Generate acknowledgements page at build time

---

## API Rate Limits & Best Practices

### Wikimedia API Guidelines

- **User-Agent Required**: Must identify your application
- **Rate Limit**: ~200 requests/second (be conservative)
- **Caching**: Cache responses, images rarely change
- **etag/If-Modified-Since**: Use for efficient polling

### Example User-Agent

```
User-Agent: itemdeck/1.0 (https://github.com/REPPL/itemdeck; contact@example.com)
```

---

## Conclusion

**Recommendation:** Use Option B (Full Attribution) with:

1. Extended card schema including `image` object
2. Two-step API calls: PageImages → CommonsMetadata
3. Aggregated acknowledgements page
4. Per-card attribution in detail modal
5. Build-time extraction script for batch processing

This approach:
- Respects content licenses
- Provides proper attribution
- Supports future expansion to other sources
- Keeps UI clean with optional detailed credits

---

## Related Documentation

- [Card Data Schema](../development/roadmap/features/completed/F-008-card-data-schema.md)
- [Image Fallback System](../development/roadmap/features/completed/F-003-image-fallback-system.md)
- [Card UI Design Patterns](./card-ui-design-patterns.md)

---

## Sources

- [MediaWiki API:Images](https://www.mediawiki.org/wiki/API:Images)
- [MediaWiki API:Imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo)
- [Extension:PageImages](https://www.mediawiki.org/wiki/Extension:PageImages)
- [Extension:CommonsMetadata](https://www.mediawiki.org/wiki/Extension:CommonsMetadata)
- [Wikimedia API Portal - Reusing Free Images](https://api.wikimedia.org/wiki/Reusing_free_images_and_media_files_with_Python)
- [Commons:Credit line](https://commons.wikimedia.org/wiki/Commons:Credit_line)
- [gbv/image-attribution](https://github.com/gbv/image-attribution) - Third-party attribution helper
