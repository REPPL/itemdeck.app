# ADR-009: Implement CSP and DOMPurify for Security

## Status

Accepted

## Context

Itemdeck will accept external data which creates security risks:
- XSS through card descriptions
- Malicious URLs in card data
- Injection through configuration

We need security measures that:
1. Prevent XSS attacks
2. Validate all external input
3. Restrict resource loading
4. Don't impair functionality

## Decision

Implement **defence in depth** with:
1. **Content Security Policy** (CSP) headers
2. **DOMPurify** for HTML sanitisation
3. **Zod validation** for all external data
4. **URL validation** for links and images

## Consequences

### Positive

- **Multiple layers** - If one fails, others catch it
- **CSP blocks inline scripts** - Prevents most XSS
- **DOMPurify** - Battle-tested HTML sanitisation
- **Zod** - Schema validation already in place
- **No sensitive data** - Client-side only, no auth

### Negative

- **CSP complexity** - Requires careful configuration
- **Development friction** - Some inline styles blocked
- **Bundle size** - DOMPurify adds ~8KB

### Mitigations

- Test CSP in report-only mode first
- Allow `unsafe-inline` for styles (CSS Modules need it)
- Only sanitise when rendering HTML content

## CSP Configuration

```typescript
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': [
    "'self'",
    'data:',
    'https://raw.githubusercontent.com',
    'https://upload.wikimedia.org',
  ],
  'connect-src': [
    "'self'",
    'https://api.github.com',
    'https://commons.wikimedia.org',
  ],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
};
```

## Security Layers

| Layer | Protection | Implementation |
|-------|------------|----------------|
| CSP | Script injection | HTTP headers |
| DOMPurify | HTML XSS | Runtime sanitisation |
| Zod | Data tampering | Schema validation |
| URL validation | Protocol attacks | Allowlist check |

## Alternatives Considered

### CSP Only
- Browser-level protection
- **Rejected**: Doesn't catch all XSS vectors

### DOMPurify Only
- HTML sanitisation
- **Rejected**: Doesn't protect against script injection

### Neither (React escaping only)
- Built-in protection
- **Rejected**: Insufficient for `dangerouslySetInnerHTML`

---

## Related Documentation

- [System Security Research](../../../research/system-security.md)
- [Image Handling Security Research](../../../research/image-handling-security.md)
- [F-018: Security Hardening](../../roadmap/features/planned/F-018-security-hardening.md)
