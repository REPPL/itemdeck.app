# Development Documentation

Central hub for Itemdeck development planning, roadmap, and process documentation.

## Quick Navigation

| Section | Purpose | Key Files |
|---------|---------|-----------|
| [Roadmap](./roadmap/) | What to build and when | Features, Milestones |
| [Planning](./planning/) | Architecture and design | Vision, Requirements |
| [Decisions](./decisions/) | Why we chose what | ADRs |
| [Process](./process/) | How we build | Devlogs, Retrospectives |
| [Implementation](./implementation/) | What was built | Version records |

## Current Status

| Milestone | Status | Features |
|-----------|--------|----------|
| v0.0.0 Foundation | ✅ Complete | Basic grid, card back, sidebar |
| [v0.1.0 Animation](./roadmap/milestones/v0.1.md) | 📋 Planned | Card flip, config, assets, a11y |
| [v0.2.0 Data](./roadmap/milestones/v0.2.md) | 📋 Planned | TanStack Query, GitHub, caching |
| [v0.3.0 Customisation](./roadmap/milestones/v0.3.md) | 📋 Planned | Themes, layouts, persistence |
| [v0.4.0 Performance](./roadmap/milestones/v0.4.md) | 📋 Planned | Virtualisation, lazy loading |
| [v0.5.0 Quality](./roadmap/milestones/v0.5.md) | 📋 Planned | Testing, security, full a11y |

## Directory Structure

```
development/
├── planning/           # What to build & why
│   └── architecture/   # System design
├── roadmap/            # How & when to build
│   ├── features/       # Feature specifications
│   │   ├── active/     # Currently in progress
│   │   ├── planned/    # Queued for future
│   │   └── completed/  # Archive of done work
│   └── milestones/     # Release planning
├── implementation/     # What was built
├── process/            # How it was built
│   ├── devlogs/        # Development narratives
│   ├── retrospectives/ # Post-milestone reflections
│   └── time-logs/      # Time tracking
└── decisions/          # Architecture decisions
    └── adrs/           # Decision records
```

## Key Resources

- [Research Documentation](../research/) - Technical research informing decisions
- [Project Standards](../../.claude/CLAUDE.md) - Development conventions
- [Setup Prompts](../prompts/setup/) - Original specifications

---

## Related Documentation

- [Documentation Hub](../README.md)
- [Research Index](../research/README.md)
