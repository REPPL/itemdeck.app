# Project Setup Prompt: Adaptive Card Grid Application

## Document Purpose
This prompt instructs an AI coding assistant to scaffold a web application project. It is written to be:
- **Executable** by an AI agent without ambiguity
- **Readable** by humans for review, modification, or manual reproduction

---

## 1. Project Overview

### 1.1 Description
Create a browser-based card display application using a "Memory game" visual metaphor. Cards are arranged in a responsive grid and adapt their displayed content based on available space. This is the **foundation scaffold only** – no game logic is required at this stage.

### 1.2 Core Behaviours (for context – not all implemented in this phase)
- Cards display in a responsive CSS Grid
- Card content progressively hides/shows based on the card's rendered width
- Cards have a "back" (logo + optional parameter) and "front" (image, title, metadata)
- The grid adapts when the browser window resizes or font size changes
- Cards never shrink below a defined minimum readable size

### 1.3 Scope of This Task
Set up the project structure, configuration, and placeholder components. **Do not implement**:
- Card flip animations
- Data fetching logic
- Detail view/modal/carousel
- Virtualised scrolling

---

## 2. Technical Requirements

### 2.1 Technology Stack

| Concern | Technology | Version/Notes |
|---------|------------|---------------|
| Language | TypeScript | Strict mode enabled |
| Framework | React | v18+ with functional components and hooks |
| Build Tool | Vite | Latest stable |
| Styling | CSS Modules | One `.module.css` file per component |
| CSS Features | CSS Grid, Container Queries | No CSS framework (e.g. Tailwind) |
| Linting | ESLint | With TypeScript and React plugins |
| Formatting | Prettier | Integrated with ESLint |
| Package Manager | npm | (or pnpm if preferred; document choice) |

### 2.2 Browser Support
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge – latest two versions)
- Container Queries are supported in all targets; no polyfill required

### 2.3 Code Standards
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for CSS classes
- **Components**: One component per file; co-locate `.tsx` and `.module.css`
- **Types**: Define all data structures in `src/types/`; avoid `any`
- **Exports**: Use named exports (not default) for all components and utilities
- **Comments**: JSDoc for public functions; inline comments only where logic is non-obvious

---

## 3. Project Structure

Generate the following file tree. Create all files with appropriate placeholder content as specified in Section 4.

```
project-root/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── README.md
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.tsx                    # Application entry point
    ├── App.tsx                     # Root component
    ├── App.module.css
    │
    ├── components/
    │   ├── CardGrid/
    │   │   ├── CardGrid.tsx
    │   │   └── CardGrid.module.css
    │   │
    │   └── Card/
    │       ├── Card.tsx
    │       └── Card.module.css
    │
    ├── hooks/
    │   └── useCardData.ts          # Placeholder hook (returns mock data)
    │
    ├── types/
    │   └── card.ts                 # Card data interface
    │
    ├── data/
    │   └── cards.mock.ts           # Mock data for development
    │
    └── styles/
        └── global.css              # CSS reset and custom properties
```

---

## 4. File Contents Specification

### 4.1 Configuration Files

**`tsconfig.json`**
- Enable `strict: true`
- Set `target: "ES2022"`, `module: "ESNext"`
- Include path alias: `@/*` → `src/*`

**`vite.config.ts`**
- Configure the path alias to match tsconfig
- No additional plugins required

**`.eslintrc.cjs`**
- Extend: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react-hooks/recommended`
- Environment: browser, ES2022

**`.prettierrc`**
- `semi: true`
- `singleQuote: true`
- `tabWidth: 2`
- `trailingComma: "es5"`

**`.gitignore`**
- Include: `node_modules/`, `dist/`, `.DS_Store`, `*.local`

### 4.2 Type Definitions

**`src/types/card.ts`**
```typescript
export interface CardData {
  id: string;
  title: string;
  year?: string;
  imageUrl: string;
  summary?: string;
  detailUrl?: string;
  metadata?: Record<string, string>;
}
```

### 4.3 Mock Data

**`src/data/cards.mock.ts`**
- Export a function `getMockCards(): CardData[]`
- Return 12 sample cards with varied data (some with optional fields omitted)
- Use placeholder image URLs (e.g. `https://picsum.photos/seed/{id}/300/400`)

### 4.4 Components

**`src/components/Card/Card.tsx`**
- Accept props: `{ card: CardData }`
- Render a container `<article>` with class for container query context
- Include placeholder elements for: image, title, year, summary
- Add a comment: `// TODO: Implement content tier visibility via container queries`

**`src/components/Card/Card.module.css`**
- Define the card as a container query context: `container-type: inline-size`
- Set minimum width: `100px`
- Include commented placeholder for container query breakpoints:
  ```css
  /* Content tier breakpoints (to implement):
     @container (min-width: 220px) { ... }
     @container (min-width: 180px) { ... }
     @container (min-width: 140px) { ... }
  */
  ```

**`src/components/CardGrid/CardGrid.tsx`**
- Accept props: `{ cards: CardData[] }`
- Render cards in a `<section>` using CSS Grid
- Map over cards and render `<Card>` components

**`src/components/CardGrid/CardGrid.module.css`**
- Use CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`
- Set a consistent gap (e.g. `1rem`)

### 4.5 Hooks

**`src/hooks/useCardData.ts`**
- Return type: `{ cards: CardData[]; isLoading: boolean; error: string | null }`
- For now, return mock data immediately with `isLoading: false`
- Add comment: `// TODO: Replace with fetch from JSON URL`

### 4.6 Global Styles

**`src/styles/global.css`**
- Include a minimal CSS reset (box-sizing, margin/padding reset)
- Define CSS custom properties:
  ```css
  :root {
    --card-min-width: 180px;
    --card-min-width-critical: 100px;
    --grid-gap: 1rem;
    --font-family-base: system-ui, sans-serif;
    --font-family-heading: var(--font-family-base);
  }
  ```
- Set base font size on `html` to enable `rem` scaling

### 4.7 Entry Point

**`src/main.tsx`**
- Import `global.css`
- Render `<App />` into `#root`

**`src/App.tsx`**
- Use `useCardData` hook
- Render `<CardGrid>` with the returned cards
- Include a simple heading (e.g. "Card Collection")

### 4.8 README.md

Include:
- Project title and one-sentence description
- Prerequisites (Node.js version)
- Setup instructions (`npm install`, `npm run dev`)
- Available scripts
- Brief architecture overview referencing this specification

---

## 5. Acceptance Criteria

When complete, the following must be true:

1. **Runs without errors**: `npm install && npm run dev` starts the dev server
2. **Displays cards**: 12 placeholder cards visible in a responsive grid
3. **Grid responds to resize**: Columns reflow when browser width changes
4. **No TypeScript errors**: `npm run typecheck` (or `tsc --noEmit`) passes
5. **No lint errors**: `npm run lint` passes
6. **Cards have container context**: Each card's CSS includes `container-type: inline-size`
7. **Placeholder structure ready**: All TODO comments are in place for next implementation phase

---

## 6. Out of Scope (Do Not Implement)

- Card flip animation or interaction
- Fetching data from external URL
- Detail modal or carousel
- Virtualised/windowed rendering
- Unit or integration tests
- CI/CD configuration
- Deployment configuration

---

## 7. Deliverables

Provide:
1. All files as specified, with complete contents
2. A summary of any decisions made where this specification was ambiguous
3. Instructions if any manual steps are required after file generation

---

## End of Prompt
