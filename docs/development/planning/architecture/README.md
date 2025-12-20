# Architecture

System design and technical architecture documentation.

## Current Architecture

Itemdeck v0.0.0-foundation uses:
- **React 18** with functional components and hooks
- **TypeScript 5** in strict mode
- **Vite 6** for build and development
- **CSS Modules** for scoped styling
- **Absolute positioning** with JavaScript-calculated layouts

## Planned Evolution

See [ADRs](../../decisions/adrs/) for architectural decisions informing future development.

Key architectural patterns planned:
- Compound components for modular card layouts
- Context-based configuration cascade
- Service worker caching for offline support
- Virtual scrolling for large collections

## What Belongs Here

- System architecture diagrams
- Component hierarchy documentation
- Data flow diagrams
- Integration patterns

---

## Related Documentation

- [Planning Overview](../README.md)
- [ADRs](../../decisions/adrs/)
- [Modular Architecture Research](../../../research/modular-architecture.md)
