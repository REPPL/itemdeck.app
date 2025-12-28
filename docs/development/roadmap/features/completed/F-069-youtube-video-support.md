# F-069: YouTube Video Gallery Support

## Problem Statement

Users want to embed YouTube videos alongside images in the card gallery. Currently only static images are supported.

## Design Approach

1. **Auto-detect YouTube URLs** in the images array
2. **Inline iframe embed** with thumbnail preview (click to play)
3. **No autoplay** - respects user interaction
4. **No schema changes** - YouTube URLs auto-detected

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/media.ts` | Media type definitions, YouTube helpers |
| `src/components/ImageGallery/YouTubeEmbed.tsx` | YouTube player component |
| `src/components/ImageGallery/YouTubeEmbed.module.css` | Video styles |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ImageGallery/ImageGallery.tsx` | Detect YouTube URLs, render YouTubeEmbed |
| `src/components/ImageGallery/ImageGallery.module.css` | Add `.videoContainer` styles |

## Implementation Tasks

- [ ] Create media type definitions with YouTube helpers
- [ ] Implement `extractYouTubeId()` function
- [ ] Implement `isYouTubeUrl()` function
- [ ] Implement `getYouTubeThumbnail()` function
- [ ] Create YouTubeEmbed component with thumbnail preview
- [ ] Add click-to-play functionality
- [ ] Style video container with 16:9 aspect ratio
- [ ] Integrate with ImageGallery component
- [ ] Test with various YouTube URL formats
- [ ] Ensure keyboard accessibility

## YouTube URL Patterns

```
youtube.com/watch?v=VIDEO_ID
youtu.be/VIDEO_ID
youtube.com/embed/VIDEO_ID
```

## Data Format

No schema changes required:

```json
{
  "images": [
    "https://example.com/cover.jpg",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://example.com/screenshot.jpg"
  ]
}
```

## Success Criteria

- [ ] YouTube URLs auto-detected in images array
- [ ] Thumbnail preview shown by default
- [ ] Click to play loads iframe
- [ ] Gallery navigation works with mixed content
- [ ] Keyboard accessible (Enter/Space to play)

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Medium** - New component with iframe handling.

---

## Related Documentation

- [v0.11.1 Milestone](../../milestones/v0.11.1.md)
- [ImageGallery Component](../../../../src/components/ImageGallery/)
