# itemdeck.app Project Standards

**Scope:** Project-specific standards for itemdeck.app

**Inherits from:**
- `~/.claude/` - Global essentials
- `~/Development/.claude/` - Development standards
- `~/Development/Sandboxed/.claude/` - Sandboxed standards

---

## Project Overview

**itemdeck.app** is an interactive card collection viewer for displaying, exploring, and playing with collections.

---

## TypeScript Standards

### Version
- **Node:** 20+ (LTS)
- **TypeScript:** 5+ (strict mode)

### Package Management

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## Version Numbering Policy

### Semantic Versioning (MAJOR.MINOR.PATCH)

| Version | When to Use | Example |
|---------|-------------|---------|
| **0.X.0** | Milestone release (planned features) | v0.1.0, v0.2.0 |
| **0.X.Y** | Bug fixes after milestone | v0.1.1, v0.1.2 |
| **X.0.0** | Breaking changes or major milestone | v1.0.0 |

### Current Status

| Version | Status | Notes |
|---------|--------|-------|
| v0.0.0-foundation | ✅ Complete | Initial scaffold |
| v0.1.0 | 📋 Planned | First feature release |

---

## Implementation Checklists

### Pre-Implementation

- [ ] All existing tests pass
- [ ] Feature spec exists in `.abcd/development/roadmap/features/`
- [ ] Dependencies installed (`npm install`)

### Post-Implementation

- [ ] All tests pass
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Feature spec updated
- [ ] Pre-commit hooks pass

---

## AI Transparency

This project uses **full** AI transparency:

### Commit Attribution

All AI-assisted commits include:
```
🤖 Generated with [Claude Code](https://claude.ai/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## British English Exceptions

### CSS Properties

**Exception:** CSS property names use American English (syntax requirement).

| Property | Custom Property |
|----------|-----------------|
| `color:` | `--colour-*` |
| `background-color:` | `--colour-background` |

**Rule:** CSS syntax uses American, custom property names use British.

---

## Privacy Requirements

### Never Commit

- Hardcoded user paths (e.g., `/Users/username/`)
- Real email addresses (use @example.com or GitHub noreply)
- API keys, tokens, passwords
- Personal identifying information

### Safe Alternatives

- Use `$PROJECT_ROOT` or relative paths
- Use example.com domain for sample emails
- Use GitHub noreply emails for commits
- Use environment variables for secrets

---

## Working Files

### .work/ Directory

**Purpose:** Temporary files that should NEVER be committed

**Use for:**
- Progress trackers
- Draft documents
- Scratch files
- Personal notes

**Enforcement:** Already in `.gitignore`

---

## Documentation Structure

`docs/` is **user-facing only** — the four Diátaxis types plus supporting
assets. Developer-facing records live outside `docs/`, under
`.abcd/development/`.

```
docs/                            # User-facing (Diátaxis)
├── README.md                    # Documentation hub
├── tutorials/                   # Learning-oriented
├── guides/                      # Task-oriented how-tos
├── reference/                   # Information-oriented
├── explanation/                 # Understanding-oriented
├── prompts/                     # AI setup prompts
└── assets/                      # Images and other assets

.abcd/development/               # Developer-facing records
├── README.md
├── architecture.md
├── decisions/                   # ADRs (MADR, NNNN-title.md)
├── research/                    # Dated research notes
├── planning/
├── implementation/
├── process/                     # Devlogs, retrospectives
└── roadmap/                     # Features and milestones
```

---

## Related Documentation

- [Global Standards](~/.claude/CLAUDE.md)
- [Development Standards](~/Development/.claude/CLAUDE.md)
- [Sandboxed Standards](~/Development/Sandboxed/.claude/CLAUDE.md)

---

**Status**: Active development
