# Implement htmlwasher

Create the `htmlwasher` npm package in this directory.

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
| `vitest` | Tests |
| `biome` | Lint + format |
| `ts-json-schema-generator` | Generate JSON Schema from TS types |
| `@types/sanitize-html` | Type definitions |

---

## Project Structure

```
htmlwasher/
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
│   ├── index.js
│   ├── index.d.ts
│   └── schema.json           # Generated JSON Schema
├── scripts/
│   └── generate-schema.ts    # Schema generation script
├── package.json
├── tsconfig.json
├── biome.json
└── vitest.config.ts
```

---

## Implementation Order

### 1. Project setup

```bash
pnpm init
pnpm add sanitize-html yaml ajv
pnpm add -D typescript vitest @biomejs/biome ts-json-schema-generator @types/sanitize-html
```

### 2. package.json

```json
{
  "name": "htmlwasher",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./schema.json": "./dist/schema.json"
  },
  "files": ["dist"],
  "scripts": {
    "schema:generate": "tsx scripts/generate-schema.ts",
    "build": "pnpm run schema:generate && tsc",
    "test": "vitest run",
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
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
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

### 5. Schema generation script (`scripts/generate-schema.ts`)

```typescript
import { createGenerator } from 'ts-json-schema-generator'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config = {
  path: join(__dirname, '../src/schema/sanitize-config.ts'),
  tsconfig: join(__dirname, '../tsconfig.json'),
  type: 'SanitizeConfigSchema',
  additionalProperties: false,
}

const schema = createGenerator(config).createSchema(config.type)

// Ensure dist directory exists
const distDir = join(__dirname, '../dist')
mkdirSync(distDir, { recursive: true })

// Write schema
const outputPath = join(distDir, 'schema.json')
writeFileSync(outputPath, JSON.stringify(schema, null, 2))

console.log(`Schema generated: ${outputPath}`)
```

### 6. Parse setup with Ajv (`src/parse-setup.ts`)

```typescript
import YAML from 'yaml'
import Ajv from 'ajv'
import type { SanitizeConfigSchema } from './schema/sanitize-config.js'

// Import generated schema (will exist after build)
import schema from '../dist/schema.json' assert { type: 'json' }

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

### 7. Main function (`src/wash.ts`)

```typescript
import sanitizeHtml from 'sanitize-html'
import { parseSetup } from './parse-setup.js'
import { presets } from './presets/index.js'
import type { SanitizeConfigSchema } from './schema/sanitize-config.js'

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

### 8. Presets (`src/presets/`)

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

### 9. Tests

Follow patterns in `.claude/skills/testing-html-processing`:
- YAML parsing tests
- Schema validation tests (valid and invalid configs)
- Tag whitelisting tests
- XSS prevention tests

### 10. Build + verify

```bash
pnpm run schema:generate  # Generate JSON Schema first
pnpm build                # Compile TypeScript
pnpm test                 # Run tests
ls dist/schema.json       # Verify schema exists
```

---

## Key Constraints

1. **Node.js only** — No browser support
2. **Two public functions**: `wash()` and `parseSetup()`
3. **YAML config** → JSON Schema validation (Ajv) → sanitize-html
4. **Safe subset only** — No function options (transformTags, etc.)
5. **Schema in dist/** — Bundled with package AND available for external use
6. **Security** — Always block dangerous tags regardless of config
