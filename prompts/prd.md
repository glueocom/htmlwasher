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

A pure JavaScript/TypeScript library using **sanitize-html** with YAML-based configuration, validated against a JSON Schema generated from sanitize-html types.

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
  | 'SCHEMA_VALIDATION_ERROR'
```

---

## YAML Configuration Format

Maps directly to sanitize-html options (safe subset only):

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

# Allowed classes per tag
allowedClasses:
  p:
    - intro
    - highlight

# Disallowed tag handling
# 'discard' = remove tag, keep content (default)
# 'escape' = convert to HTML entities
# 'recursiveEscape' = escape tag and all children
disallowedTagsMode: discard

# Self-closing tags
selfClosing:
  - img
  - br
  - hr

# Allow protocol-relative URLs
allowProtocolRelative: false
```

### Safe Subset (Exposed Options)

Only these sanitize-html options are exposed via YAML:

| Option | Type | Description |
|--------|------|-------------|
| `allowedTags` | string[] | Tags to allow |
| `allowedAttributes` | Record<string, string[]> | Attributes per tag |
| `allowedClasses` | Record<string, string[]> | Classes per tag |
| `disallowedTagsMode` | enum | How to handle disallowed tags |
| `selfClosing` | string[] | Self-closing tags |
| `allowProtocolRelative` | boolean | Allow // URLs |

**Not exposed** (security/complexity):
- `transformTags` (function)
- `exclusiveFilter` (function)
- `textFilter` (function)
- `parser` (complex object)
- `allowedIframeHostnames` (security risk)
- `allowedScriptHostnames` (security risk)

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

## Validation Architecture

### JSON Schema Generation (Build Time)

1. Create wrapper type in `src/schema/sanitize-config.ts`:
   ```typescript
   import type { IOptions } from 'sanitize-html'
   
   /** Safe subset of sanitize-html options for YAML config */
   export type SanitizeConfigSchema = Pick<IOptions,
     | 'allowedTags'
     | 'allowedAttributes'
     | 'allowedClasses'
     | 'disallowedTagsMode'
     | 'selfClosing'
     | 'allowProtocolRelative'
   >
   ```

2. Generate JSON Schema via pnpm script:
   ```bash
   pnpm run schema:generate
   ```

3. Output: `dist/schema.json`

### Runtime Validation (Ajv)

1. Parse YAML → JavaScript object (`yaml` library)
2. Validate against JSON Schema (`ajv` library)
3. Return typed config or structured error

---

## Processing Pipeline

```
Input: HTML + WashOptions
         │
         ▼
┌─────────────────────────┐
│ 1. Parse YAML           │  ← yaml (eemeli)
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. Validate JSON Schema │  ← Ajv
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. Merge with defaults  │  ← Always block: script, style, iframe
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. sanitize-html        │  ← Main sanitization
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 5. Post-process         │  ← Title, img alt
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
| Schema output | `dist/schema.json` (bundled + exportable) |

---

## Out of Scope (v1)

- Browser support
- Word/PDF conversion
- Pretty-printing
- Streaming API
- Custom sanitize-html hooks (transformTags, etc.)
