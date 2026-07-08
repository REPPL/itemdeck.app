# ADR-012: Use Wikimedia Commons for Ethical Image Sourcing

## Status

Accepted

## Context

Itemdeck may display images from external sources. We need:
- Ethically sourced images
- Clear licensing
- Attribution support
- Reliable availability

We evaluated several image sources:

| Source | Licensing | Attribution | API |
|--------|-----------|-------------|-----|
| Wikimedia Commons | CC, Public Domain | Metadata API | Yes |
| Unsplash | Unsplash Licence | Required | Yes |
| Pexels | Pexels Licence | Optional | Yes |
| Getty/Shutterstock | Paid | Varies | Yes |

## Decision

Recommend **Wikimedia Commons** as the primary source for ethical images, with support for Unsplash and Pexels as alternatives.

## Consequences

### Positive

- **Free and open** - CC and public domain licences
- **Rich metadata** - Author, licence, description via API
- **No API key** - Public API access
- **Diverse content** - Millions of images
- **Educational focus** - Aligned with card collections

### Negative

- **Image quality** - Varies widely
- **Rate limits** - ~200 req/s (reasonable)
- **Not all content** - Some categories underrepresented

### Mitigations

- Support multiple image sources
- Cache attribution data locally
- Provide fallback images

## Attribution Requirements

| Licence | Credit Required | Link Required |
|---------|-----------------|---------------|
| CC0 | No | No |
| CC BY | Yes | Yes |
| CC BY-SA | Yes | Yes |
| Public Domain | No | No |
| Unsplash | Yes | Encouraged |
| Pexels | No | Encouraged |

## Attribution Display

```tsx
<Attribution
  title="Image Title"
  author="Author Name"
  licence="CC BY 4.0"
  sourceUrl="https://commons.wikimedia.org/..."
/>
```

## Supported Licences

Only support licences allowing commercial use:
- CC0 (Public Domain Dedication)
- CC BY (Attribution)
- CC BY-SA (Attribution-ShareAlike)
- Public Domain

**Explicitly exclude:**
- CC BY-NC (Non-Commercial)
- CC BY-NC-SA
- All Rights Reserved

## Alternatives Considered

### Unsplash Only
- High quality
- **Rejected**: Requires API key, less metadata

### Pexels Only
- No attribution required
- **Rejected**: Limited API, smaller collection

### Paid Services
- Professional quality
- **Rejected**: Cost, licensing complexity

### No Image Sourcing
- User-provided only
- **Rejected**: Reduces value proposition

---

## Related Documentation

- [Ethical Image Sourcing Research](../../../research/ethical-image-sourcing.md)
- [F-020: Attribution System](../../roadmap/features/planned/F-020-attribution-system.md)
