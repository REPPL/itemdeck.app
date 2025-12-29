# Track A: Component Storybook (F-026)

## Features

- F-026: Component Storybook

## Implementation Prompt

```
Implement Component Storybook for itemdeck developer experience.

## Phase 1: Install Storybook

1. Run: npx storybook@latest init --type react
   - This creates .storybook/ directory with main.ts and preview.ts
2. Run: npm install -D @storybook/addon-a11y @storybook/addon-interactions
3. Verify package.json has scripts:
   ```json
   {
     "scripts": {
       "storybook": "storybook dev -p 6006",
       "storybook:build": "storybook build -o storybook-static"
     }
   }
   ```

## Phase 2: Configure Storybook

### .storybook/main.ts

```typescript
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: true,
  },
};

export default config;
```

### .storybook/preview.ts

```typescript
import type { Preview } from "@storybook/react";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
        ],
      },
    },
  },
};

export default preview;
```

### .storybook/decorators.tsx

Create shared decorators for wrapping stories with context providers:

```typescript
import type { Decorator } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "../src/context/ConfigContext";
import { SettingsProvider } from "../src/context/SettingsContext";
import { MotionProvider } from "../src/context/MotionContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export const withProviders: Decorator = (Story) => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <SettingsProvider>
        <MotionProvider>
          <Story />
        </MotionProvider>
      </SettingsProvider>
    </ConfigProvider>
  </QueryClientProvider>
);
```

## Phase 3: Create Component Stories

### Tier 1: Core Components (Must Have)

| Component | File | Variants |
|-----------|------|----------|
| Card | src/components/Card/Card.stories.tsx | Default, Flipped, WithRank, WithDeviceBadge, WithoutYear, Loading |
| CardGrid | src/components/CardGrid/CardGrid.stories.tsx | Default, Loading, Empty, Grouped |
| CardExpanded | src/components/CardExpanded/CardExpanded.stories.tsx | Open, WithMultipleImages, WithVideo |
| ImageWithFallback | src/components/ImageWithFallback/ImageWithFallback.stories.tsx | Default, Loading, Error, SVGPlaceholder |
| LazyImage | src/components/LazyImage/LazyImage.stories.tsx | Default, Loading |

### Tier 2: Navigation & Overlays (Should Have)

| Component | File | Variants |
|-----------|------|----------|
| Sidebar | src/components/Sidebar/Sidebar.stories.tsx | Open, Closed |
| NavigationHub | src/components/NavigationHub/NavigationHub.stories.tsx | Collapsed, Expanded, WithMechanicActive |
| Modal | src/components/Modal/Modal.stories.tsx | Default, WithLongContent |
| ConfirmDialog | src/components/ConfirmDialog/ConfirmDialog.stories.tsx | Warning, Danger |
| Toast | src/components/Toast/Toast.stories.tsx | Info, Success, Warning |

### Tier 3: Loading & Feedback (Should Have)

| Component | File | Variants |
|-----------|------|----------|
| LoadingSkeleton | src/components/LoadingSkeleton/LoadingSkeleton.stories.tsx | Default, CustomCount |
| LoadingScreen | src/components/LoadingScreen/LoadingScreen.stories.tsx | Loading, WithGitHub, Error, Offline |

### Story Template Example

```typescript
// src/components/Card/Card.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { withProviders } from "../../../.storybook/decorators";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  decorators: [withProviders],
  tags: ["autodocs"],
  argTypes: {
    isFlipped: { control: "boolean" },
    showRankBadge: { control: "boolean" },
    cardSize: { control: "select", options: ["small", "medium", "large"] },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

const mockCard = {
  id: "example-1",
  title: "Example Card",
  year: "2024",
  imageUrl: "https://picsum.photos/400/300",
};

export const Default: Story = {
  args: {
    card: mockCard,
    isFlipped: false,
  },
};

export const Flipped: Story = {
  args: {
    card: mockCard,
    isFlipped: true,
  },
};
```

## Phase 4: Verify Storybook

1. Run: npm run storybook
2. Verify all stories load without errors
3. Check accessibility panel shows no critical violations
4. Run: npm run storybook:build
5. Verify build completes successfully

## Files to Create

- .storybook/main.ts (may exist from init)
- .storybook/preview.ts (may exist from init)
- .storybook/decorators.tsx
- src/components/Card/Card.stories.tsx
- src/components/CardGrid/CardGrid.stories.tsx
- src/components/CardExpanded/CardExpanded.stories.tsx
- src/components/ImageWithFallback/ImageWithFallback.stories.tsx
- src/components/LazyImage/LazyImage.stories.tsx
- src/components/Sidebar/Sidebar.stories.tsx
- src/components/NavigationHub/NavigationHub.stories.tsx
- src/components/Modal/Modal.stories.tsx
- src/components/ConfirmDialog/ConfirmDialog.stories.tsx
- src/components/Toast/Toast.stories.tsx
- src/components/LoadingSkeleton/LoadingSkeleton.stories.tsx
- src/components/LoadingScreen/LoadingScreen.stories.tsx

## Files to Modify

- package.json (scripts added by init)
- .gitignore (add storybook-static/)

## Success Criteria

- [ ] Storybook dependencies installed
- [ ] .storybook/main.ts configured with addons
- [ ] .storybook/preview.ts configured with a11y
- [ ] Decorators file created for context providers
- [ ] Tier 1 Stories complete (5 components)
- [ ] Tier 2 Stories complete (5 components)
- [ ] Tier 3 Stories complete (2 components)
- [ ] npm run storybook launches successfully
- [ ] npm run storybook:build builds successfully
- [ ] Accessibility addon runs without critical violations
- [ ] Autodocs generated for all stories
```

---

## Related Documentation

- [F-026 Feature Spec](../../../development/roadmap/features/planned/F-026-component-storybook.md)
- [F-019 Accessibility Audit](./track-a-accessibility.md)
