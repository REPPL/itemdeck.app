# F-026: Component Storybook

## Problem Statement

There is no visual component documentation:

1. Developers cannot preview components in isolation
2. No visual regression testing capability
3. Design system not documented
4. Component states (loading, error, disabled) not easily viewable
5. Accessibility checks not integrated into development workflow

## Design Approach

### 1. Install Storybook

```bash
npx storybook@latest init --type react
```

### 2. Configure for Vite

```typescript
// .storybook/main.ts
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
};

export default config;
```

### 3. Component Stories Structure

```
src/components/
├── Card/
│   ├── Card.tsx
│   ├── Card.module.css
│   └── Card.stories.tsx    # NEW
├── ImageWithFallback/
│   ├── ImageWithFallback.tsx
│   └── ImageWithFallback.stories.tsx  # NEW
└── ...
```

### 4. Example Story

```tsx
// src/components/Card/Card.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    isFlipped: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    card: {
      id: "1",
      title: "Example Card",
      year: "2024",
      imageUrl: "https://picsum.photos/400/300",
    },
    isFlipped: false,
  },
};

export const Flipped: Story = {
  args: {
    ...Default.args,
    isFlipped: true,
  },
};

export const WithoutYear: Story = {
  args: {
    card: {
      id: "2",
      title: "No Year Card",
      imageUrl: "https://picsum.photos/400/300",
    },
  },
};

export const Loading: Story = {
  args: {
    card: {
      id: "3",
      title: "Loading Image",
      imageUrl: "https://invalid-url-that-will-fail.com/image.jpg",
    },
  },
};
```

### 5. Accessibility Addon

The `@storybook/addon-a11y` addon runs axe-core checks on each story:

- Colour contrast violations
- Missing ARIA labels
- Keyboard navigation issues
- Focus management problems

### 6. Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build -o storybook-static"
  }
}
```

## Implementation Tasks

- [ ] Install Storybook with Vite framework
- [ ] Install accessibility addon
- [ ] Configure Storybook main.ts
- [ ] Create stories for Card component
- [ ] Create stories for CardGrid component
- [ ] Create stories for ImageWithFallback component
- [ ] Create stories for Sidebar component
- [ ] Create stories for LoadingSkeleton component
- [ ] Create stories for OfflineIndicator component
- [ ] Add Storybook build to CI
- [ ] Document Storybook usage in CONTRIBUTING.md

## Success Criteria

- [ ] `npm run storybook` launches Storybook server
- [ ] All major components have stories
- [ ] Each component shows multiple states (default, hover, error, loading)
- [ ] Accessibility addon runs without critical violations
- [ ] Storybook builds successfully for deployment
- [ ] Component documentation generated via autodocs

## Dependencies

- **Requires**: None
- **Blocks**: None (but enhances development workflow)

## Complexity

**Medium** - Requires creating stories for all components.

---

## Related Documentation

- [v0.15.5 Milestone](../../milestones/v0.15.5.md)
- [F-019: Accessibility Audit](./F-019-accessibility-audit.md)
