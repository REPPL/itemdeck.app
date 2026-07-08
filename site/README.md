# Landing page (`site/`)

The source for the itemdeck.app landing page, served at the apex of
`https://itemdeck.app/`. The app itself lives at `/demo/`.

## Editing the copy

1. Edit `site/content.md` — one block of text under each `### key` heading.
2. Open a pull request.
3. When it merges, the site rebuilds and deploys automatically.

Each key matches an element marked `data-content="key"` in `index.html`.
You can use **bold**, *italic*, `code`, [links](https://example.com) and
`- ` bullet lists; blank lines separate paragraphs. Delete a block and the
built-in copy in the HTML is used instead.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Page structure, styles and behaviour (built, not served as-is) |
| `content.md` | The editable copy — your editing surface |
| `fonts/` | Self-hosted Space Grotesk and Inter (woff2) |
| `assets/` | Logo marks and lockups (SVG and PNG) |
| `media/` | Tutorial video (light and dark cuts, MP4) and poster stills |
| `_redirects`, `_headers` | Hosting configuration, copied into `dist/` |

The canonical design values (colours, spacing, type) live inline in
`index.html`. A reference-only export of the "Premium Retro" tokens is
kept at `.abcd/development/planning/2026-07-08-landing-theme-tokens/`.

## Building

`npm run build` runs `scripts/build-site.mjs` after the app build. It
injects the copy from `content.md` into `index.html`, computes the
Content-Security-Policy hash for the inline script, and writes the result
to `dist/index.html` along with `fonts/`, `assets/`, `_redirects` and
`_headers`.

Note: `index.html` carries a placeholder CSP hash, so open the **built**
`dist/index.html` (not this source file) to preview the page with its
script running.
