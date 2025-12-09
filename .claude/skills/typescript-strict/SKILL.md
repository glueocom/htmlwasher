---
name: typescript-strict
description: Strict TypeScript patterns for library code. Use when enforcing no-any types, adding explicit return types to public APIs, applying readonly modifiers, using discriminated unions for options/results, or reviewing TypeScript code for type safety.
---

# TypeScript Strict

Patterns for strict type safety in TypeScript library code.

## Core Rules

1. **No `any`** - Use `unknown` for truly unknown types
2. **Explicit return types on public API** - Internal functions can infer
3. **Readonly by default** - Mutate only when necessary
4. **Discriminated unions** - For options and result types

## No `any` Types

```typescript
// Bad
function parse(data: any): any { ... }

// Good
function parse(data: unknown): ParseResult { ... }

// For JSON parsing
function parseJson<T>(json: string): T {
  return JSON.parse(json) as T
}

// For external data
function processResponse(data: unknown) {
  if (isValidResponse(data)) {
    // data is now typed
  }
}
```

## Explicit Return Types (Public API)

```typescript
// Public API: explicit return types
export function wash(html: string, options?: WashOptions): WashResult {
  return processHtml(html, options)
}

export function createPreset(name: string): TagPreset {
  return { name, tags: [] }
}

// Internal: inference is fine
function processHtml(html: string, options?: WashOptions) {
  // Return type inferred
  return { html: cleaned, warnings }
}
```

## Readonly Modifiers

```typescript
// Immutable configuration
interface WashOptions {
  readonly tagPreset?: 'minimal' | 'standard' | 'permissive'
  readonly customTags?: readonly string[]
  readonly customAttributes?: Readonly<Record<string, readonly string[]>>
}

// Immutable arrays
const ALLOWED_TAGS: readonly string[] = ['p', 'a', 'strong'] as const

// Readonly function parameters
function filterTags(tags: readonly string[], allowed: readonly string[]) {
  return tags.filter(t => allowed.includes(t))
}
```

## Discriminated Unions

For result types:

```typescript
type WashResult =
  | { success: true; html: string; warnings: string[] }
  | { success: false; error: string }

function wash(html: string): WashResult {
  try {
    const result = process(html)
    return { success: true, html: result.html, warnings: result.warnings }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// Usage with narrowing
const result = wash(input)
if (result.success) {
  console.log(result.html)  // TypeScript knows html exists
} else {
  console.error(result.error)  // TypeScript knows error exists
}
```

For options:

```typescript
type OutputFormat =
  | { format: 'html' }
  | { format: 'text'; preserveWhitespace?: boolean }
  | { format: 'markdown'; flavor?: 'github' | 'commonmark' }

function convert(input: string, output: OutputFormat): string {
  switch (output.format) {
    case 'html':
      return toHtml(input)
    case 'text':
      return toText(input, output.preserveWhitespace)  // narrowed
    case 'markdown':
      return toMarkdown(input, output.flavor)  // narrowed
  }
}
```

## Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isWashOptions(value: unknown): value is WashOptions {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (obj.tagPreset !== undefined) {
    if (!['minimal', 'standard', 'permissive'].includes(obj.tagPreset as string)) {
      return false
    }
  }
  return true
}
```

## tsconfig.json Settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

See [references/tsconfig-strict.md](references/tsconfig-strict.md) for detailed compiler options.
