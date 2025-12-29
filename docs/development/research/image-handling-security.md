# Image Handling & Security

## Executive Summary

For secure image handling in Itemdeck, implement a **layered security approach**: Content Security Policy (CSP) for allowed sources, **DOMPurify** for any user-provided SVG content, and **URL validation** for external images. Consider a proxy service for external images to avoid CORS issues and add security controls.

Key recommendations:
1. Implement strict CSP with explicit img-src whitelist
2. Use DOMPurify for any user-provided or external SVG content
3. Validate and sanitise all image URLs before use
4. Consider an image proxy for untrusted external sources

## Current State in Itemdeck

Itemdeck currently uses:
- **Mock data** with imageUrl field (not yet loaded)
- **No CSP** configured
- **No image validation** or sanitisation
- **No external image loading** implemented

Security measures are not yet implemented as images aren't loaded.

## Research Findings

### Threat Model for Image Handling

| Threat | Vector | Impact | Mitigation |
|--------|--------|--------|------------|
| XSS via SVG | Malicious `<script>` in SVG | Full compromise | DOMPurify, CSP |
| XSS via Data URI | javascript: in src | Full compromise | URL validation, CSP |
| SSRF | External URLs to internal IPs | Data leak | URL validation |
| Resource exhaustion | Huge images | DoS | Size limits |
| Privacy leak | Tracking pixels | User tracking | Proxy, CSP |
| CORS exploitation | Canvas taint | Token theft | crossorigin attribute |

### Content Security Policy for Images

```html
<!-- HTTP Header (preferred) -->
Content-Security-Policy:
  default-src 'self';
  img-src 'self'
         data:
         https://raw.githubusercontent.com
         https://upload.wikimedia.org
         https://your-image-proxy.example.com;
  style-src 'self' 'unsafe-inline';
  script-src 'self';
```

```tsx
// src/components/Meta/CSPMeta.tsx (fallback for static hosting)
export function CSPMeta() {
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https://raw.githubusercontent.com https://upload.wikimedia.org",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'none'",
  ].join('; ');

  return (
    <meta httpEquiv="Content-Security-Policy" content={csp} />
  );
}
```

### CSP Directives Reference

| Directive | Purpose | Example Value |
|-----------|---------|---------------|
| `img-src` | Image sources | `'self' https://cdn.example.com` |
| `default-src` | Fallback for all | `'self'` |
| `connect-src` | Fetch/XHR targets | `'self' https://api.example.com` |
| `script-src` | Script sources | `'self'` (avoid 'unsafe-inline') |
| `style-src` | Stylesheet sources | `'self' 'unsafe-inline'` |
| `frame-ancestors` | Embedding control | `'none'` |

### URL Validation

```typescript
// src/utils/imageUrl.ts
import { z } from 'zod';

// Allowed URL protocols
const ALLOWED_PROTOCOLS = ['https:', 'data:'];

// Allowed domains for external images
const ALLOWED_DOMAINS = [
  'raw.githubusercontent.com',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'i.imgur.com',
  // Add your image proxy domain
];

// Blocked private IP ranges
const PRIVATE_IP_PATTERNS = [
  /^localhost/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

export const ImageUrlSchema = z.string().refine(
  (url) => isValidImageUrl(url),
  { message: 'Invalid or untrusted image URL' }
);

export function isValidImageUrl(url: string): boolean {
  // Allow data URIs for base64 images
  if (url.startsWith('data:image/')) {
    return isValidDataUri(url);
  }

  try {
    const parsed = new URL(url);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false;
    }

    // Check for private IPs
    if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(parsed.hostname))) {
      return false;
    }

    // Check domain allowlist
    if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
      console.warn(`Domain not in allowlist: ${parsed.hostname}`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function isValidDataUri(uri: string): boolean {
  // Only allow image MIME types
  const validPrefixes = [
    'data:image/png',
    'data:image/jpeg',
    'data:image/gif',
    'data:image/webp',
    'data:image/svg+xml',
  ];

  if (!validPrefixes.some(prefix => uri.startsWith(prefix))) {
    return false;
  }

  // Check for embedded scripts in SVG data URIs
  if (uri.startsWith('data:image/svg+xml')) {
    const decoded = decodeURIComponent(uri.split(',')[1] || '');
    if (containsScriptContent(decoded)) {
      return false;
    }
  }

  // Size limit (1MB base64)
  if (uri.length > 1_400_000) {
    return false;
  }

  return true;
}

function containsScriptContent(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick=, onload=, etc.
    /xlink:href\s*=\s*["']javascript:/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(content));
}
```

### SVG Sanitisation with DOMPurify

```typescript
// src/utils/svgSanitizer.ts
import DOMPurify from 'dompurify';

// Configure DOMPurify for SVG
const purifyConfig: DOMPurify.Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  ALLOWED_TAGS: [
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
    'polygon', 'text', 'tspan', 'textPath', 'defs', 'use', 'symbol',
    'clipPath', 'mask', 'pattern', 'linearGradient', 'radialGradient',
    'stop', 'filter', 'feGaussianBlur', 'feOffset', 'feBlend',
    'feMerge', 'feMergeNode', 'title', 'desc',
  ],
  ALLOWED_ATTR: [
    'viewBox', 'xmlns', 'width', 'height', 'fill', 'stroke', 'stroke-width',
    'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2',
    'points', 'transform', 'opacity', 'class', 'id', 'clip-path', 'mask',
    'gradientUnits', 'offset', 'stop-color', 'stop-opacity',
    'font-family', 'font-size', 'text-anchor', 'dominant-baseline',
  ],
  FORBID_TAGS: ['script', 'style', 'foreignObject', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'xlink:href'],
};

export function sanitizeSVG(svgContent: string): string {
  return DOMPurify.sanitize(svgContent, purifyConfig);
}

export function isSafeSVG(svgContent: string): boolean {
  const sanitized = sanitizeSVG(svgContent);
  // If sanitization changed the content, it wasn't safe
  return sanitized.length > 0 && !containsDangerousPatterns(svgContent);
}

function containsDangerousPatterns(content: string): boolean {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /xlink:href\s*=\s*["'](?!#)/i,  // External xlink:href
    /<foreignObject/i,
    /<iframe/i,
    /data:/i,  // No data URIs in SVG
  ];

  return patterns.some(p => p.test(content));
}
```

### Safe SVG Component

```tsx
// src/components/SafeSVG/SafeSVG.tsx
import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SafeSVGProps {
  content: string;
  className?: string;
  width?: number;
  height?: number;
  fallback?: React.ReactNode;
}

export function SafeSVG({
  content,
  className,
  width,
  height,
  fallback = null,
}: SafeSVGProps) {
  const sanitizedContent = useMemo(() => {
    if (!content) return null;

    const clean = DOMPurify.sanitize(content, {
      USE_PROFILES: { svg: true },
      RETURN_DOM: false,
    });

    if (!clean || clean.length === 0) {
      console.warn('SVG content was completely sanitized - may be malicious');
      return null;
    }

    return clean;
  }, [content]);

  if (!sanitizedContent) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={className}
      style={{ width, height }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
```

### Image Proxy Pattern

```typescript
// Server-side: src/api/imageProxy.ts (if using server)
// This would be a serverless function or backend endpoint

interface ProxyConfig {
  allowedDomains: string[];
  maxSize: number;
  timeout: number;
}

const config: ProxyConfig = {
  allowedDomains: [
    'upload.wikimedia.org',
    'raw.githubusercontent.com',
    'i.imgur.com',
  ],
  maxSize: 10 * 1024 * 1024, // 10MB
  timeout: 10000, // 10 seconds
};

export async function proxyImage(imageUrl: string): Promise<Response> {
  // Validate URL
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  // Check domain allowlist
  if (!config.allowedDomains.includes(url.hostname)) {
    return new Response('Domain not allowed', { status: 403 });
  }

  // Only allow HTTPS
  if (url.protocol !== 'https:') {
    return new Response('HTTPS required', { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Itemdeck-Image-Proxy/1.0',
      },
    });

    clearTimeout(timeout);

    // Verify content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return new Response('Not an image', { status: 400 });
    }

    // Check size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > config.maxSize) {
      return new Response('Image too large', { status: 413 });
    }

    // Return proxied image with security headers
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response('Timeout', { status: 504 });
    }
    return new Response('Fetch failed', { status: 502 });
  }
}
```

### Client-Side Proxy Usage

```typescript
// src/utils/imageProxy.ts

const PROXY_BASE = '/api/image-proxy';

export function getProxiedUrl(originalUrl: string): string {
  // For development, use original URL with validation
  if (import.meta.env.DEV) {
    return originalUrl;
  }

  // For production, route through proxy
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
}

// Usage in component
function CardImage({ card }: { card: Card }) {
  const imageUrl = useMemo(() => {
    if (!card.imageUrl) return null;
    if (!isValidImageUrl(card.imageUrl)) return null;
    return getProxiedUrl(card.imageUrl);
  }, [card.imageUrl]);

  if (!imageUrl) {
    return <ImagePlaceholder />;
  }

  return <img src={imageUrl} alt={card.name} />;
}
```

### CORS-Safe Image Loading

```tsx
// src/components/SecureImage/SecureImage.tsx
import { useState, useEffect, useCallback } from 'react';
import { isValidImageUrl } from '../../utils/imageUrl';

interface SecureImageProps {
  src: string;
  alt: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function SecureImage({
  src,
  alt,
  crossOrigin = 'anonymous',
  fallback,
  onLoad,
  onError,
  className,
}: SecureImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [validatedSrc, setValidatedSrc] = useState<string | null>(null);

  useEffect(() => {
    // Validate URL before attempting to load
    if (isValidImageUrl(src)) {
      setValidatedSrc(src);
      setStatus('loading');
    } else {
      setStatus('error');
      onError?.(new Error('Invalid or untrusted image URL'));
    }
  }, [src, onError]);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setStatus('error');
    onError?.(new Error('Image failed to load'));
  }, [onError]);

  if (status === 'error' || !validatedSrc) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={validatedSrc}
      alt={alt}
      crossOrigin={crossOrigin}
      onLoad={handleLoad}
      onError={handleError}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}
```

### Image Security Checklist Component

```typescript
// src/utils/imageSecurityCheck.ts

export interface SecurityCheckResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

export function checkImageSecurity(url: string): SecurityCheckResult {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check if it's a data URI
    if (url.startsWith('data:')) {
      if (!url.startsWith('data:image/')) {
        issues.push('Data URI is not an image type');
      }
      if (url.length > 1_000_000) {
        recommendations.push('Large data URI - consider external hosting');
      }
      if (url.includes('javascript:')) {
        issues.push('Data URI contains javascript: protocol');
      }
    } else {
      const parsed = new URL(url);

      // Protocol check
      if (parsed.protocol !== 'https:') {
        issues.push('URL does not use HTTPS');
      }

      // Private IP check
      if (isPrivateIP(parsed.hostname)) {
        issues.push('URL points to private/internal IP');
      }

      // Suspicious path patterns
      if (/\.(php|asp|jsp|cgi)$/i.test(parsed.pathname)) {
        recommendations.push('URL points to dynamic script, not static image');
      }

      // Query string with suspicious params
      if (parsed.searchParams.has('callback') || parsed.searchParams.has('jsonp')) {
        recommendations.push('URL contains callback/jsonp parameters');
      }
    }
  } catch {
    issues.push('Invalid URL format');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}

function isPrivateIP(hostname: string): boolean {
  const patterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^0\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
    /\.local$/i,
    /\.internal$/i,
  ];

  return patterns.some(p => p.test(hostname));
}
```

### Security Best Practices Summary

| Practice | Implementation | Priority |
|----------|----------------|----------|
| CSP img-src | Explicit domain allowlist | High |
| URL validation | Zod schema + custom checks | High |
| SVG sanitisation | DOMPurify with SVG profile | High |
| HTTPS only | Reject http:// URLs | High |
| Private IP blocking | Regex pattern matching | High |
| Size limits | Check Content-Length | Medium |
| Image proxy | Server-side relay | Medium |
| CORS attributes | crossOrigin="anonymous" | Medium |
| referrerPolicy | no-referrer | Low |

## Recommendations for Itemdeck

### Priority 1: Content Security Policy

1. **Configure CSP header** on server/hosting platform
2. **Define explicit img-src** allowlist
3. **Block inline scripts** to prevent XSS
4. **Test with CSP report-only** mode first

### Priority 2: URL Validation

1. **Create ImageUrlSchema** with Zod
2. **Validate all external URLs** before use
3. **Block private IPs** and localhost
4. **Whitelist trusted domains**

### Priority 3: SVG Security

1. **Install DOMPurify**: `npm install dompurify @types/dompurify`
2. **Create SafeSVG component** for any user SVG
3. **Configure strict SVG profile**
4. **Keep DOMPurify updated** (security patches)

### Priority 4: Image Proxy (Optional)

1. **Consider proxy for untrusted sources**
2. **Validate content-type** server-side
3. **Enforce size limits**
4. **Add caching headers**

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "dompurify": "^3.x"
  },
  "devDependencies": {
    "@types/dompurify": "^3.x"
  }
}
```

### Bundle Size Impact

- DOMPurify: ~8KB gzipped
- URL validation utilities: ~1KB

### CSP Testing

```bash
# Test CSP with report-only mode first
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
```

### Security Audit Checklist

Before deployment:
- [ ] CSP configured and tested
- [ ] All image URLs validated
- [ ] SVG content sanitised
- [ ] No inline event handlers in SVG
- [ ] DOMPurify is latest version
- [ ] Private IPs blocked
- [ ] HTTPS enforced for external images

## References

- [React Content Security Policy Guide - StackHawk](https://www.stackhawk.com/blog/react-content-security-policy-guide-what-it-is-and-how-to-enable-it/)
- [CSP Quick Reference](https://content-security-policy.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Securing React with DOMPurify](https://blog.openreplay.com/securing-react-with-dompurify/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React CORS Guide - StackHawk](https://www.stackhawk.com/blog/react-cors-guide-what-it-is-and-how-to-enable-it/)
- [MDN - CORS enabled images](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)

---

## Related Documentation

### Research
- [System Security](./system-security.md) - Overall application security
- [Asset Management](./asset-management.md) - Image loading strategies
- [External Data Sources](./external-data-sources.md) - Fetching remote content

### Features
- [F-003: Image Fallback System](../roadmap/features/completed/F-003-image-fallback-system.md) - Image fallback implementation

### Decisions
- [ADR-009: Security](../decisions/adrs/ADR-009-security.md) - Security architecture decisions

---

**Applies to**: Itemdeck v0.1.0+
