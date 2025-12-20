# .claude/ Configuration

This directory contains Claude Code configuration for itemdeck.

## Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project-specific standards and guidelines |
| `config.json` | Structured project configuration |
| `inherits.json` | Inheritance chain declaration |
| `settings.local.json` | Permission overrides (local only) |

## Inheritance Chain

This project inherits from:
1. `~/.claude/` - Global essentials (British English, SSOT)
2. `~/Development/.claude/` - Development standards (docs structure)
3. `~/Development/Sandboxed/.claude/` - Docker/experimental standards

## Profile Activation

This project activates:
- **typescript** - Via `package.json` detection

## Configuration

See `config.json` for structured settings:
- Project metadata
- AI transparency level
- Documentation preferences
- Privacy rules

## Related

- [Global Standards](~/.claude/CLAUDE.md)
- [Permission Profiles](~/.claude/profiles/README.md)
- [JSON Schemas](~/.claude/schemas/README.md)
