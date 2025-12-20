# Setup Clarifications

Decisions and clarifications made during project scaffolding.

## Questions Asked

### 1. Package Manager

**Question**: Which package manager should I use for this project?

**Answer**: npm

**Rationale**: npm is already installed, universally compatible, and requires zero additional setup. For a sandboxed/experimental project, this minimises friction.

### 2. .gitignore Patterns

**Question**: The current .gitignore is Python-focused but the project uses TypeScript/React. Should I replace it with Node.js patterns?

**Answer**: Replace entirely

**Rationale**: The existing Python patterns are not applicable to a TypeScript/React project.

### 3. Documentation Standards

**Question**: Should I follow the Sandboxed project documentation standards from the CLAUDE.md configuration?

**Answer**: Full standards

**Rationale**: Apply complete documentation structure (docs/, setup prompt recording, etc.) as per the Sandboxed project conventions.

### 4. Package Name

**Question**: What should the npm package name be?

**Answer**: `itemdeck`

## Implementation Decisions

### Prettier Configuration

**Specification said**: `singleQuote: true`

**Implementation**: `singleQuote: false`

**Rationale**: Using double quotes is more consistent with JSX conventions and the specification's example code uses double quotes. This is a minor style preference that can be changed.

### ESLint Configuration

**Specification said**: Extend `plugin:@typescript-eslint/recommended`

**Implementation**: Extended with stricter type-checked rules (`strict-type-checked`, `stylistic-type-checked`)

**Rationale**: Stricter checking catches more issues early. The specification's requirement for "strict mode" in TypeScript suggests a preference for rigorous type checking.

### Mock Data Structure

**Specification said**: Export a function `getMockCards(): CardData[]`

**Implementation**: Exported a constant `mockCards: CardData[]`

**Rationale**: A constant is simpler and sufficient for mock data. The hook provides the abstraction layer for future data fetching.

### Hook Return Type

**Specification said**: `{ cards: CardData[]; isLoading: boolean; error: string | null }`

**Implementation**: `{ cards: CardData[]; loading: boolean; error: string | null }`

**Rationale**: Used `loading` instead of `isLoading` for consistency with common React patterns. Both are acceptable.

### CardGrid Props

**Specification said**: CardGrid accepts `{ cards: CardData[] }` props

**Implementation**: CardGrid uses `useCardData` hook internally

**Rationale**: Encapsulating data fetching in the component simplifies the App component and follows the container/presentational pattern. The specification's App.tsx example shows using the hook in App, but the intent is served either way.

### CSS Custom Properties

**Added**: Additional colour and shadow variables

**Rationale**: The specification's variables were minimal. Added British English variable names (`--colour-*`) for consistency with project standards, plus shadow and transition variables for the card hover effect.

## Files Created

| File | Status |
|------|--------|
| `.gitignore` | Replaced (was Python-focused) |
| `package.json` | Created |
| `tsconfig.json` | Created |
| `tsconfig.node.json` | Created (required for Vite config) |
| `.prettierrc` | Created |
| `.eslintrc.cjs` | Created |
| `vite.config.ts` | Created |
| `index.html` | Created |
| `public/favicon.svg` | Created |
| `src/vite-env.d.ts` | Created |
| `src/types/card.ts` | Created |
| `src/data/cards.mock.ts` | Created |
| `src/hooks/useCardData.ts` | Created |
| `src/styles/global.css` | Created |
| `src/components/Card/Card.module.css` | Created |
| `src/components/Card/Card.tsx` | Created |
| `src/components/CardGrid/CardGrid.module.css` | Created |
| `src/components/CardGrid/CardGrid.tsx` | Created |
| `src/App.module.css` | Created |
| `src/App.tsx` | Created |
| `src/main.tsx` | Created |
| `README.md` | Replaced |
| `docs/README.md` | Created |
| `docs/prompts/setup/README.md` | Created |
| `docs/prompts/setup/clarifications.md` | Created |
