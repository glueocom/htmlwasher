---
name: typescript-strict
description: Strict TypeScript patterns for library code. Use when enforcing no-any types, adding explicit return types to public APIs, applying readonly modifiers, using const assertions for presets, or reviewing TypeScript code for type safety.
---

# TypeScript Strict

Patterns for strict type safety in TypeScript library code.

## Core Rules

1. **No `any`** — Use `unknown` for truly unknown types
2. **Explicit return types on public API** — Internal functions can infer
3. **Readonly by default** — Mutate only when necessary
4. **Const assertions** — For literal types and immutable data
5. **Template literal types** — For string unions like presets

## No `any` Types

```typescript
// ❌ Bad
function parse(data: any): any { ... }

// ✅ Good - use unknown
function parse(data: unknown): ParseResult { ... }

// ✅ Good - generic for JSON
function parseJson<T>(json: string): T {
  return JSON.parse(json) as T
}

// ✅ Good - type guard for validation
function processInput(data: unknown): string {
  if (typeof data !== 'string') {
    throw new TypeError('Expected string')
  }
  return data // narrowed to string
}
```

## Explicit Return Types (Public API Only)

```typescript
// ✅ Public API: explicit return types REQUIRED
export function wash(html: string, options?: WashOptions): WashResult {
  return processHtml(html, options)
}

export interface WashResult {
  html: string
  warnings: string[]
}

// ✅ Internal: inference is fine
function processHtml(html: string, options?: WashOptions) {
  // Return type inferred - OK for internal functions
  return { html: cleaned, warnings: [] }
}
```

## Const Assertions for Presets

```typescript
// ✅ Use `as const` for immutable preset definitions
export const TAG_PRESETS = {
  minimal: ['p', 'a', 'strong', 'em', 'br'],
  standard: ['html', 'head', 'body', 'title', 'h1', 'h2', 'h3', 'p', 'a', 'strong', 'i'],
  permissive: ['html', 'head', 'body', 'title', 'h1', 'h2', 'h3', 'p', 'div', 'span', 'a'],
} as const

// Type is automatically: { readonly minimal: readonly ["p", "a", ...]; ... }

export type TagPreset = keyof typeof TAG_PRESETS
// Type is: "minimal" | "standard" | "permissive"

export const REPLACEMENT_PRESETS = {
  none: {},
  semantic: { b: 'strong', div: 'p' },
} as const

export type ReplacementPreset = keyof typeof REPLACEMENT_PRESETS
```

## Readonly Modifiers

```typescript
// ✅ Immutable configuration interfaces
export interface WashOptions {
  readonly tagPreset?: TagPreset
  readonly replacementPreset?: ReplacementPreset
  readonly customTags?: readonly string[]
  readonly customAttributes?: Readonly<Record<string, readonly string[]>>
  readonly customReplacements?: Readonly<Record<string, string>>
  readonly title?: string
}

// ✅ Readonly function parameters (prevents accidental mutation)
function filterTags(
  tags: readonly string[], 
  allowed: ReadonlySet<string>
): string[] {
  return tags.filter(t => allowed.has(t))
}

// ✅ Readonly for constants
const DELETE_WITH_CONTENT: readonly string[] = [
  'script', 'style', 'iframe', 'object', 'embed'
] as const
```

## Type Guards

```typescript
// ✅ Type guard for runtime validation
function isTagPreset(value: unknown): value is TagPreset {
  return typeof value === 'string' && value in TAG_PRESETS
}

function isWashOptions(value: unknown): value is WashOptions {
  if (typeof value !== 'object' || value === null) return false
  
  const obj = value as Record<string, unknown>
  
  if (obj.tagPreset !== undefined && !isTagPreset(obj.tagPreset)) {
    return false
  }
  
  if (obj.customTags !== undefined && !Array.isArray(obj.customTags)) {
    return false
  }
  
  return true
}

// Usage
function wash(html: string, options?: unknown): WashResult {
  if (options !== undefined && !isWashOptions(options)) {
    throw new TypeError('Invalid options')
  }
  // options is now WashOptions | undefined
}
```

## Discriminated Unions (When Needed)

```typescript
// ✅ For operations that can fail in different ways
type ParseResult =
  | { ok: true; document: Document }
  | { ok: false; error: 'empty_input' | 'invalid_html' | 'encoding_error' }

function parseHtml(html: string): ParseResult {
  if (!html.trim()) {
    return { ok: false, error: 'empty_input' }
  }
  try {
    const doc = parse(html)
    return { ok: true, document: doc }
  } catch {
    return { ok: false, error: 'invalid_html' }
  }
}

// TypeScript narrows automatically
const result = parseHtml(input)
if (result.ok) {
  console.log(result.document) // Document
} else {
  console.log(result.error) // 'empty_input' | 'invalid_html' | 'encoding_error'
}
```

## Template Literal Types

```typescript
// ✅ For string patterns
type HtmlTag = 'p' | 'div' | 'span' | 'a' | 'img' | 'h1' | 'h2' | 'h3'
type EventHandler = `on${string}` // matches onclick, onload, etc.

// ✅ For preset option keys
type PresetOption<T extends string> = `${T}Preset`
// PresetOption<'tag'> = 'tagPreset'
// PresetOption<'replacement'> = 'replacementPreset'
```

## tsconfig.json

See [references/tsconfig-strict.md](references/tsconfig-strict.md) for full configuration.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true
  }
}
```
