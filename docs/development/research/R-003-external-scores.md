# R-003: External Scores & Ratings Integration

## Research Question

How can itemdeck integrate external scores and ratings from reputable sources like Metacritic, and what are the legal, technical, and UX implications?

## Background

Users may want to enrich their collections with aggregated scores from external sources to provide objective rating context alongside personal ratings. This research investigates:

1. **Legal feasibility** - Terms of service, API policies, web scraping legality
2. **Technical options** - APIs, data sources, manual enrichment
3. **UX presentation** - How to display external scores alongside personal data
4. **Source icon display** - Showing source logos/icons on detailed card view

## Sources to Evaluate

### Metacritic

**URL**: https://www.metacritic.com/

**Data available**:
- Metascore (critic aggregate)
- User score
- Critic reviews
- Platform-specific scores

**API availability**: No official public API

**Terms of Service considerations**:
- Web scraping explicitly prohibited in ToS
- Data is copyright protected
- Commercial use requires licensing agreement

**Example URL pattern**:
```
https://www.metacritic.com/game/{game-slug}/critic-reviews/?platform={platform}
```

**Verdict**: ❌ Cannot scrape or use without licensing

### MobyGames

**URL**: https://www.mobygames.com/

**Data available**:
- Critic scores
- User ratings
- Platform coverage (excellent for retro games)
- Rich metadata

**API availability**: Yes, requires API key

**Terms of Service**:
- API available for non-commercial use
- Rate limits apply
- Attribution required

**API Documentation**: https://www.mobygames.com/info/api/

**Verdict**: ✅ Suitable for non-commercial projects with attribution

### RAWG

**URL**: https://rawg.io/

**Data available**:
- Aggregate scores
- Metacritic scores (they aggregate)
- Platform coverage
- Game details

**API availability**: Yes, free tier available

**Terms of Service**:
- Free API key available
- 20,000 requests/month on free tier
- Attribution required

**API Documentation**: https://api.rawg.io/docs/

**Verdict**: ✅ Good option for general game data

### OpenCritic

**URL**: https://opencritic.com/

**Data available**:
- Aggregate critic scores
- Top Critic Average
- Recommended percentage

**API availability**: Yes, requires partnership

**Terms of Service**:
- API access via partnership programme
- Not publicly available

**Verdict**: ⚠️ Requires business relationship

### IGDB (Twitch)

**URL**: https://www.igdb.com/

**Data available**:
- Aggregate ratings
- Review counts
- Extensive game database

**API availability**: Yes, requires Twitch developer account

**Terms of Service**:
- Free for non-commercial use
- Twitch Developer account required
- Attribution required

**API Documentation**: https://api-docs.igdb.com/

**Verdict**: ✅ Good option, requires Twitch account

### Wikipedia

**URL**: https://en.wikipedia.org/

**Data available**:
- Critical reception sections
- Award information
- Historical context

**API availability**: Yes, MediaWiki API

**Terms of Service**:
- CC BY-SA license
- Attribution required
- Rate limits apply

**Verdict**: ✅ Good for supplementary information

## Integration Approaches

### Option A: Manual Enrichment

**Description**: Users manually add external scores to their collection data.

**Implementation**:
```json
{
  "id": "legend-of-zelda-n64",
  "title": "Ocarina of Time",
  "externalScores": {
    "metacritic": 99,
    "ign": 10.0,
    "gamespot": 10.0
  }
}
```

**Pros**:
- No API dependencies
- No legal concerns
- Users control what data is included

**Cons**:
- Manual effort
- Data may become stale
- Inconsistent coverage

### Option B: API Integration (Runtime)

**Description**: Fetch scores from APIs at runtime.

**Implementation**:
- Use RAWG or MobyGames API
- Cache results locally
- Display alongside personal data

**Pros**:
- Always up-to-date
- Rich data available

**Cons**:
- Requires API key management
- Rate limits
- Network dependency

### Option C: Build-time Enrichment

**Description**: Enrich data during collection build process.

**Implementation**:
- CLI tool to fetch and cache scores
- Store in collection data
- No runtime API calls

**Pros**:
- No runtime dependencies
- Data can be reviewed before inclusion
- Works offline

**Cons**:
- Data may become stale
- Requires explicit refresh

### Option D: CSV Import

**Description**: Allow users to import scores from CSV/spreadsheet.

**Implementation**:
- Import format: `id,metacritic,ign,gamespot,...`
- Match on game ID or title
- Merge with existing data

**Pros**:
- User controls data
- Easy to update
- Works with any source

**Cons**:
- Manual data gathering
- Mapping can be error-prone

## UX: Displaying External Scores

### Card Front

External scores could appear as additional badges or in the footer:

```
┌────────────────────┐
│ [★5] [MC:99]      │  ← Personal + Metacritic badges
│                    │
│   [Game Image]     │
│                    │
│ Title              │
│ Year               │
└────────────────────┘
```

### Card Back

More space for detailed scores:

```
┌────────────────────┐
│                    │
│   Platform Logo    │
│                    │
│ "My verdict text"  │
│                    │
│ ─────────────────  │
│ Metacritic: 99     │
│ IGN: 10.0          │
│ User: 4.5/5        │
└────────────────────┘
```

### Detailed View (Modal/Expanded)

Source icons with scores:

```
┌──────────────────────────────────────┐
│ Legend of Zelda: Ocarina of Time     │
├──────────────────────────────────────┤
│                                      │
│ External Ratings                     │
│                                      │
│ [MC icon] Metacritic     99          │
│ [IGN icon] IGN           10/10       │
│ [GS icon] GameSpot       10/10       │
│ [OC icon] OpenCritic     98          │
│                                      │
│ [Link icon] View on Metacritic →     │
│ [Link icon] View on IGN →            │
│                                      │
└──────────────────────────────────────┘
```

### Source Icons

Display recognisable icons for each source:

| Source | Icon | Colour |
|--------|------|--------|
| Metacritic | Yellow/Green square | #FFCC33 |
| IGN | Red hexagon | #BF1313 |
| GameSpot | Red circle | #ED1C24 |
| OpenCritic | Blue circle | #1E88E5 |
| MobyGames | Blue 'M' | #0066CC |
| RAWG | White on black | #1A1A1A |

**Legal note**: Using source logos requires permission. Consider:
- Generic star/rating icons with source name
- Simple coloured dots with tooltip
- Text-only with source abbreviation

## Recommendations

### For itemdeck (Non-Commercial)

**Recommended approach**: Manual enrichment with optional RAWG/MobyGames integration

1. **Phase 1**: Schema extension for external scores
   - Add `externalScores` field to entity schema
   - Support arbitrary key-value pairs
   - Display on card back and/or detailed view

2. **Phase 2**: CSV import tool
   - Allow bulk import of scores
   - Match on ID or title
   - Preview before applying

3. **Phase 3**: Optional RAWG integration
   - Build-time enrichment script
   - Cache results in collection data
   - Requires RAWG API key in config

### Schema Extension

```json
{
  "entityTypes": {
    "game": {
      "fields": {
        "externalScores": {
          "type": "object",
          "description": "Scores from external sources",
          "properties": {
            "metacritic": { "type": "number", "min": 0, "max": 100 },
            "opencritic": { "type": "number", "min": 0, "max": 100 },
            "ign": { "type": "number", "min": 0, "max": 10 },
            "gamespot": { "type": "number", "min": 0, "max": 10 }
          }
        },
        "externalLinks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source": { "type": "string" },
              "url": { "type": "url" }
            }
          }
        }
      }
    }
  }
}
```

## Legal Summary

| Source | Web Scraping | API Use | Commercial | Non-Commercial |
|--------|--------------|---------|------------|----------------|
| Metacritic | ❌ Prohibited | ❌ No API | ❌ License required | ❌ Not allowed |
| MobyGames | ❌ Prohibited | ✅ API available | ⚠️ Contact required | ✅ With attribution |
| RAWG | ❌ Prohibited | ✅ Free tier | ⚠️ Paid tier | ✅ With attribution |
| OpenCritic | ❌ Prohibited | ⚠️ Partnership only | ⚠️ Partnership | ⚠️ Partnership |
| IGDB | ❌ Prohibited | ✅ Free tier | ⚠️ Terms apply | ✅ With attribution |
| Wikipedia | ⚠️ Rate limited | ✅ MediaWiki API | ✅ CC BY-SA | ✅ CC BY-SA |

## Next Steps

1. [ ] Extend entity schema to support `externalScores` and `externalLinks`
2. [ ] Design UI for displaying external scores (card back and detailed view)
3. [ ] Create source icon set (or use generic icons)
4. [ ] Implement CSV import for bulk score addition
5. [ ] Optional: RAWG integration script for build-time enrichment

---

## Related Documentation

- [v0.6.1 Milestone](../roadmap/milestones/v0.6.1.md)
- [v1 Schema Reference](../../reference/schemas/v1/README.md)
- [F-042 Collection Display Driver](../roadmap/features/planned/F-042-collection-display-driver.md)

---

**Status**: Research Complete
**Recommendation**: Manual enrichment with optional RAWG integration
