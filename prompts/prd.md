# Product Requirements Document: htmlwasher

## Overview

**Product Name:** htmlwasher  
**Type:** npm package (TypeScript)  
**Distribution:** Internal use  
**Target Environments:** Browser & Node.js (isomorphic)

## Problem Statement

The current HTML washing functionality at htmlwasher.com relies on a .NET backend using HtmlAgilityPack and HTML Tidy. This creates:

- Server infrastructure costs
- Latency for users (round-trip to server)
- Maintenance burden of .NET codebase
- Inability to process HTML client-side

## Solution

A pure JavaScript/TypeScript library that replicates all HTML washing functionality, enabling:

- Client-side processing (no server required)
- Server-side processing when needed (Node.js)
- Single codebase for both environments
- Modern npm package with TypeScript support

---

## Functional Requirements

### FR-1: HTML Sanitization & Repair

The library MUST:
- Accept malformed/broken HTML as input
- Parse and repair HTML structure
- Output valid, well-formed HTML
- Preserve document structure (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`)

### FR-2: Tag Whitelisting

The library MUST:
- Remove HTML tags not in the allowed list
- Preserve text content when removing tags (unwrap behavior)
- Support three built-in presets:
  - `minimal`: p, a, strong, em, br
  - `standard`: Current htmlwasher.com configuration
  - `permissive`: Extended set including div, span, blockquote, etc.
- Support custom tag lists

### FR-3: Attribute Whitelisting

The library MUST:
- Remove attributes not in the allowed list for each tag
- Support per-tag attribute configuration
- Support three built-in presets matching tag presets
- Support custom attribute configurations

### FR-4: Tag Replacement

The library MUST:
- Replace specified tags with semantic equivalents
- Support two built-in presets:
  - `none`: No replacements
  - `semantic`: b→strong, div→p
- Support custom replacement mappings

### FR-5: Delete Tags With Content

The library MUST:
- Completely remove specified tags including all content
- Always remove: script, style, iframe, object, embed, applet, audio, video, canvas, frame, etc.
- This is NOT configurable (security requirement)

### FR-6: Image Alt Attributes

The library MUST:
- Ensure all `<img>` tags have an `alt` attribute
- Generate alt text from filename if missing
- Set empty alt if no source available

### FR-7: Title Management

The library MUST:
- Ensure `<title>` tag exists in `<head>`
- Accept optional title parameter
- Default to "New Page" if not provided and missing

---

## Non-Functional Requirements

### NFR-1: Isomorphic Architecture

- Single npm package
- Conditional exports for browser vs Node.js
- Browser: Use native DOM + DOMPurify (~100 kB)
- Node.js: Use jsdom + isomorphic-dompurify (~1 MB)

### NFR-2: TypeScript

- Written in TypeScript
- Ship type definitions
- No @types dependencies required
- Strict mode enabled

### NFR-3: Zero Configuration

- Works out of the box with sensible defaults
- `wash(html)` should "just work" with standard preset

### NFR-4: Performance

- Process typical HTML document (<100 KB) in <100ms
- No memory leaks on repeated processing

### NFR-5: Security

- No XSS vectors in output
- No code execution from input
- Leverage DOMPurify's security guarantees

---

## API Design

### Primary Function

```typescript
function wash(html: string, options?: WashOptions): WashResult;
```

### Options Interface

```typescript
interface WashOptions {
  // Preset selection
  tagPreset?: 'minimal' | 'standard' | 'permissive';
  replacementPreset?: 'none' | 'semantic';
  
  // Custom overrides (takes precedence over presets)
  customTags?: string[];
  customAttributes?: Record<string, string[]>;
  customReplacements?: Record<string, string>;
  
  // Document options
  title?: string;
}
```

### Result Interface

```typescript
interface WashResult {
  html: string;
  warnings: string[];
}
```

### Usage Examples

```typescript
import { wash } from 'htmlwasher';

// Basic usage (standard preset)
const result = wash(dirtyHtml);
console.log(result.html);

// Minimal preset
const minimal = wash(dirtyHtml, { tagPreset: 'minimal' });

// Semantic replacements
const semantic = wash(dirtyHtml, { 
  tagPreset: 'standard',
  replacementPreset: 'semantic'
});

// Full custom
const custom = wash(dirtyHtml, {
  customTags: ['p', 'a', 'strong'],
  customAttributes: { a: ['href'] },
  customReplacements: { b: 'strong' },
  title: 'My Document'
});
```

---

## Presets Definition

### Tag Presets

| Preset | Tags |
|--------|------|
| `minimal` | p, a, strong, em, br |
| `standard` | html, head, body, title, h1-h6, p, a, strong, i, hr, ul, ol, li, table, tbody, tr, td, th, img, ruby |
| `permissive` | All standard + div, span, b, u, br, thead, tfoot, caption, figure, figcaption, blockquote, pre, code, dl, dt, dd, rt, rp |

### Attribute Presets

| Preset | Configuration |
|--------|---------------|
| `minimal` | a: [href] |
| `standard` | a: [href], img: [src, alt, width, height], td/th: [colspan, rowspan] |
| `permissive` | All standard + a: [title, target, rel], img: [loading], th: [scope], blockquote: [cite], code/pre: [class] |

### Replacement Presets

| Preset | Replacements |
|--------|--------------|
| `none` | (none) |
| `semantic` | b→strong, div→p |

---

## Technical Architecture

### Package Structure

```
htmlwasher/
├── src/
│   ├── index.ts           # Main entry, types, exports
│   ├── wash.ts            # Core washing logic
│   ├── presets.ts         # Preset definitions
│   ├── browser.ts         # Browser-specific sanitize()
│   ├── node.ts            # Node.js-specific sanitize()
│   └── utils/
│       ├── tags.ts        # Tag manipulation helpers
│       ├── attributes.ts  # Attribute manipulation helpers
│       └── document.ts    # Document structure helpers
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Dependencies

| Package | Version | Environment |
|---------|---------|-------------|
| cheerio | ^1.1.x | Both |
| dompurify | ^3.3.x | Browser |
| isomorphic-dompurify | ^2.x | Node.js |

### package.json Exports

```json
{
  "exports": {
    ".": {
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "default": "./dist/node.js"
    }
  }
}
```

---

## Processing Pipeline

```
Input HTML
    │
    ▼
┌─────────────────────────┐
│ 1. Sanitize & Repair    │  ← DOMPurify (platform-specific)
│    (fix malformed HTML) │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 2. Delete Dangerous     │  ← Cheerio .remove()
│    (script, style, etc) │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 3. Replace Tags         │  ← Cheerio (if preset ≠ none)
│    (b→strong, div→p)    │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 4. Remove Unallowed     │  ← Cheerio .replaceWith(contents)
│    Tags (keep content)  │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 5. Remove Unallowed     │  ← Cheerio .removeAttr()
│    Attributes           │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 6. Ensure Title         │  ← Cheerio
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 7. Ensure Image Alt     │  ← Cheerio
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 8. Final Sanitize       │  ← DOMPurify (second pass)
└─────────────────────────┘
    │
    ▼
Output WashResult { html, warnings }
```

---

## Success Criteria

1. **Parity:** Output matches current htmlwasher.com for standard preset
2. **Performance:** <100ms for typical documents
3. **Bundle Size:** Browser bundle <150 kB gzipped
4. **Type Safety:** Full TypeScript coverage, no `any`
5. **Tests:** >90% code coverage
6. **Documentation:** Complete API docs with examples

---

## Out of Scope (v1)

- Word document (.docx) conversion
- PDF conversion
- File upload handling
- Pretty-printing/formatting output
- CSS sanitization
- Custom hooks/middleware

---

## Future Considerations (v2+)

- Pretty-print option using js-beautify
- Additional presets for specific CMS platforms
- Streaming API for large documents
- Web Worker support for browser
- Plugin system for custom transformations
