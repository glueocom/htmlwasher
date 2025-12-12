# Implement htmlsanitization-server

Create the `htmlsanitization-server` npm package in this directory.

## Decisions

- **TypeScript-only**: Publish source TypeScript files directly (no JS compilation). Internal use only.
- **Schema output**: Generate to `dist/schema.json` (gitignored), copied to package root during `pack:folder`.
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
│   ├── index.test.ts         # All tests (co-located)
│   ├── wash.ts               # wash() implementation
│   ├── parse-setup.ts        # parseSetup() with Ajv validation
│   ├── schema/
│   │   └── sanitize-config.ts  # Wrapper type for schema generation
│   └── presets/
│       └── index.ts          # Export preset YAML strings (embedded, not separate files)
├── dist/                     # Gitignored build output
│   └── schema.json           # Generated JSON Schema
├── package.json
├── tsconfig.json
├── biome.json
└── jest.config.ts
```

**Note**: Presets are embedded as string literals in `presets/index.ts` rather than separate YAML files. This avoids ESM/CJS compatibility issues with Jest (import.meta.url vs __dirname conflict when SWC transforms to CJS).

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
    "./schema.json": "./schema.json"
  },
  "files": ["src/**/*.ts", "!src/**/*.test.ts", "schema.json"],
  "scripts": {
    "schema:generate": "mkdir -p dist && ts-json-schema-generator ... -o dist/schema.json",
    "pack:folder": "pnpm run schema:generate && cp dist/schema.json schema.json && pnpm pack ... && rm schema.json",
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

**Important**: Do NOT use `Pick<IOptions, ...>` because `IOptions` has complex types (RegExp, functions) that aren't JSON-serializable and cause schema generation to fail. Create a dedicated interface with simplified types:

```typescript
/**
 * Safe subset of sanitize-html options for YAML configuration.
 * Only JSON-serializable options are exposed (no functions, RegExp, etc.)
 *
 * @additionalProperties false
 */
export interface SanitizeConfigSchema {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;  // Simplified from IOptions
  allowedClasses?: Record<string, string[]>;     // Simplified from IOptions
  disallowedTagsMode?: "discard" | "escape" | "recursiveEscape" | "completelyDiscard";
  selfClosing?: string[];
  allowProtocolRelative?: boolean;
}
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

**Important implementation details**:
1. Do NOT spread config directly (`...config`) - sanitize-html crashes on undefined values
2. Filter event handlers from allowedAttributes even if config tries to allow them
3. Only pass defined properties to sanitize-html

```typescript
import sanitizeHtml from 'sanitize-html'
import { parseSetup } from './parse-setup.ts'
import { presets } from './presets/index.ts'
import type { SanitizeConfigSchema } from './schema/sanitize-config.ts'

const ALWAYS_BLOCKED = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'frame', 'frameset']

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
    const fallback = parseSetup(presets.standard)
    config = fallback.ok ? fallback.config : {}
  } else {
    config = parsed.config
  }

  // 2. Build sanitize-html options - only include DEFINED properties
  const sanitizeOptions: sanitizeHtml.IOptions = {
    exclusiveFilter: (frame) => ALWAYS_BLOCKED.includes(frame.tag),
  }

  if (config.allowedTags !== undefined) {
    sanitizeOptions.allowedTags = config.allowedTags
  }
  if (config.allowedAttributes !== undefined) {
    // SECURITY: Filter out event handlers (on*) even if config allows them
    sanitizeOptions.allowedAttributes = filterEventHandlers(config.allowedAttributes)
  }
  // ... other properties similarly

  // 3. Sanitize
  let result = sanitizeHtml(html, sanitizeOptions)

  // 4. Post-process (title, image alt)
  return { html: result, warnings }
}

// Filter out event handler attributes for security
function filterEventHandlers(attrs: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [tag, attrList] of Object.entries(attrs)) {
    result[tag] = attrList.filter((attr) => !attr.toLowerCase().startsWith("on"))
  }
  return result
}
```

### 7. Presets (`src/presets/index.ts`)

**Important**: Do NOT use `readFileSync` with `import.meta.url` - this causes ESM/CJS conflicts when Jest/SWC transforms the code. Embed presets as string literals instead:

```typescript
export const presets = {
  minimal: `# Minimal preset
allowedTags:
  - p
  - a
  - strong
  - em
  - br
allowedAttributes:
  a:
    - href
disallowedTagsMode: discard
allowProtocolRelative: false
`,
  standard: `# Standard preset
allowedTags:
  - p
  - a
  - strong
  # ... more tags
allowedAttributes:
  a:
    - href
    - title
  # ... more attributes
`,
  permissive: `# Permissive preset
# ... extended configuration
`,
} as const

export type PresetName = keyof typeof presets
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
pnpm test                 # Run tests (auto-generates schema)
pnpm pack:folder          # Creates package-out/ with schema.json included
ls package-out/schema.json  # Verify schema in package output
```

---

## Key Constraints

1. **Node.js only** — No browser support
2. **TypeScript-only** — Source .ts files published directly, no JS compilation
3. **Internal use only** — Not published to public npm
4. **Two public functions**: `wash()` and `parseSetup()`
5. **YAML config** → JSON Schema validation (Ajv) → sanitize-html
6. **Safe subset only** — No function options (transformTags, etc.)
7. **Schema in dist/** — Generated to `dist/schema.json` (gitignored), copied to package root during `pack:folder`
8. **Security** — Always block dangerous tags AND event handlers regardless of config

## Lessons Learned

- **Schema type**: Use dedicated interface, not `Pick<IOptions>` (complex types break schema generation)
- **Presets**: Embed as string literals, not file reads (ESM/CJS Jest conflicts)
- **Config passing**: Check for undefined before passing to sanitize-html (crashes otherwise)
- **Event handlers**: Must explicitly filter `on*` attributes from allowedAttributes
- **Jest transformer**: Project uses `@swc/jest`, works fine (spec mentioned ts-jest)
- **Test location**: Co-located `*.test.ts` files, not separate `__tests__/` directory
