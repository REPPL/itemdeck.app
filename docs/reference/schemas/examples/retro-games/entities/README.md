# Retro Games Entities

Entity data files for the retro-games collection.

## Files

| File | Entity Type | Count |
|------|-------------|-------|
| [platforms.json](platforms.json) | platform | 13 |
| [games.json](games.json) | game | 12 (sample) |

## Platform Entity

```json
{
  "id": "snes",
  "title": "SNES",
  "year": 1992,
  "summary": "My personal 16-bit golden age...",
  "detailUrl": "https://en.wikipedia.org/wiki/Super_Nintendo"
}
```

## Game Entity

```json
{
  "id": "super-metroid",
  "title": "Super Metroid",
  "platform": "snes",
  "rank": 0,
  "year": 1994,
  "summary": "Atmospheric masterpiece...",
  "images": [...]
}
```

## Related Documentation

- [Collection Definition](../collection.json)
- [Retro Games README](../README.md)
