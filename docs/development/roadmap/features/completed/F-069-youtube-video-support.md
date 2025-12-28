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

- [x] Create media type definitions with YouTube helpers
- [x] Implement `extractYouTubeId()` function
- [x] Implement `isYouTubeUrl()` function
- [x] Implement `getYouTubeThumbnail()` function
- [x] Create YouTubeEmbed component with thumbnail preview
- [x] Add click-to-play functionality
- [x] Style video container with 16:9 aspect ratio
- [x] Integrate with ImageGallery component
- [x] Test with various YouTube URL formats
- [x] Ensure keyboard accessibility

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

- [x] YouTube URLs auto-detected in images array
- [x] Thumbnail preview shown by default
- [x] Click to play loads iframe
- [x] Gallery navigation works with mixed content
- [x] Keyboard accessible (Enter/Space to play)

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Medium** - New component with iframe handling.

---

## Related Documentation

- [v0.11.1 Milestone](../../milestones/v0.11.1.md)
- [ImageGallery Component](../../../../src/components/ImageGallery/)
