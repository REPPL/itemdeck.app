# Landing page "Premium Retro" theme tokens (reference only)

Design-record export of the landing page's visual system, from the
2026-07-08 design session. The canonical values live inline in
`site/index.html`; nothing consumes these files at build or runtime.
They are kept so the palette and type scale can be reused (for example,
to derive an app theme in `public/themes/`) without reverse-engineering
the page styles.

- `theme.css` — the tokens as CSS custom properties (light, dark and
  high-contrast modes)
- `tokens.json` — the same values, machine-readable

These files are not app themes; the app's theme schema in
`public/themes/*.json` uses a different format.
