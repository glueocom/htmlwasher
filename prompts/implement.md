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
| `sanitize-html` | HTML sanitization (all-in-one) |
| `yaml` | YAML parsing (eemeli/yaml, built-in TS types) |
| `zod` | Runtime validation + type inference |

### Development

| Package | Purpose |
|---------|---------|
| `typescript` | Compiler |
| `vitest` | Tests |
| `biome` | Lint + format |

---

## Project Structure

```
htmlwasher/
├── src/
│   ├── index.ts          # Public exports
│   ├── wash.ts           # wash() implementation
│   ├── parse-setup.ts    # parseSetup() + Zod schema
│   ├── presets/
│   │   ├── index.ts      # Export preset YAML strings
│   │   ├── minimal.yaml
│   │   ├── standard.yaml
│   │   └── permissive.yaml
│   └── __tests__/
│       ├── wash.test.ts
│       ├── parse-setup.test.ts
│       └── presets.test.ts
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
pnpm add sanitize-html yaml zod
pnpm add -D typescript vitest @biomejs/biome @types/sanitize-html
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
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
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

### 4. Zod schema (`src/parse-setup.ts`)

```typescript
import { z } from 'zod'
import YAML from 'yaml'

const setupSchema = z.object({
  allowedTags: z.array(z.string()).optional(),
  allowedAttributes: z.record(z.string(), z.array(z.string())).optional(),
  transformTags: z.record(z.string(), z.string()).optional(),
  disallowedTagsMode: z.enum(['discard', 'escape', 'recursiveEscape']).optional(),
}).strict()

export type SanitizeHtmlConfig = z.infer<typeof setupSchema>

export function parseSetup(yaml: string): ParseSetupResult {
  // 1. Parse YAML
  const doc = YAML.parseDocument(yaml)
  if (doc.errors.length > 0) {
    return { ok: false, errorCode: 'YAML_SYNTAX_ERROR', errorMessage: doc.errors[0].message }
  }

  // 2. Validate with Zod
  const result = setupSchema.safeParse(doc.toJS())
  if (!result.success) {
    const issue = result.error.issues[0]
    return {
      ok: false,
      errorCode: mapZodErrorToCode(issue),
      errorMessage: issue.message,
    }
  }

  return { ok: true, config: result.data }
}
```

### 5. Presets (`src/presets/`)

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

### 6. Main function (`src/wash.ts`)

```typescript
import sanitizeHtml from 'sanitize-html'
import { parseSetup } from './parse-setup.js'
import { presets } from './presets/index.js'

const ALWAYS_BLOCKED = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'frame']

export function wash(html: string, options?: WashOptions): WashResult {
  const warnings: string[] = []

  // 1. Parse setup YAML (or use default)
  const setupYaml = options?.setup ?? presets.standard
  const parsed = parseSetup(setupYaml)

  if (!parsed.ok) {
    warnings.push(`Setup error: ${parsed.errorMessage}`)
  }

  const config = parsed.ok ? parsed.config : parseSetup(presets.standard).config!

  // 2. Build sanitize-html options
  const sanitizeOptions = {
    ...config,
    exclusiveFilter: (frame) => ALWAYS_BLOCKED.includes(frame.tag),
  }

  // 3. Sanitize
  let result = sanitizeHtml(html, sanitizeOptions)

  // 4. Post-process
  result = ensureTitle(result, options?.title)
  result = ensureImageAlt(result)

  return { html: result, warnings }
}
```

### 7. Tests

Follow patterns in `.claude/skills/testing-html-processing`:
- Tag whitelisting
- Attribute filtering
- Tag transformation
- XSS prevention
- YAML validation errors

### 8. Build + verify

```bash
pnpm build
pnpm test
```

---

## Key Constraints

1. **Node.js only** — No browser support needed
2. **Two public functions**: `wash()` and `parseSetup()`
3. **YAML config**: Direct mapping to sanitize-html options
4. **Security**: Always block dangerous tags regardless of config
5. **Type safety**: Zod schema → TypeScript types (no duplication)
