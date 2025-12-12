# Product Requirements Document: htmlwasher

## Overview

| Field | Value |
|-------|-------|
| Product | htmlwasher |
| Type | npm package (TypeScript) |
| Distribution | Public npm |
| Target | **Node.js only** |

## Problem Statement

The current htmlwasher.com relies on .NET backend (HtmlAgilityPack + HTML Tidy). This creates server costs, latency, and maintenance burden.

## Solution

A pure JavaScript/TypeScript library using **sanitize-html** with YAML-based configuration.

---

## Public API

### 1. `wash(html, options?)` — Sanitize HTML

```typescript
function wash(html: string, options?: WashOptions): WashResult
```

### 2. `parseSetup(yaml)` — Validate YAML configuration

```typescript
function parseSetup(yaml: string): ParseSetupResult
```

---

## Types

```typescript
interface WashOptions {
  /** YAML configuration string (sanitize-html format) */
  setup?: string
  
  /** Document title (added to <title> if missing) */
  title?: string
}

interface WashResult {
  html: string
  warnings: string[]
}

type ParseSetupResult =
  | { ok: true; config: SanitizeHtmlConfig }
  | { ok: false; errorCode: ErrorCode; errorMessage: string }

type ErrorCode =
  | 'YAML_SYNTAX_ERROR'
  | 'INVALID_ALLOWED_TAGS'
  | 'INVALID_ALLOWED_ATTRIBUTES'
  | 'INVALID_TRANSFORM_TAGS'
  | 'INVALID_DISALLOWED_MODE'
  | 'UNKNOWN_OPTION'
```

---

## YAML Configuration Format

Maps directly to sanitize-html options:

```yaml
# Allowed tags (whitelist)
allowedTags:
  - p
  - a
  - strong
  - em
  - img
  - table
  - tr
  - td

# Allowed attributes per tag
allowedAttributes:
  a:
    - href
  img:
    - src
    - alt
    - width
    - height
  td:
    - colspan
    - rowspan

# Tag replacements
transformTags:
  b: strong
  i: em
  div: p

# Disallowed tag handling
# 'discard' = remove tag, keep content (default)
# 'escape' = convert to HTML entities
disallowedTagsMode: discard
```

---

## Built-in Presets

```typescript
import { presets } from 'htmlwasher'

// presets.minimal  - p, a, strong, em, br
// presets.standard - current htmlwasher.com config
// presets.permissive - extended with div, span, code, pre, blockquote
```

---

## Usage Examples

### Basic

```typescript
import { wash } from 'htmlwasher'

const result = wash('<div><script>alert(1)</script><p>Hello</p></div>')
// result.html = '<p>Hello</p>'
```

### With YAML setup

```typescript
import { wash } from 'htmlwasher'

const setup = `
allowedTags:
  - p
  - a
allowedAttributes:
  a:
    - href
transformTags:
  b: strong
`

const result = wash(html, { setup, title: 'My Document' })
```

### Validate before use

```typescript
import { parseSetup, wash } from 'htmlwasher'

const result = parseSetup(userYaml)

if (!result.ok) {
  console.error(`${result.errorCode}: ${result.errorMessage}`)
  return
}

const washed = wash(html, { setup: userYaml })
```

---

## Error Codes

| Code | Cause |
|------|-------|
| `YAML_SYNTAX_ERROR` | Invalid YAML syntax |
| `INVALID_ALLOWED_TAGS` | allowedTags must be string[] |
| `INVALID_ALLOWED_ATTRIBUTES` | allowedAttributes must be Record<string, string[]> |
| `INVALID_TRANSFORM_TAGS` | transformTags must be Record<string, string> |
| `INVALID_DISALLOWED_MODE` | Must be 'discard', 'escape', or 'recursiveEscape' |
| `UNKNOWN_OPTION` | Unrecognized configuration key |

---

## Processing Pipeline

```
Input: HTML + WashOptions
         │
         ▼
┌─────────────────────────┐
│ 1. Parse YAML (yaml)    │
│    Validate (Zod)       │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. Merge with defaults  │  ← Always block: script, style, iframe
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. sanitize-html        │  ← Main sanitization
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. Post-process         │  ← Title, img alt
└─────────────────────────┘
         │
         ▼
Output: WashResult { html, warnings }
```

---

## Security (Always Enforced)

**Always removed tags** (regardless of YAML config):
- script, style, iframe, object, embed, applet, frame, frameset

**Always removed attributes**:
- All `on*` event handlers
- `javascript:` URLs
- `data:` URLs (except safe image types)

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Platform | Node.js only (server-side) |
| TypeScript | Strict mode, no `any` |
| Performance | < 50ms typical documents |
| Test coverage | > 90% |

---

## Out of Scope (v1)

- Browser support
- Word/PDF conversion
- Pretty-printing
- Streaming API
- Custom sanitize-html hooks
