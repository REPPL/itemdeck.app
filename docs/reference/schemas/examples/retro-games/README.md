# Retro Games Example Collection

A personal ranking of classic video games, demonstrating all itemdeck schema features.

## Structure

```
retro-games/
├── collection.json           # Collection definition
└── entities/
    ├── platforms.json        # Gaming platforms (13)
    └── games.json            # Game entries (12 sample)
```

## Features Demonstrated

### Entity Types

- **game** (primary) - Individual game entries
- **platform** - Gaming platforms (consoles, computers)

### Relationships

- `game.platform` - Many-to-one relationship to platform
- `game.rank` - Scoped ordinal (rank within platform)

### Images with Attribution

```json
{
  "images": [
    {
      "url": "https://upload.wikimedia.org/.../box.jpg",
      "type": "cover",
      "alt": "Super Metroid box art",
      "attribution": {
        "source": "Wikimedia Commons",
        "author": "Nintendo",
        "licence": "Fair use",
        "url": "https://commons.wikimedia.org/..."
      }
    }
  ]
}
```

### Display Configuration

```json
{
  "display": {
    "groupBy": "platform",
    "sortWithinGroup": ["rank", "asc"],
    "card": {
      "front": {
        "image": { "source": "images[0]" },
        "badge": "rank"
      },
      "back": {
        "logo": "platform.logoUrl",
        "text": "year"
      }
    }
  }
}
```

## Files

- [collection.json](collection.json) - Collection schema definition
- [entities/platforms.json](entities/platforms.json) - Platform entities
- [entities/games.json](entities/games.json) - Game entities

## Related Documentation

- [Schema Documentation](../../README.md)
- [v1 Schema Reference](../../v1/README.md)
