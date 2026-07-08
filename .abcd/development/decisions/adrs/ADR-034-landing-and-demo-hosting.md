# ADR-034: Marketing landing at the apex, app at /demo/, one Cloudflare Pages project

## Status

Accepted (2026-07-08)

## Context

itemdeck.app needs a marketing landing page alongside the running
application. That raises three coupled questions: where each surface
lives in the URL space, which hosting provider(s) serve them, and how
the landing page gets its copy.

Constraints and drivers:

- **Single provider, single pipeline.** One deploy artefact and one
  hosting project keep CI, previews, and rollback simple.
- **PR previews.** Every pull request should produce a preview of both
  the landing page and the app together.
- **Instant rollback.** A bad deploy must be revertible in one step.
- **Real response headers.** The app's security posture (CSP and
  friends) requires control over HTTP response headers, not just
  static file serving.
- **Security review rejected runtime hydration** of landing copy:
  fetching copy at page-load time is an XSS channel and lets content
  changes bypass deploy review entirely.

## Decision

One Cloudflare Pages project serves both surfaces:

- The **marketing landing page** (built from `site/` to
  `dist/index.html`) is served at the apex, `https://itemdeck.app/`.
- The **app** (Vite base `/demo/`, built to `dist/demo/`) is served at
  `https://itemdeck.app/demo/`; collection URLs take the forms
  `/demo/gh?u=USER&c=PATH` and `/demo/gh/USER/c/PATH`.
- **Legacy `/gh/*` paths are 200-rewritten** to the app shell
  (`/demo/index.html`), so the documented short URL forms keep working.
  A rewrite rather than a redirect is deliberate: the browser URL is
  untouched, so query strings (`?u=…&c=…`) survive deterministically
  instead of depending on redirect semantics, and the app — whose
  parser still accepts root-relative `/gh` paths — normalises the
  address bar itself after loading.
- **Landing copy is baked at build time** from `site/content.md`;
  there is no runtime content fetch. Copy changes ship like code:
  through a pull request, a preview, and a deploy.

## Considered alternatives

- **GitHub Pages for the landing** (app elsewhere) — rejected: no
  control over response headers, no PR previews, and a second provider
  to operate.
- **App at the apex, landing at `/start`** — rejected: the marketing
  page is the front door for new visitors; burying it under a path the
  app owns inverts that.
- **Marketing at the apex, app on a subdomain (`app.itemdeck.app`)** —
  rejected: a second origin splits cookies/headers configuration and
  deploy previews, for no gain over a path split within one project.
- **Runtime hydration of landing copy** — rejected on security review:
  an injected or tampered content source becomes an XSS channel, and
  content changes would bypass deploy review.

## Consequences

- One build produces one `dist/` tree (landing at the root, app under
  `demo/`); one Cloudflare Pages project deploys it, with PR previews
  and one-click rollback covering both surfaces at once.
- The app's internal routes all carry the `/demo/` prefix; the dev
  server URL is `http://localhost:5173/demo/`.
- The documented `/gh/*` short URL forms survive via 200 rewrites in
  `site/_redirects`, which must stay in the Pages configuration for as
  long as those forms are published. The rewrite rules deliberately
  name only the virtual `/gh` route namespace — a catch-all `/demo/*`
  rule would shadow the app's real static assets, because Cloudflare
  Pages follows redirect rules even when an asset matches.
- Updating landing copy requires a rebuild and deploy — deliberate
  friction that keeps every visible word review-gated.
