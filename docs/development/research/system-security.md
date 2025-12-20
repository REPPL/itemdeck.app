# System Security

## Executive Summary

For Itemdeck's overall security posture, implement **defence in depth**: React's built-in XSS escaping, **strict TypeScript**, **Content Security Policy**, **input validation with Zod**, and **regular dependency audits**. Focus on the OWASP Top 10 vulnerabilities relevant to client-side applications.

Key recommendations:
1. Never use `dangerouslySetInnerHTML` without DOMPurify sanitisation
2. Validate all external data with Zod schemas
3. Implement strict CSP headers
4. Run `npm audit` and Snyk in CI pipeline
5. Store no sensitive data in localStorage

## Current State in Itemdeck

Itemdeck currently uses:
- **React 18** with built-in XSS escaping
- **TypeScript 5** in strict mode
- **Vite** for bundling
- **No external data** loaded yet
- **No authentication** required

The foundation has minimal attack surface, but security measures should be established before adding external data sources.

## Research Findings

### OWASP Top 10 for Frontend Applications

| Risk | Relevance to Itemdeck | Priority |
|------|----------------------|----------|
| A03: Injection (XSS) | High - external content | Critical |
| A05: Security Misconfiguration | Medium - CSP, headers | High |
| A06: Vulnerable Components | High - npm dependencies | High |
| A07: Auth Failures | Low - no auth yet | Future |
| A08: Data Integrity | Medium - external config | Medium |
| A09: Logging Failures | Low - client-side | Low |

### React's Built-in XSS Protection

React automatically escapes values in JSX:

```tsx
// SAFE - React escapes the value
const userInput = '<script>alert("xss")</script>';
return <div>{userInput}</div>;
// Renders: &lt;script&gt;alert("xss")&lt;/script&gt;
```

Characters escaped: `<`, `>`, `&`, `'`, `"`

### Known XSS Vectors in React

```tsx
// DANGEROUS - Bypasses React's protection
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// DANGEROUS - href can contain javascript:
<a href={userProvidedUrl}>Click me</a>

// DANGEROUS - Dynamic attribute names
<div {...userProvidedProps} />

// DANGEROUS - Ref manipulation
ref.current.innerHTML = userContent;
```

### Secure Code Patterns

```typescript
// src/utils/security.ts
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Safe HTML rendering
export function safeHTML(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

// Safe URL validation
const SafeUrlSchema = z.string().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      // Only allow http(s) protocols
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

// Block javascript: and data: URLs
export function sanitizeHref(url: string): string | null {
  const dangerous = /^(javascript|data|vbscript):/i;
  if (dangerous.test(url.trim())) {
    console.warn('Blocked dangerous URL:', url);
    return null;
  }
  return url;
}
```

### TypeScript Security Benefits

```typescript
// tsconfig.json security settings
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "noImplicitAny": true,             // Require explicit types
    "strictNullChecks": true,          // Catch null/undefined errors
    "noImplicitReturns": true,         // Ensure all paths return
    "noUncheckedIndexedAccess": true,  // Safer array/object access
    "exactOptionalPropertyTypes": true, // Stricter optional types
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Input Validation with Zod

```typescript
// src/schemas/cardData.ts
import { z } from 'zod';

// Validate external card data
export const CardSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().refine(
    (url) => url.startsWith('https://'),
    'Only HTTPS URLs allowed'
  ),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
});

export const CardCollectionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  cards: z.array(CardSchema).max(10000),
  schema_version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

// Usage
export async function loadExternalCards(url: string): Promise<CardCollection> {
  const response = await fetch(url);
  const data = await response.json();

  // Validate and strip unknown properties
  const result = CardCollectionSchema.safeParse(data);
  if (!result.success) {
    console.error('Invalid card data:', result.error.issues);
    throw new Error('Card data validation failed');
  }

  return result.data;
}
```

### Dependency Security

```bash
# Package.json scripts for security checks
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "security": "snyk test",
    "security:monitor": "snyk monitor"
  }
}
```

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

### Secure Storage Patterns

```typescript
// src/utils/storage.ts

// NEVER store sensitive data in localStorage
// localStorage is accessible to any script on the page

// Safe: non-sensitive preferences
const SAFE_KEYS = ['theme', 'layout', 'cardSize', 'lastVisited'];

export function safeSetItem(key: string, value: string): void {
  if (!SAFE_KEYS.includes(key)) {
    console.error(`Attempted to store unsafe key: ${key}`);
    return;
  }

  // Limit value size
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

// For any auth tokens (future), use httpOnly cookies set by backend
```

### Content Security Policy

```typescript
// src/security/csp.ts

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],  // No 'unsafe-inline' or 'unsafe-eval'
  'style-src': ["'self'", "'unsafe-inline'"],  // CSS Modules need inline
  'img-src': [
    "'self'",
    'data:',
    'https://raw.githubusercontent.com',
    'https://upload.wikimedia.org',
  ],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://api.github.com',
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

// Output: default-src 'self'; script-src 'self'; ...
```

### Secure HTTP Headers

```typescript
// vite.config.ts (for development server)
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

// For production, configure on hosting platform:
// Netlify: netlify.toml
// Vercel: vercel.json
// Cloudflare: _headers file
```

### Environment Variable Safety

```typescript
// src/config/env.ts
import { z } from 'zod';

// Validate environment variables at startup
const EnvSchema = z.object({
  // Public vars only - prefixed with VITE_
  VITE_API_URL: z.string().url().optional(),
  VITE_GITHUB_API_URL: z.string().url().default('https://api.github.com'),
});

// Never expose these to client:
// - API secrets
// - Database credentials
// - Private keys
// - Internal service URLs

const result = EnvSchema.safeParse(import.meta.env);

if (!result.success) {
  console.error('Environment validation failed:', result.error.issues);
  // Don't expose details in production
  if (import.meta.env.DEV) {
    throw new Error('Invalid environment configuration');
  }
}

export const env = result.success ? result.data : {} as z.infer<typeof EnvSchema>;
```

### Third-Party Script Safety

```typescript
// src/utils/loadScript.ts

const ALLOWED_SCRIPT_SOURCES = [
  'https://cdn.example.com',
];

export function loadExternalScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Validate source
    const url = new URL(src);
    if (!ALLOWED_SCRIPT_SOURCES.some(allowed => src.startsWith(allowed))) {
      reject(new Error(`Script source not allowed: ${src}`));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';

    // Subresource Integrity (if hash known)
    // script.integrity = 'sha384-...';

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}
```

### Security Linting with ESLint

```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "plugin:security/recommended-legacy"
  ],
  "plugins": ["security"],
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "react/no-danger": "error"
  },
  "overrides": [
    {
      "files": ["*.tsx"],
      "rules": {
        "react/no-danger": "warn"  // Allow with warning for sanitized content
      }
    }
  ]
}
```

### Security Testing

```typescript
// src/__tests__/security.test.ts
import { safeHTML, sanitizeHref, isValidUrl } from '../utils/security';

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

### Security Checklist

```markdown
## Pre-Release Security Checklist

### Code Review
- [ ] No use of dangerouslySetInnerHTML without DOMPurify
- [ ] No javascript: or data: URLs in href/src attributes
- [ ] All external data validated with Zod schemas
- [ ] No sensitive data in localStorage
- [ ] No secrets in environment variables exposed to client

### Dependencies
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] All dependencies are actively maintained
- [ ] No dependencies with known supply chain issues
- [ ] Lock file (package-lock.json) committed

### Headers & CSP
- [ ] CSP configured and tested
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy set appropriately

### Build & Deploy
- [ ] Source maps not exposed in production
- [ ] Environment variables validated at build time
- [ ] HTTPS enforced
- [ ] Security headers set on hosting platform
```

## Recommendations for Itemdeck

### Priority 1: Input Validation

1. **Create Zod schemas** for all external data
2. **Validate at boundaries** - API responses, config loading
3. **Fail closed** - reject invalid data, don't try to fix it

### Priority 2: Content Security Policy

1. **Define strict CSP** with explicit allowlists
2. **Test in report-only** mode first
3. **Configure on hosting platform** for production

### Priority 3: Dependency Security

1. **Add npm audit** to CI pipeline
2. **Consider Snyk** for better detection
3. **Update dependencies** regularly
4. **Review changelogs** for security patches

### Priority 4: Secure Coding Practices

1. **Avoid dangerouslySetInnerHTML** except with DOMPurify
2. **Validate all URLs** before use
3. **Use TypeScript strict mode**
4. **Add security ESLint rules**

### Priority 5: Security Testing

1. **Write security-focused tests**
2. **Test XSS vectors** in card data
3. **Test URL validation** edge cases
4. **Automate in CI**

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "dompurify": "^3.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "eslint-plugin-security": "^2.x"
  }
}
```

### Bundle Size Impact

- DOMPurify: ~8KB gzipped
- Zod: ~12KB gzipped
- ESLint security plugin: dev only

### Performance Considerations

- Validation adds minimal overhead
- DOMPurify is fast for small content
- CSP has no runtime cost

### Monitoring (Future)

- Consider CSP violation reporting
- Log validation failures (not user data)
- Monitor for dependency vulnerabilities

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React XSS Guide - StackHawk](https://www.stackhawk.com/blog/react-xss-guide-examples-and-prevention/)
- [5 Best Practices for React with TypeScript Security - Snyk](https://snyk.io/blog/best-practices-react-typescript-security/)
- [Invicti - Is React Vulnerable to XSS?](https://www.invicti.com/blog/web-security/is-react-vulnerable-to-xss)
- [npm audit Documentation](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/)
- [Snyk CLI Documentation](https://docs.snyk.io/snyk-cli)
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)

---

## Related Documentation

- [Image Handling & Security](./image-handling-security.md) - Image-specific security
- [External Data Sources](./external-data-sources.md) - Secure data fetching
- [Configuration Hierarchy](./configuration-hierarchy.md) - Secure config validation

---

**Applies to**: Itemdeck v0.1.0+
