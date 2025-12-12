# Implement htmlsanitization-server

Create the `htmlsanitization-server` npm package in this directory.

## Decisions

- **TypeScript-only**: Publish source TypeScript files directly (no JS compilation). Internal use only.
- **Schema output**: Generate `schema.json` to `dist/` folder (only generated artifact).
- **Testing**: Use Jest (NOT Vitest).

## Reference

- `prompts/prd.md` — Requirements, API, types

## Agent

- `.claude/agents/ts-coder.md` — TypeScript coding principles

## Skills

- `.claude/skills/typescript-strict` — Type safety patterns
- `.claude/skills/testing-html-processing` — Test patterns
- `.claude/skills/release` — npm publishing

---

## Dependencies

### Production

| Package | Purpose |
|---------|---------|
| `sanitize-html` | HTML sanitization |
| `yaml` | YAML parsing (eemeli/yaml, built-in TS) |
| `ajv` | JSON Schema validation (150M+ downloads, fastest) |

### Development

| Package | Purpose |
|---------|---------|
| `typescript` | Compiler |
| `jest` | Tests |
| `ts-jest` | Jest TypeScript transformer |
| `@types/jest` | Jest type definitions |
| `biome` | Lint + format |
| `ts-json-schema-generator` | Generate JSON Schema from TS types |
| `@types/sanitize-html` | Type definitions |

---

## Project Structure

```
htmlsanitization-server/
├── src/
│   ├── index.ts              # Public exports
│   ├── wash.ts               # wash() implementation
│   ├── parse-setup.ts        # parseSetup() with Ajv validation
│   ├── schema/
│   │   └── sanitize-config.ts  # Wrapper type for schema generation
│   ├── presets/
│   │   ├── index.ts          # Export preset YAML strings
│   │   ├── minimal.yaml
│   │   ├── standard.yaml
│   │   └── permissive.yaml
│   └── __tests__/
│       ├── wash.test.ts
│       ├── parse-setup.test.ts
│       └── presets.test.ts
├── dist/
│   └── schema.json           # Generated JSON Schema (only generated artifact)
├── package.json
├── tsconfig.json
├── biome.json
└── jest.config.ts
```

---

## Implementation Order

### 1. Project setup

```bash
pnpm init
pnpm add sanitize-html yaml ajv
pnpm add -D typescript jest ts-jest @types/jest @biomejs/biome ts-json-schema-generator @types/sanitize-html
```

### 2. package.json

```json
{
  "name": "htmlsanitization-server",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schema.json": "./dist/schema.json"
  },
  "files": ["src", "dist"],
  "scripts": {
    "schema:generate": "ts-json-schema-generator --path src/schema/sanitize-config.ts --type SanitizeConfigSchema --no-top-ref -o dist/schema.json",
    "build": "pnpm run schema:generate",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "lint": "biome check src",
    "format": "biome format --write src"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### 3. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

### 4. Schema wrapper type (`src/schema/sanitize-config.ts`)

```typescript
import type { IOptions } from 'sanitize-html'

/**
 * Safe subset of sanitize-html options for YAML configuration.
 * Only JSON-serializable options are exposed.
 * 
 * @additionalProperties false
 */
export type SanitizeConfigSchema = Pick<IOptions,
  | 'allowedTags'
  | 'allowedAttributes'
  | 'allowedClasses'
  | 'disallowedTagsMode'
  | 'selfClosing'
  | 'allowProtocolRelative'
>
```

### 5. Parse setup with Ajv (`src/parse-setup.ts`)

```typescript
import YAML from 'yaml'
import Ajv from 'ajv'
import type { SanitizeConfigSchema } from './schema/sanitize-config.ts'

// Import generated schema (run `pnpm build` first)
import schema from '../dist/schema.json' with { type: 'json' }

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile<SanitizeConfigSchema>(schema)

export type ParseSetupResult =
  | { ok: true; config: SanitizeConfigSchema }
  | { ok: false; errorCode: 'YAML_SYNTAX_ERROR' | 'SCHEMA_VALIDATION_ERROR'; errorMessage: string }

export function parseSetup(yamlString: string): ParseSetupResult {
  // 1. Parse YAML
  const doc = YAML.parseDocument(yamlString)
  if (doc.errors.length > 0) {
    return {
      ok: false,
      errorCode: 'YAML_SYNTAX_ERROR',
      errorMessage: doc.errors[0].message,
    }
  }

  const data = doc.toJS()

  // 2. Validate against JSON Schema
  if (!validate(data)) {
    const error = validate.errors?.[0]
    const path = error?.instancePath || ''
    const message = error?.message || 'Unknown validation error'
    
    return {
      ok: false,
      errorCode: 'SCHEMA_VALIDATION_ERROR',
      errorMessage: `${path ? path + ': ' : ''}${message}`,
    }
  }

  return { ok: true, config: data }
}
```

### 6. Main function (`src/wash.ts`)

```typescript
import sanitizeHtml from 'sanitize-html'
import { parseSetup } from './parse-setup.ts'
import { presets } from './presets/index.ts'
import type { SanitizeConfigSchema } from './schema/sanitize-config.ts'

const ALWAYS_BLOCKED = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'frame']

export interface WashOptions {
  setup?: string
  title?: string
}

export interface WashResult {
  html: string
  warnings: string[]
}

export function wash(html: string, options?: WashOptions): WashResult {
  const warnings: string[] = []

  // 1. Parse setup YAML (or use default)
  const setupYaml = options?.setup ?? presets.standard
  const parsed = parseSetup(setupYaml)

  let config: SanitizeConfigSchema
  if (!parsed.ok) {
    warnings.push(`Setup error: ${parsed.errorMessage}`)
    // Fall back to standard preset
    const fallback = parseSetup(presets.standard)
    config = fallback.ok ? fallback.config : {}
  } else {
    config = parsed.config
  }

  // 2. Build sanitize-html options with security overrides
  const sanitizeOptions: sanitizeHtml.IOptions = {
    ...config,
    // Always block dangerous tags
    exclusiveFilter: (frame) => ALWAYS_BLOCKED.includes(frame.tag),
  }

  // 3. Sanitize
  let result = sanitizeHtml(html, sanitizeOptions)

  // 4. Post-process
  result = ensureTitle(result, options?.title)
  result = ensureImageAlt(result)

  return { html: result, warnings }
}

function ensureTitle(html: string, title?: string): string {
  // Implementation: add <title> if missing
  return html
}

function ensureImageAlt(html: string): string {
  // Implementation: add empty alt to images without alt
  return html
}
```

### 7. Presets (`src/presets/`)

```typescript
// src/presets/index.ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const presets = {
  minimal: readFileSync(join(__dirname, 'minimal.yaml'), 'utf-8'),
  standard: readFileSync(join(__dirname, 'standard.yaml'), 'utf-8'),
  permissive: readFileSync(join(__dirname, 'permissive.yaml'), 'utf-8'),
}
```

### 8. Tests

Follow patterns in `.claude/skills/testing-html-processing`:
- YAML parsing tests
- Schema validation tests (valid and invalid configs)
- Tag whitelisting tests
- XSS prevention tests

### 9. Build + verify

```bash
pnpm build                # Generate JSON Schema
pnpm typecheck            # Type check (no emit)
pnpm test                 # Run tests
ls dist/schema.json       # Verify schema exists
```

---

## Key Constraints

1. **Node.js only** — No browser support
2. **TypeScript-only** — Source .ts files published directly, no JS compilation
3. **Internal use only** — Not published to public npm
4. **Two public functions**: `wash()` and `parseSetup()`
5. **YAML config** → JSON Schema validation (Ajv) → sanitize-html
6. **Safe subset only** — No function options (transformTags, etc.)
7. **Schema in dist/** — Generated JSON Schema for validation
8. **Security** — Always block dangerous tags regardless of config
