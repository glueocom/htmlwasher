# Library Selection: htmlwasher-lib

## Summary

Replace .NET HTML processing stack (HtmlAgilityPack + HTML Tidy) with pure JavaScript using **DOMPurify** + **Cheerio**.

## Selected Libraries

| Purpose | Library | npm Weekly Downloads | GitHub Stars |
|---------|---------|---------------------|--------------|
| HTML Sanitization & XSS Prevention | **DOMPurify** | 14.2M | 16.3k |
| DOM Manipulation & Traversal | **Cheerio** | 14.2M | 29.9k |
| Node.js DOM Environment | **jsdom** (Node.js only) | 40M | 21.3k |
| Isomorphic DOMPurify Wrapper | **isomorphic-dompurify** | 1.5M | 532 |

## Why These Libraries

### DOMPurify
- Industry standard for HTML sanitization
- Created by Cure53 (security researchers)
- Smallest bundle (8.74 kB gzipped)
- Native TypeScript support (v3.2+)
- Zero open issues, actively maintained (last release: Dec 2025)
- Supports `ALLOWED_TAGS`, `ALLOWED_ATTR`, `KEEP_CONTENT`

### Cheerio
- jQuery-like API for server-side HTML manipulation
- 8x faster than jsdom for parsing
- Native TypeScript support
- Handles tag replacement, attribute filtering, DOM traversal
- Works in browser and Node.js

### jsdom (Node.js only)
- Provides DOM environment for DOMPurify in Node.js
- Required dependency for `isomorphic-dompurify`

## Package Architecture

Single npm package with **conditional exports**:

```
htmlwasher-lib/
├── src/
│   ├── index.ts          # Main entry, shared logic
│   ├── browser.ts        # Browser-specific (native DOM)
│   └── node.ts           # Node.js-specific (jsdom)
├── package.json          # Conditional exports config
```

**Browser bundle:** DOMPurify + Cheerio (~100 kB)
**Node.js bundle:** isomorphic-dompurify + Cheerio + jsdom (~1 MB)

## Feature Mapping

| .NET Feature | JavaScript Equivalent |
|--------------|----------------------|
| HTML Tidy (repair HTML) | DOMPurify (uses native/jsdom parser) |
| HtmlAgilityPack (DOM traversal) | Cheerio |
| Tag whitelist | DOMPurify `ALLOWED_TAGS` + Cheerio |
| Attribute whitelist | DOMPurify `ALLOWED_ATTR` + Cheerio |
| Tag replacement (b→strong) | Cheerio `.each()` + `.replaceWith()` |
| Delete with content | Cheerio `.remove()` |

## Alternatives Considered

| Library | Reason Not Selected |
|---------|---------------------|
| sanitize-html | No commits in 6 months, large bundle, no native TS |
| htmltidy2 | Requires native binary, Node.js only |
| happy-dom | Smaller community than jsdom |
| linkedom | Less mature ecosystem |
