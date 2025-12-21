# F-018: Security Hardening

## Problem Statement

The application needs security measures before accepting external data:

1. No Content Security Policy configured
2. No XSS protection beyond React's default escaping
3. No input validation for external content
4. No dependency vulnerability scanning

## Design Approach

Implement **defence in depth** with CSP, DOMPurify, Zod validation, and dependency auditing:

### Content Security Policy

```typescript
// src/security/csp.ts
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // CSS Modules need inline
  'img-src': [
    "'self'",
    'data:',
    'https://raw.githubusercontent.com',
    'https://upload.wikimedia.org',
    'https://commons.wikimedia.org',
  ],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://api.github.com',
    'https://commons.wikimedia.org',
  ],
  'frame-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

export function buildCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}
```

### HTML Sanitisation

```typescript
// src/utils/security.ts
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Safe HTML rendering for description fields
export function safeHTML(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// URL validation - block dangerous protocols
const SafeUrlSchema = z.string().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: 'Invalid or unsafe URL' }
);

export function isValidUrl(url: string): boolean {
  return SafeUrlSchema.safeParse(url).success;
}

export function sanitizeHref(url: string): string | null {
  const dangerous = /^(javascript|data|vbscript):/i;
  if (dangerous.test(url.trim())) {
    console.warn('Blocked dangerous URL:', url);
    return null;
  }
  return url;
}

// Safe link component wrapper
export function getSafeHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return sanitizeHref(url) ?? undefined;
}
```

### External Data Validation

```typescript
// src/schemas/externalData.ts
import { z } from 'zod';

// Strict validation for data from external sources
export const ExternalCardSchema = z.object({
  id: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
  name: z.string()
    .min(1)
    .max(200)
    .trim(),
  description: z.string()
    .max(2000)
    .optional(),
  imageUrl: z.string()
    .url()
    .refine(
      (url) => url.startsWith('https://'),
      'Only HTTPS URLs allowed'
    )
    .optional(),
  category: z.string()
    .max(50)
    .optional(),
  tags: z.array(z.string().max(30))
    .max(20)
    .optional(),
});

export const ExternalCollectionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  cards: z.array(ExternalCardSchema).max(10000),
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export type ExternalCard = z.infer<typeof ExternalCardSchema>;
export type ExternalCollection = z.infer<typeof ExternalCollectionSchema>;

// Validate and sanitise incoming data
export function validateExternalCollection(data: unknown): ExternalCollection {
  const result = ExternalCollectionSchema.safeParse(data);
  if (!result.success) {
    console.error('External data validation failed:', result.error.issues);
    throw new Error('Invalid external data format');
  }
  return result.data;
}
```

### Secure HTTP Headers (Development)

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
});
```

### Secure Storage Patterns

```typescript
// src/utils/secureStorage.ts

// Never store sensitive data in localStorage
const SAFE_KEYS = ['theme', 'layout', 'cardSize', 'cardWidth', 'cardHeight', 'gap'];

export function safeSetItem(key: string, value: string): void {
  if (!SAFE_KEYS.includes(key)) {
    console.error(`Attempted to store unsafe key: ${key}`);
    return;
  }

  if (value.length > 10_000) {
    console.warn('Value too large for localStorage');
    return;
  }

  try {
    localStorage.setItem(`itemdeck:${key}`, value);
  } catch (e) {
    console.warn('localStorage unavailable:', e);
  }
}

export function safeGetItem(key: string): string | null {
  if (!SAFE_KEYS.includes(key)) {
    return null;
  }

  try {
    return localStorage.getItem(`itemdeck:${key}`);
  } catch {
    return null;
  }
}
```

### ESLint Security Rules

```json
// .eslintrc.json additions
{
  "plugins": ["security"],
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "react/no-danger": "error"
  }
}
```

### Security Tests

```typescript
// src/utils/security.test.ts
import { describe, it, expect } from 'vitest';
import { safeHTML, sanitizeHref, isValidUrl } from './security';

describe('Security utilities', () => {
  describe('safeHTML', () => {
    it('removes script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      expect(safeHTML(input)).toBe('<p>Hello</p>');
    });

    it('removes event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      expect(safeHTML(input)).not.toContain('onerror');
    });

    it('allows safe tags', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
      expect(safeHTML(input)).toBe(input);
    });
  });

  describe('sanitizeHref', () => {
    it('blocks javascript: URLs', () => {
      expect(sanitizeHref('javascript:alert(1)')).toBeNull();
    });

    it('blocks data: URLs', () => {
      expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('allows https: URLs', () => {
      expect(sanitizeHref('https://example.com')).toBe('https://example.com');
    });
  });

  describe('isValidUrl', () => {
    it('accepts valid https URLs', () => {
      expect(isValidUrl('https://example.com/image.jpg')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });

    it('rejects javascript: protocol', () => {
      expect(isValidUrl('javascript:void(0)')).toBe(false);
    });
  });
});
```

### Dependency Auditing

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
```

## Implementation Tasks

- [ ] Install DOMPurify: `npm install dompurify @types/dompurify`
- [ ] Install ESLint security plugin: `npm install -D eslint-plugin-security`
- [ ] Create `src/security/csp.ts` with CSP configuration
- [ ] Create `src/utils/security.ts` with sanitisation utilities
- [ ] Create `src/schemas/externalData.ts` with validation
- [ ] Configure secure HTTP headers in vite.config.ts
- [ ] Create secure storage utilities
- [ ] Add ESLint security rules
- [ ] Write security-focused unit tests
- [ ] Configure npm audit in CI
- [ ] Create production headers configuration (Netlify/Vercel)
- [ ] Document CSP configuration for deployment
- [ ] Audit existing code for security issues

## Success Criteria

- [ ] CSP configured and tested
- [ ] DOMPurify used for any HTML rendering
- [ ] All external data validated with Zod
- [ ] No dangerous URL protocols allowed
- [ ] Security ESLint rules passing
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] Security tests passing
- [ ] HTTP security headers configured

## Dependencies

- **Requires**: F-017 Testing Infrastructure
- **Blocks**: None

## Complexity

**Medium** - Multiple security layers require careful integration.

---

## Related Documentation

- [System Security Research](../../../../research/system-security.md)
- [Image Handling Security Research](../../../../research/image-handling-security.md)
- [ADR-009: CSP and DOMPurify for Security](../../../decisions/adrs/ADR-009-security.md)
- [v0.6.0 Milestone](../../milestones/v0.6.0.md)
